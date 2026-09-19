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

const price = (label: string, amount: number): PriceOption => ({
  label,
  amount,
  currency: "EUR",
  placeholder: false,
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
    description: "",
  },
  entrantes: {
    label: "Entrantes",
    shortLabel: "Entrante",
    eyebrow: "Para picar antes",
    description: "Calzone italiano y pan de ajo, recién salidos del horno.",
  },
  empanadas: {
    label: "Empanadas",
    shortLabel: "Empanada",
    eyebrow: "Doradas y recién hechas",
    description: "Elige unidades sueltas o una caja para compartir.",
  },
  bebidas: {
    label: "Bebidas",
    shortLabel: "Bebida",
    eyebrow: "Para acompañar",
    description: "Refrescos, cerveza y agua bien fría.",
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
    placeholder: false,
    items: [
      {
        id: "pizza-cuatro-quesos",
        name: "Cuatro quesos",
        description: "Tomate, mozzarella y una mezcla de cuatro quesos.",
        badges: [{ label: "Clásica", tone: "classic" }],
        prices: [price("Individual", 10)],
        placeholder: false,
      },
      {
        id: "pizza-jamon-york-aceitunas",
        name: "Jamón York y aceitunas verdes",
        description: "Tomate, mozzarella, jamón york y aceitunas verdes.",
        badges: [{ label: "Clásica", tone: "classic" }],
        prices: [price("Individual", 10)],
        placeholder: false,
      },
      {
        id: "pizza-anchoas-aceitunas",
        name: "Anchoas y aceitunas verdes",
        description: "Tomate, mozzarella, anchoas y aceitunas verdes.",
        badges: [{ label: "Clásica", tone: "classic" }],
        prices: [price("Individual", 10)],
        placeholder: false,
      },
      {
        id: "pizza-bacon-cheddar",
        name: "Bacon y cheddar",
        description: "Tomate, mozzarella, bacon y cheddar.",
        badges: [{ label: "Clásica", tone: "classic" }],
        prices: [price("Individual", 10)],
        placeholder: false,
      },
      {
        id: "pizza-bbq-ternera-bacon",
        name: "BBQ, carne de ternera y bacon",
        description: "Tomate, mozzarella, salsa BBQ, carne de ternera y bacon.",
        badges: [{ label: "Clásica", tone: "classic" }],
        prices: [price("Individual", 10)],
        placeholder: false,
      },
      {
        id: "pizza-pepperoni",
        name: "Pepperoni",
        description: "Tomate, mozzarella y pepperoni.",
        badges: [{ label: "Clásica", tone: "classic" }],
        prices: [price("Individual", 10)],
        placeholder: false,
      },
      {
        id: "pizza-verduras-variadas",
        name: "Verduras variadas",
        description: "Tomate, mozzarella y verduras variadas de temporada.",
        badges: [
          { label: "Clásica", tone: "classic" },
          { label: "Vegetariana", tone: "veggie" },
        ],
        prices: [price("Individual", 10)],
        placeholder: false,
      },
      {
        id: "pizza-atun-tomate",
        name: "Atún y tomate en rodajas",
        description: "Tomate, mozzarella, atún y tomate en rodajas.",
        badges: [{ label: "Clásica", tone: "classic" }],
        prices: [price("Individual", 10)],
        placeholder: false,
      },
      {
        id: "pizza-carbonara-bacon-champinones",
        name: "Carbonara, bacon y champiñones",
        description:
          "Sin tomate. Mozzarella, salsa carbonara, bacon y champiñones.",
        badges: [{ label: "Clásica", tone: "classic" }],
        prices: [price("Individual", 10)],
        placeholder: false,
      },
      {
        id: "pizza-panceta-tomate",
        name: "Panceta y tomate en rodajas",
        description: "Tomate, mozzarella, panceta y tomate en rodajas.",
        badges: [{ label: "Clásica", tone: "classic" }],
        prices: [price("Individual", 10)],
        placeholder: false,
      },
      {
        id: "pizza-parmesano-padano-serrano",
        name: "Parmesano y padano con jamón serrano",
        description: "Tomate, mozzarella, parmesano, padano y jamón serrano.",
        badges: [{ label: "Premium", tone: "new" }],
        prices: [price("Individual", 11.9)],
        placeholder: false,
      },
      {
        id: "pizza-chorizo-mozzarella-fresca",
        name: "Chorizo y mozzarella fresca",
        description: "Tomate, mozzarella y mozzarella fresca con chorizo.",
        badges: [{ label: "Premium", tone: "new" }],
        prices: [price("Individual", 11.9)],
        placeholder: false,
      },
      {
        id: "pizza-gorgonzola-nuez",
        name: "Gorgonzola y nuez",
        description: "Tomate, mozzarella, gorgonzola y nueces.",
        badges: [
          { label: "Premium", tone: "new" },
          { label: "Vegetariana", tone: "veggie" },
        ],
        prices: [price("Individual", 11.9)],
        placeholder: false,
      },
      {
        id: "pizza-roquefort-alcaparras",
        name: "Roquefort y alcaparras",
        description: "Tomate, mozzarella, roquefort y alcaparras.",
        badges: [
          { label: "Premium", tone: "new" },
          { label: "Vegetariana", tone: "veggie" },
        ],
        prices: [price("Individual", 11.9)],
        placeholder: false,
      },
      {
        id: "pizza-mortadela-burrata",
        name: "Mortadela italiana y burrata",
        description: "Tomate, mozzarella, mortadela italiana y burrata.",
        badges: [{ label: "Premium", tone: "new" }],
        prices: [price("Individual", 11.9)],
        placeholder: false,
      },
    ],
  },
  {
    id: "entrantes",
    ...SECTION_PRESETS.entrantes!,
    placeholder: false,
    items: [
      {
        id: "calzone-italiano",
        name: "Calzone Italiano",
        description:
          "Masa artesanal rellena, con acabado exterior de salsa de yogur, kétchup y gotas de aceite de ajo. Elegí uno de los 4 sabores.",
        badges: [],
        prices: [
          price("Jamón York", 8),
          price("Bacon", 8),
          price("Pepperoni picante", 8),
          price("Cheddar", 8),
        ],
        placeholder: false,
      },
      {
        id: "pan-de-ajo-italiano",
        name: "Pan de Ajo Italiano",
        description:
          "Nuestra masa artesanal pincelada con salsa de ajo y hierbas. Elegí uno de los 3 sabores.",
        badges: [],
        prices: [
          price("Jamón York", 7),
          price("Bacon", 7),
          price("Cheddar", 7),
        ],
        placeholder: false,
      },
    ],
  },
  {
    id: "empanadas",
    ...SECTION_PRESETS.empanadas!,
    placeholder: false,
    description:
      "Hechas al horno. Llevando una docena (12) sumás 2 más gratis: 14 unidades por 33,60 €.",
    items: [
      {
        id: "empanada-ternera",
        name: "Ternera",
        description: "Carne de ternera y especias suaves.",
        badges: [{ label: "Clásica", tone: "classic" }],
        prices: [
          price("Unidad", 2.8),
          price("Media docena (6+1 gratis)", 16.8),
        ],
        placeholder: false,
      },
      {
        id: "empanada-ternera-picante",
        name: "Ternera picante",
        description: "Carne de ternera con un toque picante.",
        badges: [{ label: "Picante", tone: "spicy" }],
        prices: [
          price("Unidad", 2.8),
          price("Media docena (6+1 gratis)", 16.8),
        ],
        placeholder: false,
      },
      {
        id: "empanada-pollo",
        name: "Pollo",
        description: "Pollo jugoso, horneado en casa.",
        badges: [],
        prices: [
          price("Unidad", 2.8),
          price("Media docena (6+1 gratis)", 16.8),
        ],
        placeholder: false,
      },
      {
        id: "empanada-jamon-queso",
        name: "Jamón y queso",
        description: "Jamón cocido y queso fundente.",
        badges: [{ label: "Clásica", tone: "classic" }],
        prices: [
          price("Unidad", 2.8),
          price("Media docena (6+1 gratis)", 16.8),
        ],
        placeholder: false,
      },
      {
        id: "empanada-humita",
        name: "Humita",
        description: "Maíz cremoso y queso, receta clásica argentina.",
        badges: [{ label: "Vegetariana", tone: "veggie" }],
        prices: [
          price("Unidad", 2.8),
          price("Media docena (6+1 gratis)", 16.8),
        ],
        placeholder: false,
      },
      {
        id: "empanada-cebolla-caramelizada",
        name: "Cebolla caramelizada",
        description: "Cebolla caramelizada lentamente y queso.",
        badges: [{ label: "Vegetariana", tone: "veggie" }],
        prices: [
          price("Unidad", 2.8),
          price("Media docena (6+1 gratis)", 16.8),
        ],
        placeholder: false,
      },
    ],
  },
  {
    id: "bebidas",
    ...SECTION_PRESETS.bebidas!,
    placeholder: false,
    items: [
      {
        id: "refresco-lata",
        name: "Refresco de lata",
        description: "Lata de 33 cl.",
        badges: [],
        prices: [price("Unidad", 1.5)],
        placeholder: false,
      },
      {
        id: "cerveza-lata",
        name: "Cerveza",
        description: "Lata de 33 cl.",
        badges: [],
        prices: [price("Unidad", 1.9)],
        placeholder: false,
      },
      {
        id: "agua-grande",
        name: "Agua grande",
        description: "Botella de 2 L.",
        badges: [],
        prices: [price("Unidad", 1.9)],
        placeholder: false,
      },
      {
        id: "agua-pequena",
        name: "Agua pequeña",
        description: "Botella individual.",
        badges: [],
        prices: [price("Unidad", 1)],
        placeholder: false,
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
