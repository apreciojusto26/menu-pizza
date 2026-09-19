/**
 * Aviso por email (Resend) cuando SumUp confirma un pago. Best-effort y
 * no-throw a propósito: el pedido ya quedó persistido en Redis por
 * settleCheckout ANTES de llamar a esto, así que un fallo de envío nunca
 * debe hacer fallar ni reintentar el pago — solo queda log en Vercel.
 */
import { Resend } from "resend";
import { getSecret } from "astro:env/server";

import { formatAmount } from "./cart/format";
import type { PaidOrder } from "./cart/types";

let client: Resend | null = null;

function getClient(): Resend {
  if (client) return client;

  const apiKey = getSecret("RESEND_API_KEY");
  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY — server misconfigured");
  }

  client = new Resend(apiKey);
  return client;
}

const renderOrderEmailHtml = (order: PaidOrder): string => {
  const rows = order.lines
    .map(
      (line) => `
        <tr>
          <td>${line.itemName} — ${line.priceLabel}</td>
          <td style="text-align:center">${line.quantity}</td>
          <td style="text-align:right">${formatAmount(line.lineTotal)}</td>
        </tr>`,
    )
    .join("");

  return `
    <h1>Nuevo pedido pagado</h1>
    <p>Referencia: <strong>${order.reference}</strong></p>
    <p>Pagado: ${order.paidAt}</p>
    <table cellpadding="6" style="border-collapse:collapse;width:100%">
      <thead>
        <tr>
          <th style="text-align:left">Producto</th>
          <th style="text-align:center">Cant.</th>
          <th style="text-align:right">Subtotal</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="font-size:1.2em"><strong>Total: ${formatAmount(order.totalAmount)}</strong></p>
  `;
};

/** Nunca lanza — un fallo de envío no debe enmascarar que el pedido ya quedó confirmado. */
export async function notifyOrderPaid(order: PaidOrder): Promise<void> {
  try {
    await getClient().emails.send({
      from: getSecret("ORDER_NOTIFY_EMAIL_FROM") ?? "",
      to: getSecret("ORDER_NOTIFY_EMAIL_TO") ?? "",
      subject: `Nuevo pedido pagado · ${order.reference}`,
      html: renderOrderEmailHtml(order),
    });
  } catch (error) {
    console.error("notifyOrderPaid failed", { ref: order.reference, error });
  }
}

export interface OpsAlertPayload {
  readonly ref: string;
  readonly error: string;
  readonly attempt?: number;
}

/** Nunca lanza — un fallo de alerta no debe enmascarar el error original de settleCheckout. */
export async function notifyOpsAlert(payload: OpsAlertPayload): Promise<void> {
  try {
    await getClient().emails.send({
      from: getSecret("ORDER_NOTIFY_EMAIL_FROM") ?? "",
      to: getSecret("ORDER_NOTIFY_EMAIL_TO") ?? "",
      subject: `[ALERTA] Pago sin confirmar — ref ${payload.ref}`,
      html: `<p>Pago confirmado en SumUp pero no se pudo registrar el pedido.</p>
        <p>Ref: <strong>${payload.ref}</strong></p>
        <p>Error: ${payload.error}</p>
        ${payload.attempt ? `<p>Intento: ${payload.attempt}</p>` : ""}`,
    });
  } catch (error) {
    console.error("notifyOpsAlert failed", { ref: payload.ref, error });
  }
}
