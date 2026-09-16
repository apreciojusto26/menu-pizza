import { describe, expect, it } from "vitest";

import { mapContactRow } from "./contactSheet";

describe("mapContactRow", () => {
  it("mapea una fila completa a la información de contacto", () => {
    expect(
      mapContactRow({
        numero: "34600123456",
        nombre_visible: "Pedidos Italy Pizza",
        mensaje: "Hola, quiero hacer un pedido.",
      }),
    ).toEqual({
      number: "34600123456",
      display: "Pedidos Italy Pizza",
      message: "Hola, quiero hacer un pedido.",
      placeholder: false,
    });
  });

  it("recorta espacios alrededor de cada valor", () => {
    expect(
      mapContactRow({
        numero: " 34600123456 ",
        nombre_visible: " Pedidos ",
        mensaje: " Hola ",
      }),
    ).toEqual({
      number: "34600123456",
      display: "Pedidos",
      message: "Hola",
      placeholder: false,
    });
  });

  it("devuelve null si falta cualquier campo o la fila no existe", () => {
    expect(
      mapContactRow({ numero: "", nombre_visible: "Pedidos", mensaje: "Hola" }),
    ).toBeNull();
    expect(
      mapContactRow({
        numero: "34600123456",
        nombre_visible: "",
        mensaje: "Hola",
      }),
    ).toBeNull();
    expect(
      mapContactRow({
        numero: "34600123456",
        nombre_visible: "Pedidos",
        mensaje: "",
      }),
    ).toBeNull();
    expect(mapContactRow(undefined)).toBeNull();
  });
});
