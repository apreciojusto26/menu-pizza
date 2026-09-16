import { fetchSheetRows } from "./sheetCsv";

export interface ContactSheetRow {
  readonly numero?: string;
  readonly nombre_visible?: string;
  readonly mensaje?: string;
}

export interface ContactInfo {
  readonly number: string;
  readonly display: string;
  readonly message: string;
  readonly placeholder: boolean;
}

export const mapContactRow = (
  row: ContactSheetRow | undefined,
): ContactInfo | null => {
  const number = (row?.numero ?? "").trim();
  const display = (row?.nombre_visible ?? "").trim();
  const message = (row?.mensaje ?? "").trim();

  if (number === "" || display === "" || message === "") return null;

  return { number, display, message, placeholder: false };
};

export const fetchContactFromSheet = async (
  sheetUrl: string,
): Promise<ContactInfo | null> => {
  const rows = await fetchSheetRows<ContactSheetRow>(sheetUrl);
  if (!rows) return null;

  return mapContactRow(rows[0]);
};
