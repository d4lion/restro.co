// ─── PLAN TYPES ───────────────────────────────────────────────────────────────

/** Keys used in the Plan.key column */
export type PlanKey = "STARTER" | "RESTRO_IA" | "BUSINESS";

/** Shape of a Plan record from the database */
export interface PlanRecord {
  id: string;
  key: PlanKey;
  label: string;
  tag: string;
  description: string | null;
  priceMonthly: number;
  priceYearly: number | null;
  maxTables: number;     // -1 = unlimited
  maxMenuItems: number;  // -1 = unlimited
  maxStaff: number;      // -1 = unlimited
  maxMenus: number;      // -1 = unlimited
  analyticsDays: number;
  hasAI: boolean;
  hasInventory: boolean;
  hasMultiLanguage: boolean;
  hasExportPDF: boolean;
  hasExportExcel: boolean;
  hasCustomBranding: boolean;
  hasWhatsApp: boolean;
  hasPrioritySupport: boolean;
  sortOrder: number;
  isActive: boolean;
}

/** Runtime-friendly limits (converts -1 → Infinity for easy comparisons) */
export interface PlanLimits {
  maxTables: number;
  maxMenuItems: number;
  maxStaff: number;
  maxMenus: number;
  analyticsDays: number;
  hasAI: boolean;
  hasInventory: boolean;
  hasMultiLanguage: boolean;
  hasExportPDF: boolean;
  hasExportExcel: boolean;
  hasCustomBranding: boolean;
  hasWhatsApp: boolean;
  hasPrioritySupport: boolean;
  priceMonthly: number;
  priceYearly: number | null;
  label: string;
  tag: string;
}

/** Convert a DB Plan record to runtime limits (-1 → Infinity) */
export function getPlanLimits(plan: PlanRecord): PlanLimits {
  const unlimit = (v: number) => (v === -1 ? Infinity : v);
  return {
    maxTables: unlimit(plan.maxTables),
    maxMenuItems: unlimit(plan.maxMenuItems),
    maxStaff: unlimit(plan.maxStaff),
    maxMenus: unlimit(plan.maxMenus),
    analyticsDays: plan.analyticsDays,
    hasAI: plan.hasAI,
    hasInventory: plan.hasInventory,
    hasMultiLanguage: plan.hasMultiLanguage,
    hasExportPDF: plan.hasExportPDF,
    hasExportExcel: plan.hasExportExcel,
    hasCustomBranding: plan.hasCustomBranding,
    hasWhatsApp: plan.hasWhatsApp,
    hasPrioritySupport: plan.hasPrioritySupport,
    priceMonthly: plan.priceMonthly,
    priceYearly: plan.priceYearly,
    label: plan.label,
    tag: plan.tag,
  };
}

/**
 * @deprecated Use Plan table from DB instead. Kept as static fallback only.
 */
export const PLAN_LIMITS = {
  STARTER: {
    maxTables: 5,
    maxMenuItems: 20,
    maxStaff: 1,
    maxMenus: 1,
    analyticsDays: 7,
    hasImages: true,
    hasAI: false,
    hasInventory: false,
    hasMultiLanguage: false,
    hasExportPDF: false,
    hasExportExcel: false,
    hasCustomBranding: false,
    hasWhatsApp: false,
    hasPrioritySupport: false,
    priceMonthly: 0,
    priceYearly: null,
    label: "Starter",
    tag: "GRATIS",
  },
  RESTRO_IA: {
    maxTables: 30,
    maxMenuItems: Infinity,
    maxStaff: 10,
    maxMenus: 5,
    analyticsDays: 365,
    hasImages: true,
    hasAI: true,
    hasInventory: true,
    hasMultiLanguage: true,
    hasExportPDF: true,
    hasExportExcel: false,
    hasCustomBranding: true,
    hasWhatsApp: false,
    hasPrioritySupport: false,
    priceMonthly: 49900,
    priceYearly: 479000,
    label: "Restro IA",
    tag: "PRO",
  },
  BUSINESS: {
    maxTables: Infinity,
    maxMenuItems: Infinity,
    maxStaff: Infinity,
    maxMenus: Infinity,
    analyticsDays: 365,
    hasImages: true,
    hasAI: true,
    hasInventory: true,
    hasMultiLanguage: true,
    hasExportPDF: true,
    hasExportExcel: true,
    hasCustomBranding: true,
    hasWhatsApp: true,
    hasPrioritySupport: true,
    priceMonthly: 99900,
    priceYearly: 959000,
    label: "Business",
    tag: "ENTERPRISE",
  },
} as const;


// ─── ORDER TYPES ──────────────────────────────────────────────────────────────

export const ORDER_TYPES = {
  DINE_IN: { label: "En el local", description: "Pedido en mesa" },
  TAKEOUT: { label: "Para llevar", description: "Retirar en el local" },
  DELIVERY: { label: "Domicilio", description: "Entrega a domicilio" },
} as const;

export type OrderType = keyof typeof ORDER_TYPES;

// ─── ORDER STATUSES ───────────────────────────────────────────────────────────

export const ORDER_STATUSES = {
  PENDING: { label: "Nuevo", color: "#F97316" },
  PREPARING: { label: "Preparando", color: "#F59E0B" },
  READY: { label: "Listo", color: "#10B981" },
  DELIVERED: { label: "Entregado", color: "#64748B" },
  CANCELLED: { label: "Cancelado", color: "#EF4444" },
} as const;

export type OrderStatus = keyof typeof ORDER_STATUSES;

// ─── STAFF ROLES ──────────────────────────────────────────────────────────────

export const STAFF_ROLES = {
  OWNER: { label: "Propietario", permissions: ["all"] },
  MANAGER: { label: "Gerente", permissions: ["orders", "menu", "tables", "analytics"] },
  WAITER: { label: "Mesero", permissions: ["orders", "tables"] },
  KITCHEN: { label: "Cocina", permissions: ["orders"] },
} as const;

export type StaffRole = keyof typeof STAFF_ROLES;

// ─── TABLE STATUSES ───────────────────────────────────────────────────────────

export type TableStatus = "FREE" | "ACTIVE" | "BILL_REQUESTED" | "DISABLED";

export const TABLE_STATUS_CONFIG = {
  FREE: { label: "Libre", color: "#10B981" },
  ACTIVE: { label: "Con pedido", color: "#F59E0B" },
  BILL_REQUESTED: { label: "Cuenta pedida", color: "#EF4444" },
  DISABLED: { label: "Deshabilitada", color: "#64748B" },
} as const;

// ─── DOMAIN TYPES ─────────────────────────────────────────────────────────────

export interface SessionPayload {
  userId: string;
  tenantId: string;
  role: StaffRole;
  plan: PlanKey;
  planId: string;
  expiresAt: Date;
}

export interface TenantContext {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  brandColor: string;
  plan: PlanKey;
  planId: string;
  planLimits: PlanLimits;
}

export interface CreateOrderDto {
  tenantId: string;
  type: OrderType;
  tableId?: string;
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  deliveryNotes?: string;
  notes?: string;
  items: {
    menuItemId: string;
    quantity: number;
    notes?: string;
  }[];
}

export interface TableSession {
  tableId: string;
  tableName: string;
  status: TableStatus;
  activeOrders: OrderWithItems[];
  totalAccumulated: number;
  sessionOpenedAt: Date | null;
}

export interface OrderWithItems {
  id: string;
  orderNumber: number;
  type: OrderType;
  status: OrderStatus;
  createdAt: Date;
  customerName: string | null;
  items: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    notes: string | null;
    subtotal: number;
  }[];
  total: number;
  notes: string | null;
}

export type FormState<T = Record<string, string[]>> =
  | {
      errors?: T;
      message?: string;
      success?: boolean;
    }
  | undefined;
