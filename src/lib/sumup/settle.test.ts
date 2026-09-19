// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

import type { MenuSection } from "../../data/menu";
import type { PaidOrder } from "../cart/types";
import { settleCheckout, type SettlePorts } from "./settle";
import type { CheckoutSession, SumUpCheckout } from "./types";

const catalog: readonly MenuSection[] = [
  {
    id: "pizzas",
    label: "Pizzas",
    shortLabel: "Pizza",
    eyebrow: "",
    description: "",
    placeholder: false,
    items: [
      {
        id: "pizza-margarita",
        name: "Margarita",
        description: "",
        badges: [],
        placeholder: false,
        prices: [
          {
            label: "Mediana",
            amount: 9.5,
            currency: "EUR",
            placeholder: false,
          },
        ],
      },
    ],
  },
];

const session = (
  overrides: Partial<CheckoutSession> = {},
): CheckoutSession => ({
  lines: [
    { menuItemId: "pizza-margarita", priceLabel: "Mediana", quantity: 2 },
  ],
  amountCents: 1900,
  ...overrides,
});

const paidCheckout = (
  overrides: Partial<SumUpCheckout> = {},
): SumUpCheckout => ({
  id: "sumup-checkout-id",
  checkout_reference: "REF123",
  amount: 19,
  currency: "EUR",
  merchant_code: "MC1",
  status: "PAID",
  date: "2026-08-03T00:00:00Z",
  transactions: [],
  ...overrides,
});

const basePorts = (overrides: Partial<SettlePorts> = {}): SettlePorts => ({
  acquireLock: async () => true,
  releaseLock: async () => {},
  getSession: async () => session(),
  recordFailure: vi.fn().mockResolvedValue({ attempt: 1 }),
  getCheckoutByRef: async () => paidCheckout(),
  getAuthoritativeCatalog: async () => catalog,
  getOrderRecord: async () => null,
  putOrderRecord: vi.fn().mockResolvedValue(undefined),
  notifyOrderPaid: vi.fn().mockResolvedValue(undefined),
  notifyOpsAlert: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

describe("settleCheckout — lock", () => {
  it("returns pending without touching any other port when the lock is already held", async () => {
    const getCheckoutByRef = vi.fn();
    const ports = basePorts({
      acquireLock: async () => false,
      getCheckoutByRef,
    });

    const result = await settleCheckout("REF123", ports);

    expect(result).toEqual({ status: "pending" });
    expect(getCheckoutByRef).not.toHaveBeenCalled();
  });

  it("always releases the lock, even when settlement throws", async () => {
    const releaseLock = vi.fn().mockResolvedValue(undefined);
    const ports = basePorts({
      releaseLock,
      getCheckoutByRef: async () => {
        throw new Error("network down");
      },
    });

    await settleCheckout("REF123", ports);

    expect(releaseLock).toHaveBeenCalledWith("REF123");
  });
});

describe("settleCheckout — payment status", () => {
  it("returns pending when SumUp has not confirmed the checkout yet", async () => {
    const ports = basePorts({
      getCheckoutByRef: async () => paidCheckout({ status: "PENDING" }),
    });

    const result = await settleCheckout("REF123", ports);

    expect(result).toEqual({ status: "pending" });
  });

  it("returns pending when the checkout does not exist yet", async () => {
    const ports = basePorts({ getCheckoutByRef: async () => null });

    const result = await settleCheckout("REF123", ports);

    expect(result).toEqual({ status: "pending" });
  });
});

describe("settleCheckout — three-way total guard", () => {
  it("aborts and dead-letters on a mismatch — no order is written or notified", async () => {
    const putOrderRecord = vi.fn();
    const notifyOrderPaid = vi.fn();
    const recordFailure = vi.fn().mockResolvedValue({ attempt: 1 });
    const notifyOpsAlert = vi.fn().mockResolvedValue(undefined);

    const ports = basePorts({
      getSession: async () => session({ amountCents: 2000 }), // disagrees with catalog (1900) and sumup (1900)
      putOrderRecord,
      notifyOrderPaid,
      recordFailure,
      notifyOpsAlert,
    });

    const result = await settleCheckout("REF123", ports);

    expect(putOrderRecord).not.toHaveBeenCalled();
    expect(notifyOrderPaid).not.toHaveBeenCalled();
    expect(recordFailure).toHaveBeenCalledOnce();
    expect(notifyOpsAlert).toHaveBeenCalledOnce();
    expect(result).toEqual({ status: "retrying", attempt: 1 });
  });

  it("proceeds to write and notify when all three totals agree", async () => {
    const putOrderRecord = vi.fn().mockResolvedValue(undefined);
    const notifyOrderPaid = vi.fn().mockResolvedValue(undefined);
    const ports = basePorts({ putOrderRecord, notifyOrderPaid });

    const result = await settleCheckout("REF123", ports);

    expect(putOrderRecord).toHaveBeenCalledOnce();
    const [ref, order] = putOrderRecord.mock.calls[0] as [string, PaidOrder];
    expect(ref).toBe("REF123");
    expect(order.reference).toBe("REF123");
    expect(order.totalAmount).toBe(19);
    expect(order.lines).toHaveLength(1);
    expect(notifyOrderPaid).toHaveBeenCalledWith(order);
    expect(result).toEqual({ status: "paid", reference: "REF123" });
  });

  it("aborts when the session line no longer resolves against the live catalog", async () => {
    const putOrderRecord = vi.fn();
    const ports = basePorts({
      getSession: async () =>
        session({
          lines: [
            { menuItemId: "no-existe", priceLabel: "Mediana", quantity: 1 },
          ],
        }),
      putOrderRecord,
    });

    const result = await settleCheckout("REF123", ports);

    expect(putOrderRecord).not.toHaveBeenCalled();
    expect(result).toEqual({ status: "retrying", attempt: 1 });
  });
});

describe("settleCheckout — idempotency", () => {
  it("a second call for an already-settled ref returns paid without re-writing or re-notifying", async () => {
    const putOrderRecord = vi.fn();
    const notifyOrderPaid = vi.fn();
    const existingOrder: PaidOrder = {
      reference: "REF123",
      sumupCheckoutId: "sumup-checkout-id",
      lines: [],
      totalAmount: 19,
      currency: "EUR",
      paidAt: "2026-08-03T00:00:00Z",
    };
    const ports = basePorts({
      getOrderRecord: async () => existingOrder,
      putOrderRecord,
      notifyOrderPaid,
    });

    const result = await settleCheckout("REF123", ports);

    expect(putOrderRecord).not.toHaveBeenCalled();
    expect(notifyOrderPaid).not.toHaveBeenCalled();
    expect(result).toEqual({ status: "paid", reference: "REF123" });
  });
});

describe("settleCheckout — retry ceiling", () => {
  it("reports failed once the failure attempt count reaches the max", async () => {
    const ports = basePorts({
      getSession: async () => null,
      recordFailure: vi.fn().mockResolvedValue({ attempt: 5 }),
    });

    const result = await settleCheckout("REF123", ports);

    expect(result).toEqual({ status: "failed", ref: "REF123" });
  });
});
