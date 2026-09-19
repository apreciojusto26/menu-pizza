import { beforeEach, describe, expect, it } from "vitest";

import {
  $cartLines,
  addLine,
  cartLineCount,
  clearCart,
  removeLine,
  updateQuantity,
} from "./store";

beforeEach(() => {
  clearCart();
});

describe("addLine", () => {
  it("adds a new line with the given quantity", () => {
    addLine("pizza-margarita", "Mediana", 2);

    expect($cartLines.get()).toEqual([
      { menuItemId: "pizza-margarita", priceLabel: "Mediana", quantity: 2 },
    ]);
  });

  it("defaults quantity to 1", () => {
    addLine("pizza-margarita", "Mediana");

    expect($cartLines.get()).toEqual([
      { menuItemId: "pizza-margarita", priceLabel: "Mediana", quantity: 1 },
    ]);
  });

  it("merges into an existing line for the same item+price", () => {
    addLine("pizza-margarita", "Mediana", 1);
    addLine("pizza-margarita", "Mediana", 2);

    expect($cartLines.get()).toEqual([
      { menuItemId: "pizza-margarita", priceLabel: "Mediana", quantity: 3 },
    ]);
  });

  it("keeps different price options as separate lines", () => {
    addLine("pizza-margarita", "Mediana", 1);
    addLine("pizza-margarita", "Familiar", 1);

    expect($cartLines.get()).toHaveLength(2);
  });
});

describe("removeLine", () => {
  it("removes only the matching line", () => {
    addLine("pizza-margarita", "Mediana", 1);
    addLine("pizza-margarita", "Familiar", 1);

    removeLine("pizza-margarita", "Mediana");

    expect($cartLines.get()).toEqual([
      { menuItemId: "pizza-margarita", priceLabel: "Familiar", quantity: 1 },
    ]);
  });
});

describe("updateQuantity", () => {
  it("sets the quantity of an existing line", () => {
    addLine("pizza-margarita", "Mediana", 1);

    updateQuantity("pizza-margarita", "Mediana", 5);

    expect($cartLines.get()).toEqual([
      { menuItemId: "pizza-margarita", priceLabel: "Mediana", quantity: 5 },
    ]);
  });

  it("removes the line when quantity is set to 0 or less", () => {
    addLine("pizza-margarita", "Mediana", 1);

    updateQuantity("pizza-margarita", "Mediana", 0);

    expect($cartLines.get()).toEqual([]);
  });
});

describe("clearCart", () => {
  it("empties the cart", () => {
    addLine("pizza-margarita", "Mediana", 1);

    clearCart();

    expect($cartLines.get()).toEqual([]);
  });
});

describe("cartLineCount", () => {
  it("sums quantities across all lines", () => {
    const count = cartLineCount([
      { menuItemId: "a", priceLabel: "x", quantity: 2 },
      { menuItemId: "b", priceLabel: "y", quantity: 3 },
    ]);

    expect(count).toBe(5);
  });

  it("returns 0 for an empty cart", () => {
    expect(cartLineCount([])).toBe(0);
  });
});
