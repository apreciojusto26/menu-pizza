import { describe, expect, it } from "vitest";

import {
  createWhatsAppUrl,
  getConfigurationStatus,
  getSafePublicMenuUrl,
} from "./siteLinks";

describe("createWhatsAppUrl", () => {
  it("no crea un enlace si WhatsApp sigue marcado como placeholder", () => {
    expect(
      createWhatsAppUrl({
        number: "34612345678",
        display: "612 345 678",
        message: "Quiero hacer un pedido",
        placeholder: true,
      }),
    ).toBeNull();
  });

  it.each([
    "",
    "+34612345678",
    "34 612 345 678",
    "012345678",
    "000000000",
    "1234567",
    "1".repeat(16),
  ])("rechaza el número no válido %j", (number) => {
    expect(
      createWhatsAppUrl({
        number,
        display: "612 345 678",
        message: "Quiero hacer un pedido",
        placeholder: false,
      }),
    ).toBeNull();
  });

  it.each([
    { display: "", message: "Quiero hacer un pedido" },
    { display: "   ", message: "Quiero hacer un pedido" },
    { display: "612 345 678", message: "" },
    { display: "612 345 678", message: "Hola" },
  ])("rechaza campos requeridos incompletos: %o", ({ display, message }) => {
    expect(
      createWhatsAppUrl({
        number: "34612345678",
        display,
        message,
        placeholder: false,
      }),
    ).toBeNull();
  });

  it("crea un enlace seguro con un número confirmado y válido", () => {
    expect(
      createWhatsAppUrl({
        number: "34612345678",
        display: "612 345 678",
        message: "Pizza & empanada",
        placeholder: false,
      }),
    ).toBe("https://wa.me/34612345678?text=Pizza%20%26%20empanada");
  });
});

describe("getSafePublicMenuUrl", () => {
  it("no ofrece QR para URL provisionales", () => {
    expect(
      getSafePublicMenuUrl({
        url: "https://menu.larueca.test",
        placeholder: true,
      }),
    ).toBeNull();
  });

  it.each([
    "",
    "sin-protocolo.example",
    "http://menu.example.org",
    "https://usuario:clave@menu.example.org",
    "https://tu-dominio.example/menu",
    "https://example.com/menu",
    "https://carta.example.net/menu",
    "https://example.org/menu",
    "https://localhost/menu",
    "https://carta.localhost/menu",
    "https://intranet/menu",
    "https://restaurant.local/menu",
    "https://carta.internal-company/menu",
    "https://127.0.0.1/menu",
    "https://127.99.3.4/menu",
    "https://10.1.2.3/menu",
    "https://172.16.0.1/menu",
    "https://172.31.255.255/menu",
    "https://192.168.1.10/menu",
    "https://169.254.2.3/menu",
    "https://100.64.0.1/menu",
    "https://192.0.2.1/menu",
    "https://198.51.100.3/menu",
    "https://203.0.113.8/menu",
    "https://[::1]/menu",
    "https://[fc00::1]/menu",
    "https://[fe80::1]/menu",
    "https://[2001:db8::1]/menu",
  ])("rechaza una URL pública no segura o de ejemplo: %j", (url) => {
    expect(getSafePublicMenuUrl({ url, placeholder: false })).toBeNull();
  });

  it("normaliza una URL HTTPS confirmada", () => {
    expect(
      getSafePublicMenuUrl({
        url: "https://menu.larueca.es/carta",
        placeholder: false,
      }),
    ).toBe("https://menu.larueca.es/carta");
  });

  it.each([
    "https://8.8.8.8/carta",
    "https://[2001:4860:4860::8888]/carta",
    "https://larueca.github.io/carta",
  ])("acepta un host IP públicamente enrutable: %j", (url) => {
    expect(getSafePublicMenuUrl({ url, placeholder: false })).toBe(url);
  });
});

describe("getConfigurationStatus", () => {
  it("deriva el copy visible del valor placeholder", () => {
    expect(getConfigurationStatus(true)).toEqual({
      label: "Dato editable",
      description: "Información de demostración pendiente de confirmar.",
    });
    expect(getConfigurationStatus(false)).toEqual({
      label: "Dato confirmado",
      description: "Información comercial confirmada.",
    });
  });
});
