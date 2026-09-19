import type {
  CartLine,
  MenuCatalog,
  ResolvedCart,
  ResolvedCartLine,
} from "./types";

export const MAX_QUANTITY_PER_LINE = 50;
export const MAX_CART_LINES = 30;

export const cartLineKey = (menuItemId: string, priceLabel: string): string =>
  `${menuItemId}::${priceLabel}`;

const isValidQuantity = (quantity: number): boolean =>
  Number.isInteger(quantity) &&
  quantity > 0 &&
  quantity <= MAX_QUANTITY_PER_LINE;

const roundToCents = (amount: number): number => Math.round(amount * 100) / 100;

/**
 * Resuelve líneas de carrito (solo referencias: menuItemId/priceLabel/quantity)
 * contra un catálogo. Nunca confía en un precio que venga del cliente — el
 * monto siempre sale de `catalog`, así que este es el único lugar (cliente
 * para mostrar, servidor para cobrar) donde una CartLine se convierte en un
 * importe real.
 */
export const resolveCart = (
  lines: readonly CartLine[],
  catalog: MenuCatalog,
): ResolvedCart => {
  const invalidLines: CartLine[] = [];
  const mergedLines = new Map<string, CartLine>();

  for (const line of lines) {
    if (!isValidQuantity(line.quantity)) {
      invalidLines.push(line);
      continue;
    }

    const key = cartLineKey(line.menuItemId, line.priceLabel);
    const existing = mergedLines.get(key);
    mergedLines.set(key, {
      menuItemId: line.menuItemId,
      priceLabel: line.priceLabel,
      quantity: (existing?.quantity ?? 0) + line.quantity,
    });
  }

  const resolvedLines: ResolvedCartLine[] = [];

  for (const section of catalog) {
    for (const item of section.items) {
      for (const price of item.prices) {
        const key = cartLineKey(item.id, price.label);
        const merged = mergedLines.get(key);
        if (!merged) continue;
        mergedLines.delete(key);

        if (item.placeholder || price.placeholder) {
          invalidLines.push(merged);
          continue;
        }

        resolvedLines.push({
          menuItemId: item.id,
          priceLabel: price.label,
          quantity: merged.quantity,
          itemName: item.name,
          sectionLabel: section.label,
          price,
          lineTotal: roundToCents(price.amount * merged.quantity),
        });
      }
    }
  }

  for (const leftover of mergedLines.values()) {
    invalidLines.push(leftover);
  }

  const totalAmount = roundToCents(
    resolvedLines.reduce((sum, line) => sum + line.lineTotal, 0),
  );

  return { lines: resolvedLines, invalidLines, totalAmount, currency: "EUR" };
};
