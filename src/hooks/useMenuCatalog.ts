import type { MenuSection } from "../data/menu";
import { fetchMenuFromSheet } from "../lib/menuSheet";
import { useSheetOverride } from "./useSheetOverride";

export function useMenuCatalog(
  initialSections: readonly MenuSection[],
  sheetUrl?: string | undefined,
): readonly MenuSection[] {
  return useSheetOverride(initialSections, sheetUrl, fetchMenuFromSheet);
}
