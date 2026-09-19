/**
 * POST /api/checkout/session — revalida el carrito server-side, persiste el
 * mapa ref->sesión en Redis y crea el Checkout de SumUp. El total cobrado
 * SIEMPRE sale de `resolveCart` contra el catálogo autoritativo — el body
 * de la request nunca aporta precios, solo `{menuItemId, priceLabel,
 * quantity}` por línea.
 */
import type { APIRoute } from "astro";

import { resolveCart, MAX_CART_LINES } from "../../../lib/cart/resolve";
import type { CartLine } from "../../../lib/cart/types";
import { putSession } from "../../../lib/kv";
import { getAuthoritativeCatalog } from "../../../lib/menuCatalog";
import { resolveCanonicalOrigin } from "../../../lib/site-origin";
import {
  buildCheckoutRedirectUrl,
  createCheckout,
  majorAmountToCents,
  newRef,
} from "../../../lib/sumup/checkout";

export const prerender = false;

interface SessionRequestBody {
  readonly lines: readonly CartLine[];
}

function isSessionRequestBody(value: unknown): value is SessionRequestBody {
  if (!value || typeof value !== "object") return false;
  const body = value as Record<string, unknown>;
  if (!Array.isArray(body.lines) || body.lines.length === 0) return false;
  if (body.lines.length > MAX_CART_LINES) return false;

  return body.lines.every(
    (line): line is CartLine =>
      !!line &&
      typeof line === "object" &&
      typeof (line as CartLine).menuItemId === "string" &&
      typeof (line as CartLine).priceLabel === "string" &&
      typeof (line as CartLine).quantity === "number",
  );
}

export const POST: APIRoute = async ({ request, url }) => {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  if (!isSessionRequestBody(raw)) {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  try {
    // Nunca derivar los callbacks de pago del header Host entrante. Se
    // resuelve antes de cualquier llamada externa o persistencia para que
    // una configuración de producción inválida falle cerrado, sin dejar
    // una sesión huérfana.
    const canonicalOrigin = resolveCanonicalOrigin(url);

    const sheetUrl = import.meta.env.PUBLIC_MENU_SHEET_URL?.trim() || undefined;
    const catalog = await getAuthoritativeCatalog(sheetUrl);
    const resolved = resolveCart(raw.lines, catalog);

    if (resolved.lines.length === 0) {
      return Response.json({ error: "empty_cart" }, { status: 400 });
    }
    if (resolved.invalidLines.length > 0) {
      return Response.json(
        { error: "invalid_lines", invalidLines: resolved.invalidLines },
        { status: 422 },
      );
    }

    const amountCents = majorAmountToCents(resolved.totalAmount);
    const ref = newRef();
    await putSession(ref, {
      lines: resolved.lines.map(({ menuItemId, priceLabel, quantity }) => ({
        menuItemId,
        priceLabel,
        quantity,
      })),
      amountCents,
    });

    const webhookUrl = new URL(
      "/api/sumup/webhook",
      canonicalOrigin,
    ).toString();
    const redirectUrl = buildCheckoutRedirectUrl(canonicalOrigin, ref);
    const checkout = await createCheckout({
      ref,
      amountCents,
      webhookUrl,
      redirectUrl,
    });

    return Response.json(
      { ref, checkoutId: checkout.id, totalAmount: resolved.totalAmount },
      { status: 200 },
    );
  } catch (err) {
    console.error("POST /api/checkout/session failed", err);
    return Response.json({ error: "server_error" }, { status: 500 });
  }
};
