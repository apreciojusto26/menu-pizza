import { parse as parseDomain } from "tldts";

export interface WhatsAppLinkConfig {
  readonly number: string;
  readonly display: string;
  readonly message: string;
  readonly placeholder: boolean;
}

export interface PublicMenuUrlConfig {
  readonly url: string;
  readonly placeholder: boolean;
}

export interface ConfigurationStatus {
  readonly label: string;
  readonly description: string;
}

const WHATSAPP_NUMBER = /^[1-9]\d{7,14}$/;
const MINIMUM_USEFUL_MESSAGE_LENGTH = 10;
const SPECIAL_USE_HOSTS = [
  "localhost",
  "local",
  "home.arpa",
  "onion",
  "example",
  "invalid",
  "test",
  "alt",
  "internal",
] as const;
const IANA_EXAMPLE_HOSTS = [
  "example.com",
  "example.net",
  "example.org",
] as const;

const matchesHostOrSubdomain = (hostname: string, suffix: string): boolean =>
  hostname === suffix || hostname.endsWith(`.${suffix}`);

const parseIpv4 = (hostname: string): readonly number[] | null => {
  if (!/^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)) return null;

  const octets = hostname.split(".").map(Number);
  return octets.every((octet) => octet >= 0 && octet <= 255) ? octets : null;
};

const isNonPublicIpv4 = (octets: readonly number[]): boolean => {
  const [first = -1, second = -1, third = -1] = octets;

  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 0 && third === 0) ||
    (first === 192 && second === 0 && third === 2) ||
    (first === 192 && second === 168) ||
    (first === 198 && (second === 18 || second === 19)) ||
    (first === 198 && second === 51 && third === 100) ||
    (first === 203 && second === 0 && third === 113) ||
    first >= 224
  );
};

const parseIpv6 = (hostname: string): bigint | null => {
  const unwrapped = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (!unwrapped.includes(":")) return null;

  const halves = unwrapped.split("::");
  if (halves.length > 2) return null;

  const parseHalf = (half: string): string[] =>
    half === "" ? [] : half.split(":");
  const left = parseHalf(halves[0] ?? "");
  const right = parseHalf(halves[1] ?? "");
  const omittedGroups =
    halves.length === 2 ? 8 - left.length - right.length : 0;
  const groups = [
    ...left,
    ...Array.from({ length: omittedGroups }, () => "0"),
    ...right,
  ];

  if (
    omittedGroups < 0 ||
    groups.length !== 8 ||
    groups.some((group) => !/^[\da-f]{1,4}$/.test(group))
  ) {
    return null;
  }

  return groups.reduce(
    (value, group) => (value << 16n) + BigInt(`0x${group}`),
    0n,
  );
};

const isInIpv6Range = (
  value: bigint,
  prefix: bigint,
  prefixLength: number,
): boolean => {
  const shift = BigInt(128 - prefixLength);
  return value >> shift === prefix >> shift;
};

const isNonPublicIpv6 = (value: bigint): boolean =>
  value === 0n ||
  value === 1n ||
  isInIpv6Range(value, 0xffffn << 32n, 96) ||
  isInIpv6Range(value, 0x64ff9b00010000000000000000000000n, 48) ||
  isInIpv6Range(value, 0x01000000000000000000000000000000n, 64) ||
  isInIpv6Range(value, 0x20010db8000000000000000000000000n, 32) ||
  isInIpv6Range(value, 0x3fff0000000000000000000000000000n, 20) ||
  isInIpv6Range(value, 0xfc000000000000000000000000000000n, 7) ||
  isInIpv6Range(value, 0xfe800000000000000000000000000000n, 10) ||
  isInIpv6Range(value, 0xff000000000000000000000000000000n, 8);

const isNonPublicHostname = (rawHostname: string): boolean => {
  const hostname = rawHostname
    .replace(/^\[|\]$/g, "")
    .replace(/\.$/, "")
    .toLowerCase();
  const ipv4 = parseIpv4(hostname);
  if (ipv4) return isNonPublicIpv4(ipv4);

  const ipv6 = parseIpv6(hostname);
  if (ipv6 !== null) return isNonPublicIpv6(ipv6);

  const domain = parseDomain(hostname, { allowPrivateDomains: true });

  return (
    !hostname.includes(".") ||
    SPECIAL_USE_HOSTS.some((host) => matchesHostOrSubdomain(hostname, host)) ||
    IANA_EXAMPLE_HOSTS.some((host) => matchesHostOrSubdomain(hostname, host)) ||
    domain.domain === null ||
    (!domain.isIcann && !domain.isPrivate)
  );
};

export const createWhatsAppUrl = ({
  number,
  display,
  message,
  placeholder,
}: WhatsAppLinkConfig): string | null => {
  const normalizedDisplay = display.trim();
  const normalizedMessage = message.trim();
  const hasUsefulMessage =
    normalizedMessage.length >= MINIMUM_USEFUL_MESSAGE_LENGTH &&
    /[\p{L}\p{N}]/u.test(normalizedMessage);

  if (
    placeholder ||
    !WHATSAPP_NUMBER.test(number) ||
    normalizedDisplay === "" ||
    !hasUsefulMessage
  ) {
    return null;
  }

  return `https://wa.me/${number}?text=${encodeURIComponent(normalizedMessage)}`;
};

/**
 * Enlace de WhatsApp sin número destino: abre el selector de contactos/chats
 * del propio usuario para que reenvíe el mensaje a quien quiera, en vez de
 * escribirle al negocio.
 */
export const createWhatsAppShareUrl = (message: string): string =>
  `https://wa.me/?text=${encodeURIComponent(message.trim())}`;

export const getSafePublicMenuUrl = ({
  url,
  placeholder,
}: PublicMenuUrlConfig): string | null => {
  if (placeholder || url.trim() === "") return null;

  try {
    const parsedUrl = new URL(url.trim());
    if (
      parsedUrl.protocol !== "https:" ||
      parsedUrl.username !== "" ||
      parsedUrl.password !== "" ||
      isNonPublicHostname(parsedUrl.hostname)
    ) {
      return null;
    }

    return parsedUrl.toString();
  } catch {
    return null;
  }
};

export const getConfigurationStatus = (
  placeholder: boolean,
): ConfigurationStatus =>
  placeholder
    ? {
        label: "Dato editable",
        description: "Información de demostración pendiente de confirmar.",
      }
    : {
        label: "Dato confirmado",
        description: "Información comercial confirmada.",
      };
