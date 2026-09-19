import { useStore } from "@nanostores/react";

import { $cartLines } from "../lib/cart/store";
import type { CartLine } from "../lib/cart/types";

export function useCartLines(): readonly CartLine[] {
  return useStore($cartLines);
}
