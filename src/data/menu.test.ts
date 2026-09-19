import { describe, expect, it } from "vitest";

import {
  deriveMenuContentStatus,
  menuContentStatus,
  menuSections,
  restaurant,
  type MenuSection,
} from "./menu";

describe("datos del menú", () => {
  it("mantiene identificadores únicos y precios legibles", () => {
    const items = menuSections.flatMap((section) => section.items);
    const ids = items.map((item) => item.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(items.length).toBeGreaterThanOrEqual(10);
    expect(items.every((item) => item.prices.length > 0)).toBe(true);
    expect(
      items.every((item) => item.prices.every((price) => price.amount > 0)),
    ).toBe(true);
  });

  it("marca la carta de pizzas real como confirmada", () => {
    const pizzas = menuSections.find((section) => section.id === "pizzas");

    expect(pizzas).toBeDefined();
    expect(pizzas?.placeholder).toBe(false);
    expect(pizzas?.items.every((item) => !item.placeholder)).toBe(true);
  });

  it("mantiene los datos comerciales sin confirmar visiblemente marcados", () => {
    expect(restaurant.whatsapp.placeholder).toBe(true);
    expect(restaurant.location.placeholder).toBe(true);
    expect(restaurant.schedule.placeholder).toBe(true);
  });

  it("deriva un único estado provisional desde secciones, platos y precios", () => {
    expect(menuContentStatus.placeholder).toBe(false);

    const confirmedSection: MenuSection = {
      id: "pizzas",
      label: "Pizzas",
      shortLabel: "Pizza",
      eyebrow: "Horno",
      description: "Carta disponible.",
      placeholder: false,
      items: [
        {
          id: "confirmada",
          name: "Confirmada",
          description: "Ingredientes confirmados.",
          badges: [],
          placeholder: false,
          prices: [
            {
              label: "Unidad",
              amount: 10,
              currency: "EUR",
              placeholder: false,
            },
          ],
        },
      ],
    };

    expect(deriveMenuContentStatus([confirmedSection]).placeholder).toBe(false);
    expect(
      deriveMenuContentStatus([{ ...confirmedSection, placeholder: true }])
        .placeholder,
    ).toBe(true);
    expect(
      deriveMenuContentStatus([
        {
          ...confirmedSection,
          items: [{ ...confirmedSection.items[0]!, placeholder: true }],
        },
      ]).placeholder,
    ).toBe(true);
    expect(
      deriveMenuContentStatus([
        {
          ...confirmedSection,
          items: [
            {
              ...confirmedSection.items[0]!,
              prices: [
                { ...confirmedSection.items[0]!.prices[0]!, placeholder: true },
              ],
            },
          ],
        },
      ]).placeholder,
    ).toBe(true);
  });
});
