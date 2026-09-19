import type { MenuSection, MenuSectionId, PriceOption } from "../../data/menu";

export interface CartLine {
  readonly menuItemId: string;
  readonly priceLabel: string;
  readonly quantity: number;
}

export interface ResolvedCartLine extends CartLine {
  readonly itemName: string;
  readonly sectionLabel: string;
  readonly sectionId: MenuSectionId;
  readonly imageUrl?: string | undefined;
  readonly price: PriceOption;
  readonly lineTotal: number;
}

export interface ResolvedCart {
  readonly lines: readonly ResolvedCartLine[];
  readonly invalidLines: readonly CartLine[];
  readonly totalAmount: number;
  readonly currency: "EUR";
}

export interface PaidOrder {
  readonly reference: string;
  readonly lines: readonly ResolvedCartLine[];
  readonly totalAmount: number;
  readonly currency: "EUR";
  readonly paidAt: string;
  readonly sumupCheckoutId: string;
}

export type MenuCatalog = readonly MenuSection[];
