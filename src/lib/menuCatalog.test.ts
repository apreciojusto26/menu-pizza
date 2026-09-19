import { afterEach, describe, expect, it, vi } from "vitest";

import { menuSections as fallbackSections } from "../data/menu";
import { getAuthoritativeCatalog } from "./menuCatalog";

const CSV_HEADER =
  "categoria,nombre,descripcion,etiquetas,precio1_nombre,precio1_valor,precio2_nombre,precio2_valor,foto_url,visible";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getAuthoritativeCatalog", () => {
  it("returns the compiled fallback catalog when no sheetUrl is configured", async () => {
    const catalog = await getAuthoritativeCatalog(undefined);

    expect(catalog).toBe(fallbackSections);
  });

  it("returns the live sheet catalog when the sheet responds with valid rows", async () => {
    const csv = `${CSV_HEADER}\npizzas,Napolitana,Tomate y anchoas,,Mediana,10,,,,`;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(csv),
      }),
    );

    const catalog = await getAuthoritativeCatalog(
      "https://example.com/menu.csv",
    );

    expect(catalog).not.toBe(fallbackSections);
    expect(catalog[0]?.items[0]?.name).toBe("Napolitana");
  });

  it("falls back to the compiled catalog when the sheet request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down")),
    );

    const catalog = await getAuthoritativeCatalog(
      "https://example.com/menu.csv",
    );

    expect(catalog).toBe(fallbackSections);
  });

  it("falls back to the compiled catalog when the sheet responds but is empty", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(CSV_HEADER),
      }),
    );

    const catalog = await getAuthoritativeCatalog(
      "https://example.com/menu.csv",
    );

    expect(catalog).toBe(fallbackSections);
  });
});
