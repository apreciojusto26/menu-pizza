import { describe, expect, it } from "vitest";

import { addLogoToQrSvg } from "./qrLogo";

describe("addLogoToQrSvg", () => {
  it("inserta el logo centrado antes de cerrar el SVG", () => {
    const fakeQr =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 41 41"><path d="M0 0h41v41H0z"/></svg>';

    const result = addLogoToQrSvg(fakeQr);

    expect(result.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(
      true,
    );
    expect(result.endsWith("</svg>")).toBe(true);
    expect(result).toContain("<image");
    expect(result).toContain("data:image/png;base64,");

    const rect = result.match(
      /<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)" rx="([\d.]+)"/,
    );
    expect(rect).not.toBeNull();
    const [, x, y, width, height, rx] = rect!.map(Number);
    // el badge (24% del lado, 41) debe quedar centrado y ser cuadrado
    expect(width).toBeCloseTo(9.84);
    expect(height).toBeCloseTo(9.84);
    expect(x).toBeCloseTo((41 - 9.84) / 2);
    expect(y).toBeCloseTo((41 - 9.84) / 2);
    expect(rx).toBeCloseTo(9.84 * 0.18);
  });

  it("devuelve el SVG sin cambios si no encuentra un viewBox", () => {
    const svgSinViewBox = '<svg><path d="M0 0"/></svg>';

    expect(addLogoToQrSvg(svgSinViewBox)).toBe(svgSinViewBox);
  });
});
