import { fetchScheduleFromSheet, type ScheduleInfo } from "../lib/contactSheet";
import { useSheetOverride } from "./useSheetOverride";

export function useScheduleInfo(
  initialSchedule: ScheduleInfo,
  sheetUrl?: string | undefined,
): ScheduleInfo {
  return useSheetOverride(initialSchedule, sheetUrl, fetchScheduleFromSheet);
}
