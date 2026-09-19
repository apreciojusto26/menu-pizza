import {
  menuSections as fallbackSections,
  type MenuSection,
} from "../data/menu";
import { fetchMenuFromSheet } from "./menuSheet";

/**
 * Catálogo autoritativo usado por el checkout para recalcular precios
 * server-side. `fetchMenuFromSheet` usa `fetch` global (sin APIs de
 * navegador), así que corre igual en una función server de Vercel que en el
 * cliente — no hace falta duplicar el mapeo del Sheet.
 *
 * Recibe `sheetUrl` como parámetro (en vez de leer `import.meta.env`
 * adentro) para poder testear sin depender de env vars globales; el caller
 * (la ruta API) lo resuelve igual que ya hacen `index.astro`/`carta.astro`:
 * `import.meta.env.PUBLIC_MENU_SHEET_URL?.trim() || undefined`.
 */
export const getAuthoritativeCatalog = async (
  sheetUrl: string | undefined,
): Promise<readonly MenuSection[]> => {
  if (!sheetUrl) return fallbackSections;

  const liveSections = await fetchMenuFromSheet(sheetUrl);
  return liveSections ?? fallbackSections;
};
