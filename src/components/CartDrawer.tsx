import { useEffect, useRef, useState } from "react";

import type { MenuSection } from "../data/menu";
import { useCartLines } from "../hooks/useCart";
import { useMenuCatalog } from "../hooks/useMenuCatalog";
import { formatAmount } from "../lib/cart/format";
import { MAX_QUANTITY_PER_LINE, resolveCart } from "../lib/cart/resolve";
import { cartLineCount, removeLine, updateQuantity } from "../lib/cart/store";
import { DishThumb } from "./DishThumb";

interface CartDrawerProps {
  readonly sections: readonly MenuSection[];
  readonly sheetUrl?: string | undefined;
}

export function CartDrawer({ sections, sheetUrl }: CartDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const lastFocusedElementRef = useRef<HTMLElement | null>(null);

  const lines = useCartLines();
  const catalog = useMenuCatalog(sections, sheetUrl);
  const cart = resolveCart(lines, catalog);
  const count = cartLineCount(lines);

  useEffect(() => {
    if (!isOpen) return;

    lastFocusedElementRef.current = document.activeElement as HTMLElement;
    closeButtonRef.current?.focus();
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      lastFocusedElementRef.current?.focus();
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        className="cart-badge"
        onClick={() => setIsOpen(true)}
        aria-label={
          count > 0
            ? `Abrir carrito, ${count} ${count === 1 ? "producto" : "productos"}`
            : "Abrir carrito, vacío"
        }
      >
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path
            d="M3 4h2l2.4 12.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L21 8H6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="10" cy="21" r="1.4" fill="currentColor" />
          <circle cx="18" cy="21" r="1.4" fill="currentColor" />
        </svg>
        {count > 0 && <span className="cart-badge-count">{count}</span>}
      </button>

      {isOpen && (
        <div className="cart-drawer-overlay">
          <aside
            className="cart-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Carrito"
          >
            <div className="cart-drawer-header">
              <h2>Tu carrito</h2>
              <button
                ref={closeButtonRef}
                type="button"
                className="cart-drawer-close"
                onClick={() => setIsOpen(false)}
                aria-label="Cerrar carrito"
              >
                ✕
              </button>
            </div>

            {cart.lines.length === 0 ? (
              <p className="cart-drawer-empty">
                Todavía no agregaste nada. Elegí una pizza o empanada de la
                carta para empezar.
              </p>
            ) : (
              <ul className="cart-drawer-lines">
                {cart.lines.map((line) => (
                  <li key={`${line.menuItemId}::${line.priceLabel}`}>
                    <div className="line-thumb" aria-hidden="true">
                      <DishThumb
                        imageUrl={line.imageUrl}
                        sectionId={line.sectionId}
                      />
                    </div>
                    <div className="cart-drawer-line-info">
                      <strong>{line.itemName}</strong>
                      <span>{line.priceLabel}</span>
                    </div>
                    <div className="cart-drawer-line-controls">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(
                            line.menuItemId,
                            line.priceLabel,
                            line.quantity - 1,
                          )
                        }
                        aria-label={`Quitar una unidad de ${line.itemName}, ${line.priceLabel}`}
                      >
                        −
                      </button>
                      <span aria-live="polite">{line.quantity}</span>
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(
                            line.menuItemId,
                            line.priceLabel,
                            line.quantity + 1,
                          )
                        }
                        disabled={line.quantity >= MAX_QUANTITY_PER_LINE}
                        aria-label={`Agregar una unidad de ${line.itemName}, ${line.priceLabel}`}
                      >
                        +
                      </button>
                    </div>
                    <span className="cart-drawer-line-total">
                      {formatAmount(line.lineTotal)}
                    </span>
                    <button
                      type="button"
                      className="cart-drawer-remove"
                      onClick={() =>
                        removeLine(line.menuItemId, line.priceLabel)
                      }
                      aria-label={`Quitar ${line.itemName}, ${line.priceLabel}, del carrito`}
                    >
                      Quitar
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {cart.invalidLines.length > 0 && (
              <p className="cart-drawer-notice" role="status">
                Algunos productos de tu carrito ya no están disponibles y se
                excluyen del total.
                <button
                  type="button"
                  onClick={() => {
                    for (const line of cart.invalidLines) {
                      removeLine(line.menuItemId, line.priceLabel);
                    }
                  }}
                >
                  Quitarlos
                </button>
              </p>
            )}

            {cart.lines.length > 0 && (
              <div className="cart-drawer-footer">
                <div className="cart-drawer-total">
                  <span>Total</span>
                  <strong>{formatAmount(cart.totalAmount)}</strong>
                </div>
                <a className="button button--sun" href="/checkout">
                  Finalizar pedido
                </a>
              </div>
            )}
          </aside>
        </div>
      )}
    </>
  );
}
