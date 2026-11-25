/**
 * Utilities for calculating subscription time remaining,
 * expiration dates, and lifecycle statuses.
 */

export interface SubscriptionTimeCalculation {
  daysRemaining: number | null;
  hoursRemaining: number | null;
  percentElapsed: number;
  urgencyStatus:
    | "UNLIMITED"
    | "ACTIVE"
    | "EXPIRING_SOON"
    | "GRACE_PERIOD"
    | "EXPIRED"
    | "TRIAL"
    | "CANCELLED"
    | "NOT_CONFIGURED";
  statusLabel: string;
  badgeVariant: "success" | "warning" | "danger" | "info" | "neutral";
  isExpired: boolean;
  isExpiringSoon: boolean;
  isInGracePeriod?: boolean;
  isLockedOut?: boolean;
  daysRemainingInGrace?: number | null;
  graceDaysTotal?: number;
  formattedEndDate: string | null;
  formattedStartDate: string | null;
}

export function formatDateShort(date: Date | string | null | undefined): string | null {
  if (!date) return null;
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return null;

  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatDateInput(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";

  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatCurrencyCOP(amount: number | null | undefined): string {
  if (amount == null) return "$0";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function addDaysToDate(baseDate: Date | string, days: number): Date {
  const d = typeof baseDate === "string" ? new Date(baseDate) : new Date(baseDate.getTime());
  d.setDate(d.getDate() + days);
  return d;
}

export function calculateSubscriptionTime(params: {
  currentPeriodStart?: Date | string | null;
  currentPeriodEnd?: Date | string | null;
  trialEndsAt?: Date | string | null;
  status?: string | null;
  planKey?: string | null;
  referenceDate?: Date;
}): SubscriptionTimeCalculation {
  const now = params.referenceDate || new Date();
  const planKey = params.planKey || "STARTER";
  const status = (params.status || "ACTIVE").toUpperCase();

  const startDate = params.currentPeriodStart
    ? typeof params.currentPeriodStart === "string"
      ? new Date(params.currentPeriodStart)
      : params.currentPeriodStart
    : null;

  const endDate = params.currentPeriodEnd
    ? typeof params.currentPeriodEnd === "string"
      ? new Date(params.currentPeriodEnd)
      : params.currentPeriodEnd
    : null;

  const trialEndDate = params.trialEndsAt
    ? typeof params.trialEndsAt === "string"
      ? new Date(params.trialEndsAt)
      : params.trialEndsAt
    : null;

  const formattedStartDate = formatDateShort(startDate);
  const formattedEndDate = formatDateShort(endDate);

  // 1. Cancelled
  if (status === "CANCELLED") {
    return {
      daysRemaining: null,
      hoursRemaining: null,
      percentElapsed: 100,
      urgencyStatus: "CANCELLED",
      statusLabel: "Suscripción cancelada",
      badgeVariant: "danger",
      isExpired: true,
      isExpiringSoon: false,
      formattedEndDate,
      formattedStartDate,
    };
  }

  // 2. Free Starter plan with no expiration configured
  if (planKey === "STARTER" && !endDate) {
    return {
      daysRemaining: null,
      hoursRemaining: null,
      percentElapsed: 0,
      urgencyStatus: "UNLIMITED",
      statusLabel: "Starter Gratuito (Sin vencimiento)",
      badgeVariant: "neutral",
      isExpired: false,
      isExpiringSoon: false,
      formattedEndDate: "Ilimitado",
      formattedStartDate,
    };
  }

  // 3. Paid plan with no dates configured yet
  if (!endDate && !trialEndDate) {
    return {
      daysRemaining: null,
      hoursRemaining: null,
      percentElapsed: 0,
      urgencyStatus: "NOT_CONFIGURED",
      statusLabel: "Sin fecha de inicio/fin",
      badgeVariant: "warning",
      isExpired: false,
      isExpiringSoon: true,
      formattedEndDate: "Sin configurar",
      formattedStartDate,
    };
  }

  // Target date for calculation (trial or period end)
  const isTrial = status === "TRIAL" || (trialEndDate && trialEndDate > now);
  const targetDate = isTrial && trialEndDate ? trialEndDate : (endDate || trialEndDate)!;

  const diffMs = targetDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));

  // Cycle progress calculation
  let percentElapsed = 0;
  if (startDate && targetDate > startDate) {
    const totalCycleMs = targetDate.getTime() - startDate.getTime();
    const elapsedMs = now.getTime() - startDate.getTime();
    percentElapsed = Math.min(100, Math.max(0, Math.round((elapsedMs / totalCycleMs) * 100)));
  } else if (diffDays < 0) {
    percentElapsed = 100;
  }

  // Expiring today
  if (diffDays === 0 && diffMs >= 0) {
    return {
      daysRemaining: 0,
      hoursRemaining: Math.max(0, diffHours),
      percentElapsed: 98,
      urgencyStatus: "EXPIRING_SOON",
      statusLabel: "¡Vence hoy!",
      badgeVariant: "danger",
      isExpired: false,
      isExpiringSoon: true,
      formattedEndDate: formatDateShort(targetDate),
      formattedStartDate,
    };
  }

  // Expired / Grace Period (7 days allowance before hard lockout)
  if (diffMs < 0 || diffDays < 0) {
    const absDays = Math.abs(diffDays);
    const GRACE_DAYS = 7;

    // Within 7 days grace period: store is NOT locked out, alert shown with remaining days
    if (absDays <= GRACE_DAYS) {
      const daysRemainingInGrace = Math.max(0, GRACE_DAYS - absDays);
      const label =
        absDays === 0
          ? "Venció hoy (7 días de gracia)"
          : `En gracia (Vencida hace ${absDays}d • ${daysRemainingInGrace}d restan)`;

      return {
        daysRemaining: diffDays,
        hoursRemaining: diffHours,
        percentElapsed: 100,
        urgencyStatus: "GRACE_PERIOD",
        statusLabel: isTrial ? `Prueba vencida • ${daysRemainingInGrace}d gracia` : label,
        badgeVariant: "warning",
        isExpired: true,
        isExpiringSoon: true,
        isInGracePeriod: true,
        isLockedOut: false,
        daysRemainingInGrace,
        graceDaysTotal: GRACE_DAYS,
        formattedEndDate: formatDateShort(targetDate),
        formattedStartDate,
      };
    }

    // Beyond 7 days: hard expired / lockout
    const overdueDays = absDays - GRACE_DAYS;
    const label = `Bloqueada (Gracia venció hace ${overdueDays} ${overdueDays === 1 ? "día" : "días"})`;

    return {
      daysRemaining: diffDays,
      hoursRemaining: diffHours,
      percentElapsed: 100,
      urgencyStatus: "EXPIRED",
      statusLabel: isTrial ? `Prueba vencida hace ${absDays}d (Bloqueada)` : label,
      badgeVariant: "danger",
      isExpired: true,
      isExpiringSoon: false,
      isInGracePeriod: false,
      isLockedOut: true,
      daysRemainingInGrace: 0,
      graceDaysTotal: GRACE_DAYS,
      formattedEndDate: formatDateShort(targetDate),
      formattedStartDate,
    };
  }

  // Expiring soon (1 to 7 days)
  if (diffDays <= 7) {
    const prefix = isTrial ? "Prueba vence en" : "Vence en";
    const label = `${prefix} ${diffDays} ${diffDays === 1 ? "día" : "días"}`;

    return {
      daysRemaining: diffDays,
      hoursRemaining: diffHours,
      percentElapsed,
      urgencyStatus: "EXPIRING_SOON",
      statusLabel: label,
      badgeVariant: "warning",
      isExpired: false,
      isExpiringSoon: true,
      formattedEndDate: formatDateShort(targetDate),
      formattedStartDate,
    };
  }

  // Trial active (> 7 days)
  if (isTrial) {
    return {
      daysRemaining: diffDays,
      hoursRemaining: diffHours,
      percentElapsed,
      urgencyStatus: "TRIAL",
      statusLabel: `En prueba (${diffDays} días)`,
      badgeVariant: "info",
      isExpired: false,
      isExpiringSoon: false,
      formattedEndDate: formatDateShort(targetDate),
      formattedStartDate,
    };
  }

  // Healthy active (> 7 days)
  return {
    daysRemaining: diffDays,
    hoursRemaining: diffHours,
    percentElapsed,
    urgencyStatus: "ACTIVE",
    statusLabel: `${diffDays} días restantes`,
    badgeVariant: "success",
    isExpired: false,
    isExpiringSoon: false,
    formattedEndDate: formatDateShort(targetDate),
    formattedStartDate,
  };
}
