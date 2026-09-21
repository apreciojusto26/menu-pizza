import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { menuSections } from "../data/menu";
import { $cartLines, clearCart } from "../lib/cart/store";
import { MenuExplorer } from "./MenuExplorer";

// El lanzamiento actual esconde "Agregar" (CART_ENABLED=false en data/menu.ts,
// pedidos solo por WhatsApp por ahora) — este archivo sigue probando la
// funcionalidad del carrito en sí, que queda lista para reactivar.
vi.mock("../data/menu", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../data/menu")>()),
  CART_ENABLED: true,
}));

describe("MenuExplorer", () => {
  beforeEach(() => {
    clearCart();
  });

  it("muestra todos los productos inicialmente y cambia de categoría", async () => {
    const user = userEvent.setup();

    render(<MenuExplorer sections={menuSections} />);

    expect(screen.getByText("Cuatro quesos")).toBeVisible();
    expect(screen.getByText("Ternera")).toBeVisible();

    await user.click(screen.getByRole("tab", { name: "Empanada" }));

    expect(screen.queryByText("Cuatro quesos")).not.toBeInTheDocument();
    expect(screen.getByText("Ternera")).toBeVisible();
  });

  it("busca sin distinguir mayúsculas y ofrece un estado vacío recuperable", async () => {
    const user = userEvent.setup();

    render(<MenuExplorer sections={menuSections} />);
    const search = screen.getByRole("searchbox", { name: /buscar/i });

    await user.type(search, "CEBOLLA");
    expect(screen.getByText("Cebolla caramelizada")).toBeVisible();
    expect(screen.queryByText("Cuatro quesos")).not.toBeInTheDocument();

    await user.clear(search);
    await user.type(search, "sabor inexistente");
    expect(screen.getByText(/no encontramos platos/i)).toBeVisible();

    await user.click(screen.getByRole("button", { name: /limpiar búsqueda/i }));
    expect(screen.getByText("Cuatro quesos")).toBeVisible();
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
    const lastTab = screen.getByRole("tab", { name: "Bebida" });

    allTab.focus();
    await user.keyboard("{ArrowRight}");
    expect(pizzaTab).toHaveFocus();
    expect(pizzaTab).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{End}");
    expect(lastTab).toHaveFocus();
    expect(lastTab).toHaveAttribute("aria-selected", "true");
  });

  it("no muestra copy de muestra con la carta real confirmada", () => {
    render(<MenuExplorer sections={menuSections} />);

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
            imageUrl: "https://example.com/cuatro-quesos.jpg",
          },
          ...menuSections[0]!.items.slice(1),
        ],
      },
      ...menuSections.slice(1),
    ];

    render(<MenuExplorer sections={sectionsWithPhoto} />);

    expect(
      screen.queryByRole("dialog", { name: "Cuatro quesos" }),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /ver foto grande de cuatro quesos/i }),
    );

    const dialog = screen.getByRole("dialog", { name: "Cuatro quesos" });
    expect(dialog).toBeVisible();
    expect(screen.getByAltText("Cuatro quesos")).toHaveAttribute(
      "src",
      "https://example.com/cuatro-quesos.jpg",
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

  it("no ofrece agregar al carrito productos o precios de muestra", () => {
    const placeholderSections = [
      {
        ...menuSections[0]!,
        items: [
          {
            ...menuSections[0]!.items[0]!,
            placeholder: true,
            prices: menuSections[0]!.items[0]!.prices.map((price) => ({
              ...price,
              placeholder: true,
            })),
          },
        ],
      },
    ];

    render(<MenuExplorer sections={placeholderSections} />);

    expect(
      screen.queryByRole("button", { name: /agregar/i }),
    ).not.toBeInTheDocument();
  });

  it("agrega el producto al carrito al hacer clic en Agregar", async () => {
    const user = userEvent.setup();

    render(<MenuExplorer sections={menuSections} />);

    await user.click(
      screen.getByRole("button", {
        name: /agregar cuatro quesos, individual/i,
      }),
    );

    expect($cartLines.get()).toEqual([
      {
        menuItemId: menuSections[0]!.items[0]!.id,
        priceLabel: "Individual",
        quantity: 1,
      },
    ]);

    await user.click(
      screen.getByRole("button", {
        name: /agregar cuatro quesos, individual/i,
      }),
    );

    expect($cartLines.get()).toEqual([
      {
        menuItemId: menuSections[0]!.items[0]!.id,
        priceLabel: "Individual",
        quantity: 2,
      },
    ]);
  });
});
