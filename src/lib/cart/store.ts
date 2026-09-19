import { persistentAtom } from "@nanostores/persistent";

import { cartLineKey } from "./resolve";
import type { CartLine } from "./types";

/**
 * Store del carrito, fuera de React a propósito: cada isla de Astro
 * (`client:load`) monta su propio árbol React independiente, así que un
 * Context de React no cruza entre `MenuExplorer`, `CartDrawer` y
 * `CheckoutView`. Un módulo nanostores importado desde cualquiera de ellas sí
 * comparte estado, y `persistentAtom` lo guarda en localStorage para que
 * sobreviva a un refresh.
 */
export const $cartLines = persistentAtom<readonly CartLine[]>(
  "cart:lines",
  [],
  {
    encode: JSON.stringify,
    decode: (raw) => JSON.parse(raw) as readonly CartLine[],
  },
);

export const addLine = (
  menuItemId: string,
  priceLabel: string,
  quantity = 1,
): void => {
  const key = cartLineKey(menuItemId, priceLabel);
  const current = $cartLines.get();
  const existing = current.find(
    (line) => cartLineKey(line.menuItemId, line.priceLabel) === key,
  );

  if (existing) {
    $cartLines.set(
      current.map((line) =>
        cartLineKey(line.menuItemId, line.priceLabel) === key
          ? { ...line, quantity: line.quantity + quantity }
          : line,
      ),
    );
    return;
  }

  $cartLines.set([...current, { menuItemId, priceLabel, quantity }]);
};

export const removeLine = (menuItemId: string, priceLabel: string): void => {
  const key = cartLineKey(menuItemId, priceLabel);
  $cartLines.set(
    $cartLines
      .get()
      .filter((line) => cartLineKey(line.menuItemId, line.priceLabel) !== key),
  );
};

export const updateQuantity = (
  menuItemId: string,
  priceLabel: string,
  quantity: number,
): void => {
  if (quantity <= 0) {
    removeLine(menuItemId, priceLabel);
    return;
  }

  const key = cartLineKey(menuItemId, priceLabel);
  $cartLines.set(
    $cartLines
      .get()
      .map((line) =>
        cartLineKey(line.menuItemId, line.priceLabel) === key
          ? { ...line, quantity }
          : line,
      ),
  );
};

export const clearCart = (): void => {
  $cartLines.set([]);
};

export const cartLineCount = (lines: readonly CartLine[]): number =>
  lines.reduce((sum, line) => sum + line.quantity, 0);
