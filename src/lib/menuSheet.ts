import Papa from "papaparse";

import {
  SECTION_PRESETS,
  type BadgeTone,
  type MenuItem,
  type MenuSection,
  type PriceOption,
} from "../data/menu";

export interface MenuSheetRow {
  readonly categoria?: string;
  readonly nombre?: string;
  readonly descripcion?: string;
  readonly etiquetas?: string;
  readonly precio1_nombre?: string;
  readonly precio1_valor?: string;
  readonly precio2_nombre?: string;
  readonly precio2_valor?: string;
  readonly foto_url?: string;
  readonly visible?: string;
}

const BADGE_TONE_KEYWORDS: readonly (readonly [
  BadgeTone,
  readonly string[],
])[] = [
  ["spicy", ["picante", "spicy", "picosa", "chile"]],
  ["veggie", ["vegetariana", "vegetariano", "vegana", "vegano", "veggie"]],
  ["new", ["nueva", "nuevo", "novedad", "new", "proximamente"]],
];

const normalize = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .trim();

const slugify = (value: string): string =>
  normalize(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const capitalize = (value: string): string =>
  value.length === 0 ? value : value.charAt(0).toUpperCase() + value.slice(1);

const inferBadgeTone = (label: string): BadgeTone => {
  const normalized = normalize(label);
  const match = BADGE_TONE_KEYWORDS.find(([, keywords]) =>
    keywords.some((keyword) => normalized.includes(keyword)),
  );
  return match?.[0] ?? "classic";
};

const AFFIRMATIVE_VALUES = new Set(["si", "sí", "true", "1", "verdadero"]);
const NEGATIVE_VALUES = new Set(["no", "false", "0", "falso"]);

const parseVisible = (value: string | undefined): boolean => {
  const normalized = normalize(value ?? "");
  if (normalized === "") return true;
  if (NEGATIVE_VALUES.has(normalized)) return false;
  if (AFFIRMATIVE_VALUES.has(normalized)) return true;
  return true;
};

const parseAmount = (value: string | undefined): number | null => {
  const normalized = (value ?? "").trim().replace(",", ".");
  if (normalized === "") return null;
  const amount = Number(normalized);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
};

const rowToPrices = (row: MenuSheetRow): PriceOption[] => {
  const prices: PriceOption[] = [];

  const amount1 = parseAmount(row.precio1_valor);
  if (amount1 !== null) {
    prices.push({
      label: (row.precio1_nombre ?? "").trim() || "Precio",
      amount: amount1,
      currency: "EUR",
      placeholder: false,
    });
  }

  const amount2 = parseAmount(row.precio2_valor);
  if (amount2 !== null) {
    prices.push({
      label: (row.precio2_nombre ?? "").trim() || "Precio",
      amount: amount2,
      currency: "EUR",
      placeholder: false,
    });
  }

  return prices;
};

const rowToItem = (row: MenuSheetRow, sectionId: string): MenuItem | null => {
  const name = (row.nombre ?? "").trim();
  if (name === "") return null;

  const prices = rowToPrices(row);
  if (prices.length === 0) return null;

  const badges = (row.etiquetas ?? "")
    .split(",")
    .map((label) => label.trim())
    .filter(Boolean)
    .map((label) => ({ label, tone: inferBadgeTone(label) }));

  const imageUrl = (row.foto_url ?? "").trim();

  return {
    id: slugify(`${sectionId}-${name}`) || slugify(name),
    name,
    description: (row.descripcion ?? "").trim(),
    badges,
    prices,
    placeholder: false,
    imageUrl: imageUrl === "" ? undefined : imageUrl,
  };
};

export const mapSheetRowsToSections = (
  rows: readonly MenuSheetRow[],
): MenuSection[] => {
  const sectionOrder: string[] = [];
  const itemsBySection = new Map<string, MenuItem[]>();
  const labelBySection = new Map<string, string>();

  for (const row of rows) {
    if (!parseVisible(row.visible)) continue;

    const categoryRaw = (row.categoria ?? "").trim();
    if (categoryRaw === "") continue;

    const sectionId = slugify(categoryRaw);
    if (sectionId === "") continue;

    const item = rowToItem(row, sectionId);
    if (!item) continue;

    if (!itemsBySection.has(sectionId)) {
      itemsBySection.set(sectionId, []);
      labelBySection.set(sectionId, categoryRaw);
      sectionOrder.push(sectionId);
    }
    itemsBySection.get(sectionId)!.push(item);
  }

  return sectionOrder.map((sectionId) => {
    const preset = SECTION_PRESETS[sectionId];
    const fallbackLabel = capitalize(
      labelBySection.get(sectionId) ?? sectionId,
    );

    return {
      id: sectionId,
      label: preset?.label ?? fallbackLabel,
      shortLabel: preset?.shortLabel ?? fallbackLabel,
      eyebrow: preset?.eyebrow ?? "Más para pedir",
      description:
        preset?.description ?? "Sabores disponibles en esta categoría.",
      placeholder: false,
      items: itemsBySection.get(sectionId) ?? [],
    };
  });
};

export const fetchMenuFromSheet = async (
  sheetUrl: string,
): Promise<readonly MenuSection[] | null> => {
  try {
    const response = await fetch(sheetUrl, { cache: "no-store" });
    if (!response.ok) return null;

    const csvText = await response.text();
    const parsed = Papa.parse<MenuSheetRow>(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => normalize(header).replace(/\s+/g, "_"),
    });

    if (parsed.data.length === 0) return null;

    const sections = mapSheetRowsToSections(parsed.data);
    return sections.length > 0 ? sections : null;
  } catch {
    return null;
  }
};
