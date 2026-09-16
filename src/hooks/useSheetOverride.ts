import { useEffect, useState } from "react";

export function useSheetOverride<T>(
  initialValue: T,
  sheetUrl: string | undefined,
  fetchOverride: (sheetUrl: string) => Promise<T | null>,
): T {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (!sheetUrl) return;

    let cancelled = false;
    fetchOverride(sheetUrl).then((liveValue) => {
      if (!cancelled && liveValue) setValue(liveValue);
    });

    return () => {
      cancelled = true;
    };
  }, [sheetUrl]);

  return value;
}
