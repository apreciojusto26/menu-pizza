/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_MENU_URL?: string;
  readonly PUBLIC_MENU_URL_CONFIRMED?: string;
  readonly PUBLIC_LOCATION_LABEL?: string;
  readonly PUBLIC_LOCATION_DETAIL?: string;
  readonly PUBLIC_LOCATION_CONFIRMED?: string;
  readonly PUBLIC_SCHEDULE_LABEL?: string;
  readonly PUBLIC_SCHEDULE_DETAIL?: string;
  readonly PUBLIC_SCHEDULE_CONFIRMED?: string;
  readonly PUBLIC_WHATSAPP_NUMBER?: string;
  readonly PUBLIC_WHATSAPP_DISPLAY?: string;
  readonly PUBLIC_WHATSAPP_MESSAGE?: string;
  readonly PUBLIC_WHATSAPP_CONFIRMED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
