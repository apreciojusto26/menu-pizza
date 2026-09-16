import { fetchContactFromSheet, type ContactInfo } from "../lib/contactSheet";
import { useSheetOverride } from "./useSheetOverride";

export function useContactInfo(
  initialContact: ContactInfo,
  sheetUrl?: string | undefined,
): ContactInfo {
  return useSheetOverride(initialContact, sheetUrl, fetchContactFromSheet);
}
