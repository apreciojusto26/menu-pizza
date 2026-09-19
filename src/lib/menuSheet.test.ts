import { describe, expect, it } from "vitest";

import { mapSheetRowsToSections, type MenuSheetRow } from "./menuSheet";

const row = (overrides: Partial<MenuSheetRow>): MenuSheetRow => ({
  categoria: "pizzas",
  nombre: "Margarita",
  descripcion: "Tomate y mozzarella.",
  etiquetas: "",
  precio1_nombre: "Mediana",
  precio1_valor: "9,5",
  precio2_nombre: "Familiar",
  precio2_valor: "15",
  foto_url: "",
  visible: "",
  ...overrides,
});

describe("mapSheetRowsToSections", () => {
  it("agrupa filas por categoría y conserva el orden de aparición", () => {
    const sections = mapSheetRowsToSections([
      row({ categoria: "Pizzas", nombre: "Margarita" }),
      row({ categoria: "Empanadas", nombre: "Carne", precio2_valor: "" }),
      row({ categoria: "Pizzas", nombre: "Fuego" }),
    ]);

    expect(sections.map((section) => section.id)).toEqual([
      "pizzas",
      "empanadas",
    ]);
    expect(sections[0]?.items.map((item) => item.name)).toEqual([
      "Margarita",
      "Fuego",
    ]);
  });

  it("usa la copia conocida para pizzas y empanadas, y genera una por defecto para categorías nuevas", () => {
    const sections = mapSheetRowsToSections([
      row({ categoria: "pizzas" }),
      row({ categoria: "Postres", nombre: "Tiramisú", precio2_valor: "" }),
    ]);

    const pizzas = sections.find((section) => section.id === "pizzas");
    const postres = sections.find((section) => section.id === "postres");

    expect(pizzas?.label).toBe("Pizzas");
    expect(pizzas?.eyebrow).toBe("Masa, tiempo y horno");
    expect(postres?.label).toBe("Postres");
    expect(postres?.eyebrow).toBe("Más para pedir");
  });

  it("convierte la coma decimal y admite un solo precio", () => {
    const sections = mapSheetRowsToSections([
      row({ precio1_valor: "9,5", precio2_valor: "" }),
    ]);

    expect(sections[0]?.items[0]?.prices).toEqual([
      { label: "Mediana", amount: 9.5, currency: "EUR", placeholder: false },
    ]);
  });

  it("descarta filas sin nombre, sin categoría o sin ningún precio válido", () => {
    const sections = mapSheetRowsToSections([
      row({ nombre: "" }),
      row({ categoria: "" }),
      row({ precio1_valor: "", precio2_valor: "" }),
    ]);

    expect(sections).toEqual([]);
  });

  it("oculta las filas marcadas como no visibles", () => {
    const sections = mapSheetRowsToSections([
      row({ nombre: "Oculta", visible: "no" }),
      row({ nombre: "Visible", visible: "si" }),
    ]);

    expect(sections[0]?.items.map((item) => item.name)).toEqual(["Visible"]);
  });

  it("infiere el tono del badge a partir de la etiqueta escrita", () => {
    const sections = mapSheetRowsToSections([
      row({ etiquetas: "Picante, Vegetariana" }),
    ]);

    expect(sections[0]?.items[0]?.badges).toEqual([
      { label: "Picante", tone: "spicy" },
      { label: "Vegetariana", tone: "veggie" },
    ]);
  });

  it("solo incluye foto_url cuando viene completo", () => {
    const withPhoto = mapSheetRowsToSections([
      row({ foto_url: "https://example.com/pizza.jpg" }),
    ]);
    const withoutPhoto = mapSheetRowsToSections([row({ foto_url: "" })]);

    expect(withPhoto[0]?.items[0]?.imageUrl).toBe(
      "https://example.com/pizza.jpg",
    );
    expect(withoutPhoto[0]?.items[0]?.imageUrl).toBeUndefined();
  });
});
