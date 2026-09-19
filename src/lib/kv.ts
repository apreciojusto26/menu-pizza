/**
 * Upstash Redis (REST) — el único estado externo que necesita el checkout:
 * mapa ref->sesión, el lock de concurrencia de settleCheckout, y el
 * registro de pedidos pagados (que sirve a la vez de dedupe fuerte y de
 * fuente de datos para el email de aviso).
 */
import { Redis } from "@upstash/redis";
import { getSecret } from "astro:env/server";

import type { PaidOrder } from "./cart/types";
import type { CheckoutSession } from "./sumup/types";

const SESSION_TTL_SECONDS = 60 * 60 * 24; // 24h
const LOCK_TTL_SECONDS = 60;

let client: Redis | null = null;

function getClient(): Redis {
  if (client) return client;

  const url = getSecret("UPSTASH_REDIS_REST_URL");
  const token = getSecret("UPSTASH_REDIS_REST_TOKEN");
  if (!url || !token) {
    throw new Error(
      "Missing UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN — server misconfigured",
    );
  }

  client = new Redis({ url, token });
  return client;
}

export async function putSession(
  ref: string,
  session: CheckoutSession,
): Promise<void> {
  await getClient().set(`sumup:sess:${ref}`, session, {
    ex: SESSION_TTL_SECONDS,
  });
}

export async function getSession(ref: string): Promise<CheckoutSession | null> {
  const value = await getClient().get<CheckoutSession>(`sumup:sess:${ref}`);
  return value ?? null;
}

/** SET NX EX 60 — true si esta llamada tomó el lock, false si otro intento de settle ya lo tiene. */
export async function acquireLock(ref: string): Promise<boolean> {
  const result = await getClient().set(`sumup:lock:${ref}`, "1", {
    nx: true,
    ex: LOCK_TTL_SECONDS,
  });
  return result === "OK";
}

export async function releaseLock(ref: string): Promise<void> {
  await getClient().del(`sumup:lock:${ref}`);
}

/**
 * Marca de dedupe fuerte (`sumup:order:{ref}`), escrita justo después de
 * confirmar un pago. Redis es fuertemente consistente acá (a diferencia del
 * índice de búsqueda de Shopify en el proyecto de origen), así que esta
 * lectura sola alcanza para el dedupe — no hace falta un fallback de
 * búsqueda externo.
 */
export async function putOrderRecord(
  ref: string,
  order: PaidOrder,
): Promise<void> {
  await getClient().set(`sumup:order:${ref}`, order, {
    ex: SESSION_TTL_SECONDS,
  });
}

export async function getOrderRecord(ref: string): Promise<PaidOrder | null> {
  const value = await getClient().get<PaidOrder>(`sumup:order:${ref}`);
  return value ?? null;
}

export interface FailureRecord {
  readonly error: string;
  readonly attempt: number;
  readonly lastAttemptAt: string;
}

/**
 * Registro de fallos (`sumup:dl:{ref}`) — pago confirmado en SumUp pero sin
 * poder escribir el pedido. Incrementa `attempt` entre llamadas para que
 * settleCheckout decida 'retrying' vs 'failed'.
 */
export async function recordFailure(
  ref: string,
  error: string,
): Promise<FailureRecord> {
  const key = `sumup:dl:${ref}`;
  const existing = await getClient().get<FailureRecord>(key);

  const record: FailureRecord = {
    error,
    attempt: (existing?.attempt ?? 0) + 1,
    lastAttemptAt: new Date().toISOString(),
  };

  await getClient().set(key, record, { ex: SESSION_TTL_SECONDS });
  return record;
}
