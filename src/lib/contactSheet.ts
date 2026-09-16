import { fetchSheetRows } from "./sheetCsv";

export interface ContactSheetRow {
  readonly numero?: string;
  readonly nombre_visible?: string;
  readonly mensaje?: string;
  readonly horario_titulo?: string;
  readonly horario_detalle?: string;
  readonly direccion_titulo?: string;
  readonly direccion_detalle?: string;
}

export interface ContactInfo {
  readonly number: string;
  readonly display: string;
  readonly message: string;
  readonly placeholder: boolean;
}

export interface ScheduleInfo {
  readonly label: string;
  readonly detail: string;
  readonly placeholder: boolean;
}

export interface LocationInfo {
  readonly label: string;
  readonly detail: string;
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

export const mapScheduleRow = (
  row: ContactSheetRow | undefined,
): ScheduleInfo | null => {
  const label = (row?.horario_titulo ?? "").trim();
  const detail = (row?.horario_detalle ?? "").trim();

  if (label === "" || detail === "") return null;

  return { label, detail, placeholder: false };
};

export const mapLocationRow = (
  row: ContactSheetRow | undefined,
): LocationInfo | null => {
  const label = (row?.direccion_titulo ?? "").trim();
  const detail = (row?.direccion_detalle ?? "").trim();

  if (label === "" || detail === "") return null;

  return { label, detail, placeholder: false };
};

export const fetchContactFromSheet = async (
  sheetUrl: string,
): Promise<ContactInfo | null> => {
  const rows = await fetchSheetRows<ContactSheetRow>(sheetUrl);
  if (!rows) return null;

  return mapContactRow(rows[0]);
};

export const fetchScheduleFromSheet = async (
  sheetUrl: string,
): Promise<ScheduleInfo | null> => {
  const rows = await fetchSheetRows<ContactSheetRow>(sheetUrl);
  if (!rows) return null;

  return mapScheduleRow(rows[0]);
};

export const fetchLocationFromSheet = async (
  sheetUrl: string,
): Promise<LocationInfo | null> => {
  const rows = await fetchSheetRows<ContactSheetRow>(sheetUrl);
  if (!rows) return null;

  return mapLocationRow(rows[0]);
};
