import { describe, expect, it } from "vitest";

import type { MenuSection } from "../../data/menu";
import { cartLineKey, resolveCart } from "./resolve";
import type { CartLine } from "./types";

const catalog: readonly MenuSection[] = [
  {
    id: "pizzas",
    label: "Pizzas",
    shortLabel: "Pizza",
    eyebrow: "Masa, tiempo y horno",
    description: "Elige tu tamaño.",
    placeholder: false,
    items: [
      {
        id: "pizza-margarita",
        name: "Margarita",
        description: "Tomate, mozzarella y albahaca.",
        badges: [],
        placeholder: false,
        prices: [
          {
            label: "Mediana",
            amount: 9.5,
            currency: "EUR",
            placeholder: false,
          },
          {
            label: "Familiar",
            amount: 15,
            currency: "EUR",
            placeholder: false,
          },
        ],
      },
      {
        id: "pizza-demo",
        name: "Pizza de muestra",
        description: "Ejemplo, no real.",
        badges: [],
        placeholder: true,
        prices: [
          { label: "Mediana", amount: 8, currency: "EUR", placeholder: true },
        ],
      },
      {
        id: "pizza-precio-muestra",
        name: "Con precio de muestra",
        description: "Item real, precio de ejemplo.",
        badges: [],
        placeholder: false,
        prices: [
          { label: "Mediana", amount: 8, currency: "EUR", placeholder: true },
          {
            label: "Familiar",
            amount: 14,
            currency: "EUR",
            placeholder: false,
          },
        ],
      },
    ],
  },
];

describe("cartLineKey", () => {
  it("combines menuItemId and priceLabel", () => {
    expect(cartLineKey("pizza-margarita", "Mediana")).toBe(
      "pizza-margarita::Mediana",
    );
  });
});

describe("resolveCart", () => {
  it("resolves a valid line against the catalog", () => {
    const lines: CartLine[] = [
      { menuItemId: "pizza-margarita", priceLabel: "Mediana", quantity: 2 },
    ];

    const result = resolveCart(lines, catalog);

    expect(result.invalidLines).toEqual([]);
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0]).toMatchObject({
      menuItemId: "pizza-margarita",
      priceLabel: "Mediana",
      quantity: 2,
      itemName: "Margarita",
      sectionLabel: "Pizzas",
      lineTotal: 19,
    });
    expect(result.totalAmount).toBe(19);
    expect(result.currency).toBe("EUR");
  });

  it("merges duplicate lines for the same item+price by summing quantity", () => {
    const lines: CartLine[] = [
      { menuItemId: "pizza-margarita", priceLabel: "Mediana", quantity: 1 },
      { menuItemId: "pizza-margarita", priceLabel: "Mediana", quantity: 2 },
    ];

    const result = resolveCart(lines, catalog);

    expect(result.lines).toHaveLength(1);
    expect(result.lines[0]?.quantity).toBe(3);
    expect(result.totalAmount).toBe(28.5);
  });

  it("keeps two different price options of the same item as separate lines", () => {
    const lines: CartLine[] = [
      { menuItemId: "pizza-margarita", priceLabel: "Mediana", quantity: 1 },
      { menuItemId: "pizza-margarita", priceLabel: "Familiar", quantity: 1 },
    ];

    const result = resolveCart(lines, catalog);

    expect(result.lines).toHaveLength(2);
    expect(result.totalAmount).toBe(24.5);
  });

  it("rejects an unknown menuItemId as invalid", () => {
    const lines: CartLine[] = [
      { menuItemId: "no-existe", priceLabel: "Mediana", quantity: 1 },
    ];

    const result = resolveCart(lines, catalog);

    expect(result.lines).toEqual([]);
    expect(result.invalidLines).toEqual(lines);
    expect(result.totalAmount).toBe(0);
  });

  it("rejects an unknown priceLabel for a known item as invalid", () => {
    const lines: CartLine[] = [
      {
        menuItemId: "pizza-margarita",
        priceLabel: "No existe",
        quantity: 1,
      },
    ];

    const result = resolveCart(lines, catalog);

    expect(result.lines).toEqual([]);
    expect(result.invalidLines).toEqual(lines);
  });

  it("rejects a placeholder item even if the referenced price exists", () => {
    const lines: CartLine[] = [
      { menuItemId: "pizza-demo", priceLabel: "Mediana", quantity: 1 },
    ];

    const result = resolveCart(lines, catalog);

    expect(result.lines).toEqual([]);
    expect(result.invalidLines).toHaveLength(1);
  });

  it("rejects a placeholder price even when the item itself is real", () => {
    const lines: CartLine[] = [
      {
        menuItemId: "pizza-precio-muestra",
        priceLabel: "Mediana",
        quantity: 1,
      },
    ];

    const result = resolveCart(lines, catalog);

    expect(result.lines).toEqual([]);
    expect(result.invalidLines).toHaveLength(1);
  });

  it("still accepts the non-placeholder price of the same item", () => {
    const lines: CartLine[] = [
      {
        menuItemId: "pizza-precio-muestra",
        priceLabel: "Familiar",
        quantity: 1,
      },
    ];

    const result = resolveCart(lines, catalog);

    expect(result.lines).toHaveLength(1);
    expect(result.totalAmount).toBe(14);
  });

  it.each([0, -1, 1.5, 51, NaN])(
    "rejects an invalid quantity: %s",
    (quantity) => {
      const lines: CartLine[] = [
        { menuItemId: "pizza-margarita", priceLabel: "Mediana", quantity },
      ];

      const result = resolveCart(lines, catalog);

      expect(result.lines).toEqual([]);
      expect(result.invalidLines).toEqual(lines);
    },
  );

  it("accepts the maximum allowed quantity per line", () => {
    const lines: CartLine[] = [
      { menuItemId: "pizza-margarita", priceLabel: "Mediana", quantity: 50 },
    ];

    const result = resolveCart(lines, catalog);

    expect(result.lines).toHaveLength(1);
    expect(result.invalidLines).toEqual([]);
  });

  it("returns an empty resolved cart for an empty input", () => {
    const result = resolveCart([], catalog);

    expect(result.lines).toEqual([]);
    expect(result.invalidLines).toEqual([]);
    expect(result.totalAmount).toBe(0);
  });
});
