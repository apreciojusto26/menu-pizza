import { describe, expect, it } from "vitest";

import { mapContactRow, mapLocationRow, mapScheduleRow } from "./contactSheet";

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

describe("mapScheduleRow", () => {
  it("mapea una fila completa a la información de horario", () => {
    expect(
      mapScheduleRow({
        horario_titulo: "Lun a dom, 19 a 23h",
        horario_detalle: "Último pedido a las 22:30.",
      }),
    ).toEqual({
      label: "Lun a dom, 19 a 23h",
      detail: "Último pedido a las 22:30.",
      placeholder: false,
    });
  });

  it("devuelve null si falta cualquier campo o la fila no existe", () => {
    expect(
      mapScheduleRow({ horario_titulo: "", horario_detalle: "Detalle" }),
    ).toBeNull();
    expect(
      mapScheduleRow({ horario_titulo: "Título", horario_detalle: "" }),
    ).toBeNull();
    expect(mapScheduleRow(undefined)).toBeNull();
  });
});

describe("mapLocationRow", () => {
  it("mapea una fila completa a la información de ubicación", () => {
    expect(
      mapLocationRow({
        direccion_titulo: "Av. Siempre Viva 742",
        direccion_detalle: "A dos cuadras de la plaza.",
      }),
    ).toEqual({
      label: "Av. Siempre Viva 742",
      detail: "A dos cuadras de la plaza.",
      placeholder: false,
    });
  });

  it("devuelve null si falta cualquier campo o la fila no existe", () => {
    expect(
      mapLocationRow({ direccion_titulo: "", direccion_detalle: "Detalle" }),
    ).toBeNull();
    expect(
      mapLocationRow({ direccion_titulo: "Título", direccion_detalle: "" }),
    ).toBeNull();
    expect(mapLocationRow(undefined)).toBeNull();
  });
});
