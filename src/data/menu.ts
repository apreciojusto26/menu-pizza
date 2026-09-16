export type MenuSectionId = string;

export type BadgeTone = "classic" | "spicy" | "veggie" | "new";

export interface MenuBadge {
  readonly label: string;
  readonly tone: BadgeTone;
}

export interface PriceOption {
  readonly label: string;
  readonly amount: number;
  readonly currency: "EUR";
  readonly placeholder: boolean;
}

export interface MenuItem {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly badges: readonly MenuBadge[];
  readonly prices: readonly PriceOption[];
  readonly placeholder: boolean;
  readonly imageUrl?: string | undefined;
}

export interface MenuSection {
  readonly id: MenuSectionId;
  readonly label: string;
  readonly shortLabel: string;
  readonly eyebrow: string;
  readonly description: string;
  readonly placeholder: boolean;
  readonly items: readonly MenuItem[];
}

export interface MenuContentStatus {
  readonly placeholder: boolean;
  readonly placeholderSections: number;
  readonly placeholderItems: number;
  readonly placeholderPrices: number;
}

export interface RestaurantInfo {
  readonly name: string;
  readonly location: {
    readonly label: string;
    readonly detail: string;
    readonly placeholder: boolean;
  };
  readonly schedule: {
    readonly label: string;
    readonly detail: string;
    readonly placeholder: boolean;
  };
  readonly whatsapp: {
    readonly number: string;
    readonly display: string;
    readonly defaultMessage: string;
    readonly placeholder: boolean;
  };
  readonly menuUrl: {
    readonly url: string;
    readonly placeholder: boolean;
  };
}

const restaurantName = "Italy Pizza";
const envValue = (value: string | undefined): string => value?.trim() ?? "";
const isConfirmed = (value: string | undefined): boolean => value === "true";

const locationLabel = envValue(import.meta.env.PUBLIC_LOCATION_LABEL);
const locationDetail = envValue(import.meta.env.PUBLIC_LOCATION_DETAIL);
const scheduleLabel = envValue(import.meta.env.PUBLIC_SCHEDULE_LABEL);
const scheduleDetail = envValue(import.meta.env.PUBLIC_SCHEDULE_DETAIL);
const whatsappNumber = envValue(import.meta.env.PUBLIC_WHATSAPP_NUMBER);
const whatsappDisplay = envValue(import.meta.env.PUBLIC_WHATSAPP_DISPLAY);
const whatsappMessage = envValue(import.meta.env.PUBLIC_WHATSAPP_MESSAGE);

const samplePrice = (label: string, amount: number): PriceOption => ({
  label,
  amount,
  currency: "EUR",
  placeholder: true,
});

export interface SectionPreset {
  readonly label: string;
  readonly shortLabel: string;
  readonly eyebrow: string;
  readonly description: string;
}

export const SECTION_PRESETS: Record<string, SectionPreset> = {
  pizzas: {
    label: "Pizzas",
    shortLabel: "Pizza",
    eyebrow: "Masa, tiempo y horno",
    description: "Elige tu tamaño y encuentra una pizza para compartir.",
  },
  empanadas: {
    label: "Empanadas",
    shortLabel: "Empanada",
    eyebrow: "Doradas y recién hechas",
    description: "Elige unidades sueltas o una caja para compartir.",
  },
};

export const restaurant: RestaurantInfo = {
  name: restaurantName,
  location: {
    label: locationLabel || "Dirección por confirmar",
    detail:
      locationDetail || "Añade aquí la calle, localidad y enlace al mapa.",
    placeholder:
      !isConfirmed(import.meta.env.PUBLIC_LOCATION_CONFIRMED) ||
      !locationLabel ||
      !locationDetail,
  },
  schedule: {
    label: scheduleLabel || "Horario por confirmar",
    detail:
      scheduleDetail ||
      "Añade aquí los días de apertura y la hora del último pedido.",
    placeholder:
      !isConfirmed(import.meta.env.PUBLIC_SCHEDULE_CONFIRMED) ||
      !scheduleLabel ||
      !scheduleDetail,
  },
  whatsapp: {
    number: whatsappNumber,
    display: whatsappDisplay || "Contacto por confirmar",
    defaultMessage:
      whatsappMessage ||
      `Hola, he visto la carta digital de ${restaurantName} y quiero hacer un pedido.`,
    placeholder:
      !isConfirmed(import.meta.env.PUBLIC_WHATSAPP_CONFIRMED) ||
      !whatsappNumber ||
      !whatsappDisplay ||
      !whatsappMessage,
  },
  menuUrl: {
    url: envValue(import.meta.env.PUBLIC_MENU_URL),
    placeholder: !isConfirmed(import.meta.env.PUBLIC_MENU_URL_CONFIRMED),
  },
};

export const menuSections: readonly MenuSection[] = [
  {
    id: "pizzas",
    ...SECTION_PRESETS.pizzas!,
    placeholder: true,
    items: [
      {
        id: "pizza-margarita-demo",
        name: "Margarita",
        description: "Tomate, mozzarella y albahaca.",
        badges: [{ label: "Clásica", tone: "classic" }],
        prices: [samplePrice("Mediana", 9.5), samplePrice("Familiar", 15)],
        placeholder: true,
      },
      {
        id: "pizza-huerta-demo",
        name: "Huerta",
        description: "Mozzarella y verduras de temporada.",
        badges: [{ label: "Vegetariana", tone: "veggie" }],
        prices: [samplePrice("Mediana", 10.5), samplePrice("Familiar", 16)],
        placeholder: true,
      },
      {
        id: "pizza-picante-demo",
        name: "Fuego",
        description: "Tomate, mozzarella y un toque picante.",
        badges: [{ label: "Picante", tone: "spicy" }],
        prices: [samplePrice("Mediana", 11), samplePrice("Familiar", 17)],
        placeholder: true,
      },
      {
        id: "pizza-casa-demo",
        name: restaurant.name,
        description: "Propuesta especial de la casa.",
        badges: [{ label: "Próximamente", tone: "new" }],
        prices: [samplePrice("Mediana", 11.5), samplePrice("Familiar", 18)],
        placeholder: true,
      },
    ],
  },
  {
    id: "empanadas",
    ...SECTION_PRESETS.empanadas!,
    placeholder: true,
    items: [
      {
        id: "empanada-carne-suave",
        name: "Carne suave",
        description: "Carne, cebolla y especias suaves.",
        badges: [{ label: "Favorita", tone: "classic" }],
        prices: [samplePrice("Unidad", 2.9), samplePrice("Caja de 6", 16)],
        placeholder: true,
      },
      {
        id: "empanada-pollo",
        name: "Pollo especiado",
        description: "Pollo, pimiento y cebolla.",
        badges: [],
        prices: [samplePrice("Unidad", 2.9), samplePrice("Caja de 6", 16)],
        placeholder: true,
      },
      {
        id: "empanada-jamon-queso",
        name: "Jamón y queso",
        description: "Jamón cocido y queso fundente.",
        badges: [{ label: "Clásica", tone: "classic" }],
        prices: [samplePrice("Unidad", 2.9), samplePrice("Caja de 6", 16)],
        placeholder: true,
      },
      {
        id: "empanada-caprese",
        name: "Caprese",
        description: "Tomate, mozzarella y albahaca.",
        badges: [{ label: "Vegetariana", tone: "veggie" }],
        prices: [samplePrice("Unidad", 2.9), samplePrice("Caja de 6", 16)],
        placeholder: true,
      },
      {
        id: "empanada-cebolla-queso",
        name: "Cebolla y queso",
        description: "Cebolla cocinada lentamente y queso.",
        badges: [{ label: "Vegetariana", tone: "veggie" }],
        prices: [samplePrice("Unidad", 2.9), samplePrice("Caja de 6", 16)],
        placeholder: true,
      },
      {
        id: "empanada-picante",
        name: "Carne picante",
        description: "Carne, cebolla y chile suave.",
        badges: [{ label: "Picante", tone: "spicy" }],
        prices: [samplePrice("Unidad", 3.1), samplePrice("Caja de 6", 17)],
        placeholder: true,
      },
    ],
  },
] as const;

export const deriveMenuContentStatus = (
  sections: readonly MenuSection[],
): MenuContentStatus => {
  const placeholderSections = sections.filter(
    (section) => section.placeholder,
  ).length;
  const items = sections.flatMap((section) => section.items);
  const placeholderItems = items.filter((item) => item.placeholder).length;
  const placeholderPrices = items
    .flatMap((item) => item.prices)
    .filter((price) => price.placeholder).length;

  return {
    placeholder: placeholderSections + placeholderItems + placeholderPrices > 0,
    placeholderSections,
    placeholderItems,
    placeholderPrices,
  };
};

export const menuContentStatus = deriveMenuContentStatus(menuSections);

export const formatPrice = (price: PriceOption): string =>
  new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: price.currency,
    minimumFractionDigits: price.amount % 1 === 0 ? 0 : 2,
  }).format(price.amount);
