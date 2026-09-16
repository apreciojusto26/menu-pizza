import Papa from "papaparse";

export const normalizeSheetText = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .trim();

export const fetchSheetRows = async <T>(
  sheetUrl: string,
): Promise<readonly T[] | null> => {
  try {
    const response = await fetch(sheetUrl, { cache: "no-store" });
    if (!response.ok) return null;

    const csvText = await response.text();
    const parsed = Papa.parse<T>(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) =>
        normalizeSheetText(header).replace(/\s+/g, "_"),
    });

    return parsed.data.length > 0 ? parsed.data : null;
  } catch {
    return null;
  }
};
