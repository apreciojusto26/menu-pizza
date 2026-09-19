import { useEffect, useRef, useState } from "react";

import type { MenuSection } from "../data/menu";
import { useCartLines } from "../hooks/useCart";
import { useContactInfo } from "../hooks/useContactInfo";
import { useMenuCatalog } from "../hooks/useMenuCatalog";
import type { ContactInfo } from "../lib/contactSheet";
import { formatAmount } from "../lib/cart/format";
import { resolveCart } from "../lib/cart/resolve";
import { clearCart } from "../lib/cart/store";
import type { ResolvedCartLine } from "../lib/cart/types";
import { createWhatsAppUrl } from "../lib/siteLinks";
import { DishThumb } from "./DishThumb";

interface CheckoutViewProps {
  readonly sections: readonly MenuSection[];
  readonly sheetUrl?: string | undefined;
  readonly initialContact: ContactInfo;
  readonly contactSheetUrl?: string | undefined;
}

type Phase =
  | { readonly kind: "cart" }
  | { readonly kind: "creating" }
  | {
      readonly kind: "widget";
      readonly checkoutId: string;
      readonly ref: string;
      readonly totalAmount: number;
    }
  | {
      readonly kind: "polling";
      readonly ref: string;
      readonly totalAmount: number | null;
    }
  | {
      readonly kind: "paid";
      readonly ref: string;
      readonly totalAmount: number | null;
      readonly lines: readonly ResolvedCartLine[];
    }
  | { readonly kind: "error"; readonly message: string };

const SUMUP_SDK_URL = "https://gateway.sumup.com/gateway/ecom/card/v2/sdk.js";
const POLL_INTERVAL_MS = 1500;
const MAX_POLL_ATTEMPTS = 20;
const WIDGET_MOUNT_ID = "sumup-card-mount";

declare global {
  interface Window {
    SumUpCard?: {
      mount: (options: {
        checkoutId: string;
        id: string;
        onResponse: (type: string, body: unknown) => void;
      }) => void;
    };
  }
}

let sdkPromise: Promise<void> | null = null;

const loadSumUpSdk = (): Promise<void> => {
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise((resolve, reject) => {
    if (window.SumUpCard) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = SUMUP_SDK_URL;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("No se pudo cargar el widget de pago."));
    document.head.appendChild(script);
  });

  return sdkPromise;
};

const buildOrderWhatsAppMessage = (
  ref: string,
  lines: readonly ResolvedCartLine[],
  totalAmount: number | null,
): string => {
  const itemsText = lines
    .map((line) => `- ${line.itemName} (${line.priceLabel}) x${line.quantity}`)
    .join("\n");
  const totalText = totalAmount !== null ? formatAmount(totalAmount) : "";

  return `Hola, acabo de pagar mi pedido (ref ${ref}):\n${itemsText}\nTotal: ${totalText}`;
};

export function CheckoutView({
  sections,
  sheetUrl,
  initialContact,
  contactSheetUrl,
}: CheckoutViewProps) {
  const lines = useCartLines();
  const catalog = useMenuCatalog(sections, sheetUrl);
  const cart = resolveCart(lines, catalog);
  const contact = useContactInfo(initialContact, contactSheetUrl);

  const [phase, setPhase] = useState<Phase>({ kind: "cart" });
  const pollAttemptsRef = useRef(0);
  const cartLinesRef = useRef(cart.lines);
  cartLinesRef.current = cart.lines;

  useEffect(() => {
    const refFromUrl = new URLSearchParams(window.location.search).get("ref");
    if (refFromUrl) {
      setPhase({ kind: "polling", ref: refFromUrl, totalAmount: null });
    }
  }, []);

  useEffect(() => {
    if (phase.kind !== "widget") return;
    let cancelled = false;

    loadSumUpSdk()
      .then(() => {
        if (cancelled || !window.SumUpCard) return;
        window.SumUpCard.mount({
          checkoutId: phase.checkoutId,
          id: WIDGET_MOUNT_ID,
          onResponse: (type) => {
            if (cancelled) return;
            if (type === "success") {
              setPhase({
                kind: "polling",
                ref: phase.ref,
                totalAmount: phase.totalAmount,
              });
            } else if (type === "error") {
              setPhase({
                kind: "error",
                message: "El pago no se pudo completar. Probá de nuevo.",
              });
            }
          },
        });
      })
      .catch(() => {
        if (!cancelled) {
          setPhase({
            kind: "error",
            message: "No se pudo cargar el widget de pago.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [phase]);

  useEffect(() => {
    if (phase.kind !== "polling") return;

    const ref = phase.ref;
    const totalAmount = phase.totalAmount;
    let cancelled = false;
    pollAttemptsRef.current = 0;

    const poll = async (): Promise<void> => {
      if (cancelled) return;
      pollAttemptsRef.current += 1;

      try {
        const response = await fetch(
          `/api/checkout/status?ref=${encodeURIComponent(ref)}`,
        );
        const result = (await response.json()) as { status: string };

        if (cancelled) return;

        if (result.status === "paid") {
          const paidLines = cartLinesRef.current;
          clearCart();
          setPhase({ kind: "paid", ref, totalAmount, lines: paidLines });
          return;
        }
        if (result.status === "failed") {
          setPhase({
            kind: "error",
            message:
              "El pago no se pudo confirmar. Escribinos con tu referencia si ya pagaste.",
          });
          return;
        }
      } catch {
        // sigue reintentando
      }

      if (pollAttemptsRef.current >= MAX_POLL_ATTEMPTS) {
        setPhase({
          kind: "error",
          message:
            "No pudimos confirmar el pago todavía. Escribinos con tu referencia.",
        });
        return;
      }

      setTimeout(() => void poll(), POLL_INTERVAL_MS);
    };

    void poll();

    return () => {
      cancelled = true;
    };
  }, [phase.kind, phase.kind === "polling" ? phase.ref : undefined]);

  const startCheckout = async (): Promise<void> => {
    setPhase({ kind: "creating" });
    try {
      const response = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines: cart.lines.map(({ menuItemId, priceLabel, quantity }) => ({
            menuItemId,
            priceLabel,
            quantity,
          })),
        }),
      });

      if (!response.ok) {
        setPhase({
          kind: "error",
          message: "No pudimos iniciar el pago. Probá de nuevo en un momento.",
        });
        return;
      }

      const data = (await response.json()) as {
        ref: string;
        checkoutId: string;
        totalAmount: number;
      };
      setPhase({
        kind: "widget",
        checkoutId: data.checkoutId,
        ref: data.ref,
        totalAmount: data.totalAmount,
      });
    } catch {
      setPhase({
        kind: "error",
        message:
          "No pudimos iniciar el pago. Revisá tu conexión y probá de nuevo.",
      });
    }
  };

  if (phase.kind === "paid") {
    const whatsappUrl = createWhatsAppUrl({
      number: contact.number,
      display: contact.display,
      message: buildOrderWhatsAppMessage(
        phase.ref,
        phase.lines,
        phase.totalAmount,
      ),
      placeholder: contact.placeholder,
    });

    return (
      <div className="checkout-confirmation" role="status">
        <h1>¡Gracias por tu pedido!</h1>
        <p>Ya avisamos al local. Referencia: {phase.ref}</p>
        {phase.totalAmount !== null && (
          <p className="checkout-confirmation-total">
            Total pagado: {formatAmount(phase.totalAmount)}
          </p>
        )}
        {whatsappUrl && (
          <a
            className="button button--sun"
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Enviar pedido por WhatsApp
          </a>
        )}
        <a className="button button--ghost" href="/carta">
          Volver a la carta
        </a>
      </div>
    );
  }

  if (phase.kind === "polling") {
    return (
      <div className="checkout-status" role="status" aria-live="polite">
        <p>Confirmando tu pago…</p>
      </div>
    );
  }

  if (phase.kind === "error") {
    return (
      <div className="checkout-status checkout-status--error" role="alert">
        <p>{phase.message}</p>
        <button
          type="button"
          className="button button--cream"
          onClick={() => setPhase({ kind: "cart" })}
        >
          Volver al carrito
        </button>
      </div>
    );
  }

  if (phase.kind === "widget") {
    return (
      <div className="checkout-widget">
        <p>Total a pagar: {formatAmount(phase.totalAmount)}</p>
        <div id={WIDGET_MOUNT_ID}></div>
      </div>
    );
  }

  if (cart.lines.length === 0) {
    return (
      <div className="checkout-empty" role="status">
        <p>Tu carrito está vacío.</p>
        <a className="button button--sun" href="/carta">
          Ver la carta
        </a>
      </div>
    );
  }

  return (
    <div className="checkout-summary">
      <ul>
        {cart.lines.map((line) => (
          <li key={`${line.menuItemId}::${line.priceLabel}`}>
            <span className="checkout-summary-item">
              <span className="line-thumb" aria-hidden="true">
                <DishThumb
                  imageUrl={line.imageUrl}
                  sectionId={line.sectionId}
                />
              </span>
              <span>
                {line.itemName} ({line.priceLabel}) x{line.quantity}
              </span>
            </span>
            <span>{formatAmount(line.lineTotal)}</span>
          </li>
        ))}
      </ul>
      {cart.invalidLines.length > 0 && (
        <p className="cart-drawer-notice" role="status">
          Algunos productos de tu carrito ya no están disponibles y se excluyen
          del total.
        </p>
      )}
      <p className="checkout-total">Total: {formatAmount(cart.totalAmount)}</p>
      <button
        type="button"
        className="button button--sun"
        onClick={() => void startCheckout()}
        disabled={phase.kind === "creating"}
      >
        {phase.kind === "creating"
          ? "Preparando el pago…"
          : "Pagar con tarjeta"}
      </button>
    </div>
  );
}
