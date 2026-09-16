import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { menuSections } from "../data/menu";
import { MenuExplorer } from "./MenuExplorer";

describe("MenuExplorer", () => {
  it("muestra todos los productos inicialmente y cambia de categoría", async () => {
    const user = userEvent.setup();

    render(<MenuExplorer sections={menuSections} />);

    expect(screen.getByText("Margarita")).toBeVisible();
    expect(screen.getByText("Carne suave")).toBeVisible();

    await user.click(screen.getByRole("tab", { name: "Empanada" }));

    expect(screen.queryByText("Margarita")).not.toBeInTheDocument();
    expect(screen.getByText("Carne suave")).toBeVisible();
  });

  it("busca sin distinguir mayúsculas y ofrece un estado vacío recuperable", async () => {
    const user = userEvent.setup();

    render(<MenuExplorer sections={menuSections} />);
    const search = screen.getByRole("searchbox", { name: /buscar/i });

    await user.type(search, "CEBOLLA");
    expect(screen.getByText("Carne suave")).toBeVisible();
    expect(screen.queryByText("Margarita")).not.toBeInTheDocument();

    await user.clear(search);
    await user.type(search, "sabor inexistente");
    expect(screen.getByText(/no encontramos platos/i)).toBeVisible();

    await user.click(screen.getByRole("button", { name: /limpiar búsqueda/i }));
    expect(screen.getByText("Margarita")).toBeVisible();
  });

  it("expone el estado seleccionado de cada filtro", async () => {
    const user = userEvent.setup();

    render(<MenuExplorer sections={menuSections} />);
    const allTab = screen.getByRole("tab", { name: /todo/i });
    const pizzaTab = screen.getByRole("tab", { name: "Pizza" });

    expect(allTab).toHaveAttribute("aria-selected", "true");
    await user.click(pizzaTab);
    expect(allTab).toHaveAttribute("aria-selected", "false");
    expect(pizzaTab).toHaveAttribute("aria-selected", "true");
  });

  it("permite recorrer las categorías con el teclado", async () => {
    const user = userEvent.setup();

    render(<MenuExplorer sections={menuSections} />);
    const allTab = screen.getByRole("tab", { name: /todo/i });
    const pizzaTab = screen.getByRole("tab", { name: "Pizza" });
    const empanadaTab = screen.getByRole("tab", { name: "Empanada" });

    allTab.focus();
    await user.keyboard("{ArrowRight}");
    expect(pizzaTab).toHaveFocus();
    expect(pizzaTab).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{End}");
    expect(empanadaTab).toHaveFocus();
    expect(empanadaTab).toHaveAttribute("aria-selected", "true");
  });

  it("retira automáticamente el copy de muestra al confirmar toda la carta", () => {
    const confirmedSections = menuSections.map((section) => ({
      ...section,
      placeholder: false,
      items: section.items.map((item) => ({
        ...item,
        placeholder: false,
        prices: item.prices.map((price) => ({
          ...price,
          placeholder: false,
        })),
      })),
    }));

    render(<MenuExplorer sections={confirmedSections} />);

    expect(
      screen.queryByText(/sabores de demostración/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Muestra")).not.toBeInTheDocument();
    expect(screen.queryByText(/precio de muestra/i)).not.toBeInTheDocument();
  });

  it("abre la foto en un modal al hacer clic y lo cierra con Escape", async () => {
    const user = userEvent.setup();
    const sectionsWithPhoto = [
      {
        ...menuSections[0]!,
        items: [
          {
            ...menuSections[0]!.items[0]!,
            imageUrl: "https://example.com/margarita.jpg",
          },
          ...menuSections[0]!.items.slice(1),
        ],
      },
      ...menuSections.slice(1),
    ];

    render(<MenuExplorer sections={sectionsWithPhoto} />);

    expect(
      screen.queryByRole("dialog", { name: "Margarita" }),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /ver foto grande de margarita/i }),
    );

    const dialog = screen.getByRole("dialog", { name: "Margarita" });
    expect(dialog).toBeVisible();
    expect(screen.getByAltText("Margarita")).toHaveAttribute(
      "src",
      "https://example.com/margarita.jpg",
    );

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("no ofrece ampliar el ícono genérico cuando no hay foto real", () => {
    render(<MenuExplorer sections={menuSections} />);

    expect(
      screen.queryByRole("button", { name: /ver foto grande/i }),
    ).not.toBeInTheDocument();
  });
});
