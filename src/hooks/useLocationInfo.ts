import { fetchLocationFromSheet, type LocationInfo } from "../lib/contactSheet";
import { useSheetOverride } from "./useSheetOverride";

export function useLocationInfo(
  initialLocation: LocationInfo,
  sheetUrl?: string | undefined,
): LocationInfo {
  return useSheetOverride(initialLocation, sheetUrl, fetchLocationFromSheet);
}
