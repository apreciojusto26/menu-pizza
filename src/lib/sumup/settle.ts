/**
 * settleCheckout(ref) — el ÚNICO escritor del pedido pagado para todo este
 * flujo. Tanto el webhook como el poll de estado llaman a ESTA función, que
 * es en sí misma idempotente; ninguno de los dos escribe directamente.
 *
 * "Pull-based": siempre vuelve a consultar a SumUp server-side en vez de
 * confiar en el body de cualquier webhook — SumUp no firma sus webhooks
 * (developer.sumup.com/online-payments/webhooks/), el payload es solo
 * `{event_type, id}`.
 *
 * Los "ports" están inyectados con los defaults reales conectados acá,
 * sobreescribibles en los tests — así se puede probar toda la lógica sin
 * tocar Redis, SumUp ni Resend de verdad.
 */
import { resolveCart } from "../cart/resolve";
import type { PaidOrder, ResolvedCartLine } from "../cart/types";
import {
  acquireLock,
  getOrderRecord,
  getSession,
  putOrderRecord,
  recordFailure,
  releaseLock,
} from "../kv";
import { getAuthoritativeCatalog } from "../menuCatalog";
import { notifyOpsAlert, notifyOrderPaid } from "../notifyOrder";
import { getCheckoutByRef, majorAmountToCents } from "./checkout";
import type { CheckoutSession, SettleResult } from "./types";

// Mismo tope que el poll de estado del cliente, para que 'failed' se alcance
// más o menos al mismo tiempo sin importar cuál de los dos caminos maneja los reintentos.
const MAX_ATTEMPTS_BEFORE_FAILED = 5;

function buildPaidOrder(
  ref: string,
  sumupCheckoutId: string,
  lines: readonly ResolvedCartLine[],
  totalAmount: number,
): PaidOrder {
  return {
    reference: ref,
    sumupCheckoutId,
    lines,
    totalAmount,
    currency: "EUR",
    paidAt: new Date().toISOString(),
  };
}

export interface SettlePorts {
  readonly acquireLock: (ref: string) => Promise<boolean>;
  readonly releaseLock: (ref: string) => Promise<void>;
  readonly getSession: (ref: string) => Promise<CheckoutSession | null>;
  readonly recordFailure: (
    ref: string,
    error: string,
  ) => Promise<{ readonly attempt: number }>;
  readonly getCheckoutByRef: (
    ref: string,
  ) => ReturnType<typeof getCheckoutByRef>;
  readonly getAuthoritativeCatalog: () => ReturnType<
    typeof getAuthoritativeCatalog
  >;
  readonly getOrderRecord: (ref: string) => Promise<PaidOrder | null>;
  readonly putOrderRecord: (ref: string, order: PaidOrder) => Promise<void>;
  readonly notifyOrderPaid: (order: PaidOrder) => Promise<void>;
  readonly notifyOpsAlert: (payload: {
    readonly ref: string;
    readonly error: string;
    readonly attempt?: number;
  }) => Promise<void>;
}

const defaultPorts: SettlePorts = {
  acquireLock,
  releaseLock,
  getSession,
  recordFailure,
  getCheckoutByRef,
  getAuthoritativeCatalog: () =>
    getAuthoritativeCatalog(
      import.meta.env.PUBLIC_MENU_SHEET_URL?.trim() || undefined,
    ),
  getOrderRecord,
  putOrderRecord,
  notifyOrderPaid,
  notifyOpsAlert,
};

async function handleFailure(
  ports: SettlePorts,
  ref: string,
  error: string,
): Promise<SettleResult> {
  console.error(`settleCheckout failed — ref ${ref}: ${error}`);
  const record = await ports.recordFailure(ref, error);
  await ports.notifyOpsAlert({ ref, error, attempt: record.attempt });
  return record.attempt >= MAX_ATTEMPTS_BEFORE_FAILED
    ? { status: "failed", ref }
    : { status: "retrying", attempt: record.attempt };
}

/**
 * El único escritor. Idempotente y seguro de llamar repetida o
 * concurrentemente — tanto el webhook como el poll de estado lo llaman
 * directo.
 */
export async function settleCheckout(
  ref: string,
  ports: SettlePorts = defaultPorts,
): Promise<SettleResult> {
  // Paso 1 — lock de concurrencia. ¿Otro intento de settle en curso lo tiene?
  const locked = await ports.acquireLock(ref);
  if (!locked) {
    return { status: "pending" };
  }

  try {
    // Paso 2 — SumUp es la fuente de verdad del estado de pago (nunca el body del webhook).
    const checkout = await ports.getCheckoutByRef(ref);
    if (!checkout || checkout.status !== "PAID") {
      return { status: "pending" };
    }
    const sumupAmountCents = majorAmountToCents(checkout.amount);

    // Paso 3 — dedupe ANTES de intentar escribir nada. Redis es fuertemente
    // consistente, así que esta única lectura alcanza (no hace falta un
    // fallback de búsqueda externo como en el proyecto de origen con Shopify).
    const knownOrder = await ports.getOrderRecord(ref);
    if (knownOrder) {
      return { status: "paid", reference: knownOrder.reference };
    }

    // Paso 4 — relectura en vivo de la sesión, nunca una copia cacheada.
    const session = await ports.getSession(ref);
    if (!session) {
      return await handleFailure(
        ports,
        ref,
        "No session found for ref — cannot build order",
      );
    }

    // Paso 5 — el carrito se vuelve a resolver contra el catálogo VIGENTE
    // (no el que se usó al crear la sesión), para detectar un precio que
    // haya cambiado en el Sheet mientras el pago estaba en curso.
    const catalog = await ports.getAuthoritativeCatalog();
    const resolved = resolveCart(session.lines, catalog);
    if (resolved.lines.length === 0) {
      return await handleFailure(
        ports,
        ref,
        "Resolved cart is empty — cannot build order",
      );
    }
    const freshAmountCents = majorAmountToCents(resolved.totalAmount);

    // Paso 6 — guardia de triple igualdad: lo que se cobró al crear la
    // sesión, lo que el catálogo dice AHORA, y lo que SumUp realmente cobró
    // deben coincidir los tres. Cualquier discrepancia aborta — no se
    // escribe ningún pedido.
    if (
      session.amountCents !== freshAmountCents ||
      freshAmountCents !== sumupAmountCents
    ) {
      return await handleFailure(
        ports,
        ref,
        `Total mismatch: session=${session.amountCents} resolved=${freshAmountCents} sumup=${sumupAmountCents}`,
      );
    }

    // Paso 7 — escribe, después notifica. La marca de dedupe queda grabada
    // antes de que el email pueda fallar, así un settle repetido nunca
    // reescribe ni reenvía el aviso.
    const order = buildPaidOrder(
      ref,
      checkout.id,
      resolved.lines,
      resolved.totalAmount,
    );
    await ports.putOrderRecord(ref, order);
    await ports.notifyOrderPaid(order);
    return { status: "paid", reference: order.reference };
  } catch (err) {
    // Paso 8 — dead-letter + alerta ante cualquier fallo, incluyendo errores de red/API.
    return await handleFailure(
      ports,
      ref,
      err instanceof Error ? err.message : String(err),
    );
  } finally {
    await ports.releaseLock(ref);
  }
}
