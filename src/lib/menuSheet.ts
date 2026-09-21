import {
  menuSections as staticMenuSections,
  SECTION_PRESETS,
  type BadgeTone,
  type MenuItem,
  type MenuSection,
  type PriceOption,
} from "../data/menu";
import { fetchSheetRows, normalizeSheetText } from "./sheetCsv";

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

const normalize = normalizeSheetText;

/**
 * Los alérgenos son un dato de seguridad alimentaria fijo por receta, no algo
 * que el personal deba tipear en la hoja de cálculo cada vez que edita un
 * precio o una foto. Se mantienen en el código (data/menu.ts) y se buscan
 * por nombre de plato normalizado, ya que el id que arma la hoja no coincide
 * con el id estático (por ejemplo "pizzas-cuatro-quesos" vs
 * "pizza-cuatro-quesos").
 */
const ALLERGENS_BY_ITEM_NAME = new Map<string, readonly number[]>(
  staticMenuSections
    .flatMap((section) => section.items)
    .filter((item) => item.allergens && item.allergens.length > 0)
    .map((item) => [normalize(item.name), item.allergens!] as const),
);

// La hoja lista cada sabor de Calzone y Pan de Ajo como un plato aparte
// ("Calzone - Jamón York", ...), a diferencia de la carta base donde es un
// único plato con varios precios. Comparten los mismos alérgenos por receta.
for (const flavorName of [
  "Calzone - Jamón York",
  "Calzone - Bacon",
  "Calzone - Pepperoni Picante",
  "Calzone - Cheddar",
]) {
  ALLERGENS_BY_ITEM_NAME.set(
    normalize(flavorName),
    ALLERGENS_BY_ITEM_NAME.get(normalize("Calzone Italiano"))!,
  );
}
for (const flavorName of [
  "Pan de Ajo - Jamón York",
  "Pan de Ajo - Bacon",
  "Pan de Ajo - Cheddar",
]) {
  ALLERGENS_BY_ITEM_NAME.set(
    normalize(flavorName),
    ALLERGENS_BY_ITEM_NAME.get(normalize("Pan de Ajo Italiano"))!,
  );
}

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
    allergens: ALLERGENS_BY_ITEM_NAME.get(normalize(name)),
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
  const rows = await fetchSheetRows<MenuSheetRow>(sheetUrl);
  if (!rows) return null;

  const sections = mapSheetRowsToSections(rows);
  return sections.length > 0 ? sections : null;
};
