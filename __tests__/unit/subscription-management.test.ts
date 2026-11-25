import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  calculateSubscriptionTime,
  addDaysToDate,
  formatDateShort,
  formatDateInput,
  formatCurrencyCOP,
} from "@/lib/subscription-utils";

describe("Subscription Utilities & Calculations", () => {
  const mockNow = new Date("2026-10-22T12:00:00.000Z");

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(mockNow);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("calculateSubscriptionTime", () => {
    it("should handle Starter plan without end date as UNLIMITED", () => {
      const calc = calculateSubscriptionTime({
        planKey: "STARTER",
        status: "ACTIVE",
        currentPeriodStart: new Date("2026-01-01"),
        currentPeriodEnd: null,
      });

      expect(calc.urgencyStatus).toBe("UNLIMITED");
      expect(calc.isExpired).toBe(false);
      expect(calc.isExpiringSoon).toBe(false);
      expect(calc.badgeVariant).toBe("neutral");
      expect(calc.statusLabel).toContain("Sin vencimiento");
      expect(calc.formattedEndDate).toBe("Ilimitado");
    });

    it("should handle paid plan with no dates configured as NOT_CONFIGURED", () => {
      const calc = calculateSubscriptionTime({
        planKey: "RESTRO_IA",
        status: "ACTIVE",
        currentPeriodStart: null,
        currentPeriodEnd: null,
      });

      expect(calc.urgencyStatus).toBe("NOT_CONFIGURED");
      expect(calc.badgeVariant).toBe("warning");
      expect(calc.statusLabel).toContain("Sin fecha");
    });

    it("should handle active subscription with more than 7 days remaining", () => {
      const start = new Date("2026-10-01T12:00:00.000Z");
      const end = new Date("2026-11-05T12:00:00.000Z"); // 14 days from mockNow

      const calc = calculateSubscriptionTime({
        planKey: "RESTRO_IA",
        status: "ACTIVE",
        currentPeriodStart: start,
        currentPeriodEnd: end,
      });

      expect(calc.urgencyStatus).toBe("ACTIVE");
      expect(calc.badgeVariant).toBe("success");
      expect(calc.isExpired).toBe(false);
      expect(calc.isExpiringSoon).toBe(false);
      expect(calc.daysRemaining).toBe(14);
      expect(calc.statusLabel).toBe("14 días restantes");
      expect(calc.percentElapsed).toBeGreaterThan(0);
      expect(calc.percentElapsed).toBeLessThan(100);
    });

    it("should identify subscriptions expiring soon (≤ 7 days)", () => {
      const start = new Date("2026-10-01T12:00:00.000Z");
      const end = new Date("2026-10-25T12:00:00.000Z"); // 3 days from mockNow

      const calc = calculateSubscriptionTime({
        planKey: "BUSINESS",
        status: "ACTIVE",
        currentPeriodStart: start,
        currentPeriodEnd: end,
      });

      expect(calc.urgencyStatus).toBe("EXPIRING_SOON");
      expect(calc.badgeVariant).toBe("warning");
      expect(calc.isExpiringSoon).toBe(true);
      expect(calc.isExpired).toBe(false);
      expect(calc.daysRemaining).toBe(3);
      expect(calc.statusLabel).toBe("Vence en 3 días");
    });

    it("should handle singular '1 día' when expiring tomorrow", () => {
      const end = new Date("2026-10-23T12:00:00.000Z"); // 1 day from mockNow

      const calc = calculateSubscriptionTime({
        planKey: "CARTA_DIGITAL",
        status: "ACTIVE",
        currentPeriodStart: new Date("2026-09-23T12:00:00.000Z"),
        currentPeriodEnd: end,
      });

      expect(calc.urgencyStatus).toBe("EXPIRING_SOON");
      expect(calc.daysRemaining).toBe(1);
      expect(calc.statusLabel).toBe("Vence en 1 día");
    });

    it("should handle expiration today (0 days diff)", () => {
      const end = new Date("2026-10-22T12:00:00.000Z"); // same as mockNow

      const calc = calculateSubscriptionTime({
        planKey: "RESTRO_IA",
        status: "ACTIVE",
        currentPeriodStart: new Date("2026-09-22T12:00:00.000Z"),
        currentPeriodEnd: end,
      });

      expect(calc.urgencyStatus).toBe("EXPIRING_SOON");
      expect(calc.badgeVariant).toBe("danger");
      expect(calc.statusLabel).toBe("¡Vence hoy!");
    });

    it("should handle subscriptions within the 7-day grace period", () => {
      const end = new Date("2026-10-18T12:00:00.000Z"); // 4 days ago

      const calc = calculateSubscriptionTime({
        planKey: "RESTRO_IA",
        status: "ACTIVE",
        currentPeriodStart: new Date("2026-09-18T12:00:00.000Z"),
        currentPeriodEnd: end,
      });

      expect(calc.urgencyStatus).toBe("GRACE_PERIOD");
      expect(calc.badgeVariant).toBe("warning");
      expect(calc.isExpired).toBe(true);
      expect(calc.isInGracePeriod).toBe(true);
      expect(calc.isLockedOut).toBe(false);
      expect(calc.daysRemainingInGrace).toBe(3);
      expect(calc.statusLabel).toContain("En gracia");
      expect(calc.percentElapsed).toBe(100);
    });

    it("should lock out subscriptions expired beyond the 7-day grace period", () => {
      const end = new Date("2026-10-12T12:00:00.000Z"); // 10 days ago (3 days past grace)

      const calc = calculateSubscriptionTime({
        planKey: "RESTRO_IA",
        status: "ACTIVE",
        currentPeriodStart: new Date("2026-09-12T12:00:00.000Z"),
        currentPeriodEnd: end,
      });

      expect(calc.urgencyStatus).toBe("EXPIRED");
      expect(calc.badgeVariant).toBe("danger");
      expect(calc.isExpired).toBe(true);
      expect(calc.isInGracePeriod).toBe(false);
      expect(calc.isLockedOut).toBe(true);
      expect(calc.daysRemainingInGrace).toBe(0);
      expect(calc.statusLabel).toContain("Bloqueada");
      expect(calc.percentElapsed).toBe(100);
    });

    it("should handle active trial period", () => {
      const trialEnd = new Date("2026-10-31T12:00:00.000Z"); // 9 days in future

      const calc = calculateSubscriptionTime({
        planKey: "RESTRO_IA",
        status: "TRIAL",
        trialEndsAt: trialEnd,
      });

      expect(calc.urgencyStatus).toBe("TRIAL");
      expect(calc.badgeVariant).toBe("info");
      expect(calc.daysRemaining).toBe(9);
      expect(calc.statusLabel).toContain("En prueba (9 días)");
    });

    it("should handle cancelled subscriptions", () => {
      const calc = calculateSubscriptionTime({
        planKey: "BUSINESS",
        status: "CANCELLED",
        currentPeriodEnd: new Date("2026-11-01T12:00:00.000Z"),
      });

      expect(calc.urgencyStatus).toBe("CANCELLED");
      expect(calc.badgeVariant).toBe("danger");
      expect(calc.isExpired).toBe(true);
      expect(calc.statusLabel).toBe("Suscripción cancelada");
    });
  });

  describe("Helper Functions", () => {
    it("should add days to a date correctly", () => {
      const base = new Date(2026, 9, 22, 12, 0, 0); // Oct 22, 2026
      const next = addDaysToDate(base, 30);
      expect(next.getDate()).toBe(21); // Oct 22 + 30 days = Nov 21
      expect(next.getMonth()).toBe(10); // November (0-indexed 10)
    });

    it("should format input date string to YYYY-MM-DD", () => {
      const date = new Date(2026, 9, 22); // Oct 22, 2026
      expect(formatDateInput(date)).toBe("2026-10-22");
    });

    it("should format currency in COP properly", () => {
      const cop = formatCurrencyCOP(49900);
      expect(cop).toContain("49.900");
    });
  });
});
