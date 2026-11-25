import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SubscriptionGraceBanner } from "@/components/dashboard/SubscriptionGraceBanner";
import { calculateSubscriptionTime } from "@/lib/subscription-utils";

describe("Grace Period & Store Alert Banner", () => {
  it("does not render banner for free STARTER plan even if past dates exist", () => {
    const { container } = render(
      <SubscriptionGraceBanner
        subscription={{
          status: "ACTIVE",
          currentPeriodEnd: new Date("2026-10-15"),
          plan: { key: "STARTER", label: "Starter" },
        }}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders amber warning banner when paid subscription is in 7-day grace period", () => {
    // 2 days past due
    const end = new Date("2026-10-20T12:00:00Z");

    render(
      <SubscriptionGraceBanner
        subscription={{
          status: "ACTIVE",
          currentPeriodStart: new Date("2026-09-20T12:00:00Z"),
          currentPeriodEnd: end,
          plan: { key: "RESTRO_IA", label: "Restro IA" },
        }}
      />
    );

    expect(
      screen.getByText(/Periodo de gracia activo: Tu suscripción ha vencido/)
    ).toBeInTheDocument();
    expect(screen.getByText(/periodo de tolerancia de 7 días/)).toBeInTheDocument();
    expect(screen.getByText("Renovar suscripción")).toBeInTheDocument();
  });

  it("renders red danger banner when paid subscription is expired past the 7-day grace period", () => {
    // 15 days past due (8 days beyond grace)
    const end = new Date("2026-10-07T12:00:00Z");

    render(
      <SubscriptionGraceBanner
        subscription={{
          status: "ACTIVE",
          currentPeriodStart: new Date("2026-09-07T12:00:00Z"),
          currentPeriodEnd: end,
          plan: { key: "BUSINESS", label: "Business" },
        }}
      />
    );

    expect(
      screen.getByText(/Suscripción suspendida: Periodo de gracia finalizado/)
    ).toBeInTheDocument();
    expect(screen.getByText("Actualizar plan")).toBeInTheDocument();
  });

  it("calculates correct grace days countdown for 1 to 7 days overdue", () => {
    // Reference: now
    const now = new Date("2026-10-22T12:00:00Z");

    // 1 day overdue -> 6 days remaining in grace
    const sub1 = calculateSubscriptionTime({
      planKey: "RESTRO_IA",
      currentPeriodEnd: new Date("2026-10-21T12:00:00Z"),
      referenceDate: now,
    });
    expect(sub1.urgencyStatus).toBe("GRACE_PERIOD");
    expect(sub1.daysRemainingInGrace).toBe(6);
    expect(sub1.isInGracePeriod).toBe(true);
    expect(sub1.isLockedOut).toBe(false);

    // 7 days overdue -> 0 days remaining in grace (last day of grace)
    const sub7 = calculateSubscriptionTime({
      planKey: "RESTRO_IA",
      currentPeriodEnd: new Date("2026-10-15T12:00:00Z"),
      referenceDate: now,
    });
    expect(sub7.urgencyStatus).toBe("GRACE_PERIOD");
    expect(sub7.daysRemainingInGrace).toBe(0);
    expect(sub7.isInGracePeriod).toBe(true);
    expect(sub7.isLockedOut).toBe(false);

    // 8 days overdue -> EXPIRED, locked out
    const sub8 = calculateSubscriptionTime({
      planKey: "RESTRO_IA",
      currentPeriodEnd: new Date("2026-10-14T12:00:00Z"),
      referenceDate: now,
    });
    expect(sub8.urgencyStatus).toBe("EXPIRED");
    expect(sub8.daysRemainingInGrace).toBe(0);
    expect(sub8.isInGracePeriod).toBe(false);
    expect(sub8.isLockedOut).toBe(true);
  });
});
