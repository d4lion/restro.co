import { prisma } from "@/lib/prisma";
import { Pool } from "pg";
import { createHash, randomUUID } from "crypto";
import type { StaffRole, PlanKey } from "@/lib/types";

let connectionString = process.env.DATABASE_URL || "";
if (connectionString.includes("?pgbouncer=true")) {
  connectionString = connectionString.replace("?pgbouncer=true", "");
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export interface PlatformGlobalMetrics {
  totalTenants: number;
  activeTenants: number;
  suspendedTenants: number;
  totalUsers: number;
  usersByRole: Record<string, number>;
  totalOrders: number;
  ordersToday: number;
  ordersThisMonth: number;
  totalGmvCop: number;
  averageTicketCop: number;
  totalMenuItems: number;
  totalTables: number;
  totalSubscriptions: number;
  mrrTotalCop: number;
  planDistribution: Record<PlanKey, number>;
}

export interface UserAccountSummary {
  id: string;
  email: string;
  name: string;
  role: StaffRole;
  createdAt: Date;
  lastLoginAt: Date | null;
  tenant: {
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
    planKey: PlanKey;
    planLabel: string;
  };
}

export const platformAdminRepository = {
  /**
   * Fetch aggregate platform metrics across all restaurants, orders, users, and menus.
   */
  async getGlobalMetrics(): Promise<PlatformGlobalMetrics> {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      tenants,
      users,
      orders,
      menuItemsCount,
      tablesCount,
      subscriptions,
    ] = await Promise.all([
      prisma.tenant.findMany({
        select: { id: true, isActive: true },
      }),
      prisma.user.findMany({
        select: { id: true, role: true },
      }),
      prisma.order.findMany({
        where: { status: { not: "CANCELLED" } },
        select: { total: true, createdAt: true },
      }),
      prisma.menuItem.count(),
      prisma.table.count(),
      prisma.subscription.findMany({
        include: { plan: true },
      }),
    ]);

    // Tenants count
    const totalTenants = tenants.length;
    const activeTenants = tenants.filter((t) => t.isActive).length;
    const suspendedTenants = totalTenants - activeTenants;

    // Users by role
    const usersByRole: Record<string, number> = {};
    users.forEach((u) => {
      usersByRole[u.role] = (usersByRole[u.role] || 0) + 1;
    });

    // Orders & GMV calculation
    const totalOrders = orders.length;
    let totalGmvCop = 0;
    let ordersToday = 0;
    let ordersThisMonth = 0;

    orders.forEach((o) => {
      totalGmvCop += o.total;
      const orderDate = new Date(o.createdAt);
      if (orderDate >= startOfToday) ordersToday++;
      if (orderDate >= startOfMonth) ordersThisMonth++;
    });

    const averageTicketCop = totalOrders > 0 ? Math.round(totalGmvCop / totalOrders) : 0;

    // MRR & Plan distribution
    let mrrTotalCop = 0;
    const planDistribution: Record<PlanKey, number> = {
      STARTER: 0,
      CARTA_DIGITAL: 0,
      RESTRO_IA: 0,
      BUSINESS: 0,
    };

    subscriptions.forEach((s) => {
      const planKey = (s.plan.key || "STARTER") as PlanKey;
      if (planKey in planDistribution) {
        planDistribution[planKey]++;
      }
      if (s.status === "ACTIVE" || s.status === "TRIAL") {
        mrrTotalCop += s.plan.priceMonthly;
      }
    });

    return {
      totalTenants,
      activeTenants,
      suspendedTenants,
      totalUsers: users.length,
      usersByRole,
      totalOrders,
      ordersToday,
      ordersThisMonth,
      totalGmvCop,
      averageTicketCop,
      totalMenuItems: menuItemsCount,
      totalTables: tablesCount,
      totalSubscriptions: subscriptions.length,
      mrrTotalCop,
      planDistribution,
    };
  },

  /**
   * List all user accounts with their associated tenant, plan, and role.
   */
  async getAllAccounts(): Promise<UserAccountSummary[]> {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        tenant: {
          include: {
            subscription: {
              include: { plan: true },
            },
          },
        },
      },
    });

    return users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role as StaffRole,
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt,
      tenant: {
        id: u.tenant.id,
        name: u.tenant.name,
        slug: u.tenant.slug,
        isActive: u.tenant.isActive,
        planKey: (u.tenant.subscription?.plan.key || "STARTER") as PlanKey,
        planLabel: u.tenant.subscription?.plan.label || "Starter",
      },
    }));
  },

  /**
   * Update a user's role (OWNER, MANAGER, WAITER, KITCHEN, SUPERADMIN).
   */
  async updateUserRole(params: {
    userId: string;
    newRole: StaffRole;
    actor?: string;
  }) {
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      include: { tenant: { include: { subscription: true } } },
    });
    if (!user) throw new Error("Usuario no encontrado");

    const previousRole = user.role;
    const updated = await prisma.user.update({
      where: { id: params.userId },
      data: { role: params.newRole },
    });

    // Record audit event on the tenant's subscription
    if (user.tenant?.subscription?.id) {
      await prisma.billingEvent.create({
        data: {
          subscriptionId: user.tenant.subscription.id,
          type: "USER_ROLE_CHANGED",
          note: `Rol de ${user.email} cambiado de ${previousRole} a ${params.newRole}`,
          metadata: JSON.stringify({
            action: "USER_ROLE_CHANGED",
            userId: user.id,
            userEmail: user.email,
            previousRole,
            newRole: params.newRole,
            actor: params.actor || "superadmin",
          }),
        },
      });
    }

    return updated;
  },

  /**
   * Update a user's details (name, email).
   */
  async updateUserDetails(params: {
    userId: string;
    name: string;
    email: string;
    actor?: string;
  }) {
    const normalizedEmail = params.email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      include: { tenant: { include: { subscription: true } } },
    });
    if (!user) throw new Error("Usuario no encontrado");

    const previousEmail = user.email;
    const previousName = user.name;

    // Check if new email is taken by someone else
    if (normalizedEmail !== user.email) {
      const emailConflict = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });
      if (emailConflict) throw new Error("El correo ya está en uso por otra cuenta");

      // Update in Supabase Auth
      try {
        await pool.query(
          `UPDATE auth.users
           SET email = $1, raw_user_meta_data = raw_user_meta_data || $2::jsonb, updated_at = NOW()
           WHERE id = $3::uuid`,
          [normalizedEmail, JSON.stringify({ name: params.name.trim() }), params.userId]
        );
      } catch (err) {
        console.error("Could not update email in auth.users:", err);
      }
    }

    const updated = await prisma.user.update({
      where: { id: params.userId },
      data: {
        name: params.name.trim(),
        email: normalizedEmail,
      },
    });

    if (user.tenant?.subscription?.id) {
      await prisma.billingEvent.create({
        data: {
          subscriptionId: user.tenant.subscription.id,
          type: "USER_DETAILS_UPDATED",
          note: `Datos de usuario actualizados: ${params.name} (${normalizedEmail})`,
          metadata: JSON.stringify({
            action: "USER_DETAILS_UPDATED",
            userId: user.id,
            previous: { name: previousName, email: previousEmail },
            new: { name: params.name, email: normalizedEmail },
            actor: params.actor || "superadmin",
          }),
        },
      });
    }

    return updated;
  },

  /**
   * Change/Reset a user's password directly from the admin panel.
   */
  async changeUserPassword(params: {
    userId: string;
    newPassword: string;
    actor?: string;
  }) {
    if (params.newPassword.length < 6) {
      throw new Error("La contraseña debe tener al menos 6 caracteres");
    }

    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      include: { tenant: { include: { subscription: true } } },
    });
    if (!user) throw new Error("Usuario no encontrado");

    const passwordHash = hashPassword(params.newPassword);

    // 1. Update in Supabase Auth (auth.users)
    try {
      await pool.query(
        `UPDATE auth.users
         SET encrypted_password = extensions.crypt($1, extensions.gen_salt('bf')),
             updated_at = NOW()
         WHERE id = $2::uuid OR email = $3`,
        [params.newPassword, params.userId, user.email]
      );
    } catch (authErr) {
      console.error("Failed to update password in auth.users:", authErr);
    }

    // 2. Update hash in Prisma User
    await prisma.user.update({
      where: { id: params.userId },
      data: { passwordHash },
    });

    // 3. Log audit event
    if (user.tenant?.subscription?.id) {
      await prisma.billingEvent.create({
        data: {
          subscriptionId: user.tenant.subscription.id,
          type: "USER_PASSWORD_RESET",
          note: `Contraseña restablecida administrativamente para ${user.email}`,
          metadata: JSON.stringify({
            action: "USER_PASSWORD_RESET",
            userId: user.id,
            userEmail: user.email,
            actor: params.actor || "superadmin",
          }),
        },
      });
    }

    return { success: true };
  },

  /**
   * Create a new user account directly attached to any tenant.
   */
  async createAccountForTenant(params: {
    tenantId: string;
    email: string;
    password: string;
    name: string;
    role: StaffRole;
    actor?: string;
  }) {
    const normalizedEmail = params.email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) throw new Error("Ya existe una cuenta con este correo");

    const tenant = await prisma.tenant.findUnique({
      where: { id: params.tenantId },
      include: { subscription: true },
    });
    if (!tenant) throw new Error("Restaurante no encontrado");

    const userId = randomUUID();
    const identityId = randomUUID();
    const passwordHash = hashPassword(params.password);
    const rawMeta = JSON.stringify({ sub: userId, email: normalizedEmail, name: params.name, email_verified: true });

    // 1. Create in Supabase Auth
    try {
      await pool.query(
        `INSERT INTO auth.users (
          instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
          confirmation_token, recovery_token, email_change_token_new, email_change,
          phone_change, phone_change_token, email_change_token_current, email_change_confirm_status,
          reauthentication_token, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous,
          created_at, updated_at
        ) VALUES (
          '00000000-0000-0000-0000-000000000000',
          $1::uuid,
          'authenticated',
          'authenticated',
          $2,
          extensions.crypt($3, extensions.gen_salt('bf')),
          NOW(),
          '', '', '', '',
          '', '', '', 0,
          '',
          '{"provider":"email","providers":["email"]}'::jsonb,
          $4::jsonb,
          false,
          false,
          NOW(),
          NOW()
        )`,
        [userId, normalizedEmail, params.password, rawMeta]
      );

      await pool.query(
        `INSERT INTO auth.identities (
          id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
        ) VALUES (
          $1::uuid,
          $2::uuid,
          $3,
          $4::jsonb,
          'email',
          NOW(),
          NOW(),
          NOW()
        )`,
        [identityId, userId, userId, rawMeta]
      );
    } catch (err) {
      console.error("Supabase auth insert error:", err);
    }

    // 2. Create in Prisma User
    const newUser = await prisma.user.create({
      data: {
        id: userId,
        email: normalizedEmail,
        name: params.name.trim(),
        passwordHash,
        tenantId: params.tenantId,
        role: params.role,
      },
    });

    // 3. Log audit event
    if (tenant.subscription?.id) {
      await prisma.billingEvent.create({
        data: {
          subscriptionId: tenant.subscription.id,
          type: "USER_ACCOUNT_CREATED",
          note: `Nueva cuenta creada: ${params.name} (${normalizedEmail}) con rol ${params.role}`,
          metadata: JSON.stringify({
            action: "USER_ACCOUNT_CREATED",
            userId: newUser.id,
            userEmail: normalizedEmail,
            role: params.role,
            tenantId: params.tenantId,
            actor: params.actor || "superadmin",
          }),
        },
      });
    }

    return newUser;
  },

  /**
   * Delete a user account safely.
   */
  async deleteUser(params: { userId: string; actor?: string }) {
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      include: { tenant: { include: { subscription: true } } },
    });
    if (!user) throw new Error("Usuario no encontrado");

    // Don't allow deleting the only owner if there's no other user
    const usersInTenant = await prisma.user.count({
      where: { tenantId: user.tenantId },
    });
    if (usersInTenant <= 1) {
      throw new Error("No se puede eliminar la única cuenta del restaurante. El restaurante quedaría sin acceso.");
    }

    // Delete in Supabase Auth
    try {
      await pool.query(`DELETE FROM auth.users WHERE id = $1::uuid OR email = $2`, [
        params.userId,
        user.email,
      ]);
    } catch (err) {
      console.error("Failed to delete auth user:", err);
    }

    // Delete in Prisma
    const deleted = await prisma.user.delete({
      where: { id: params.userId },
    });

    if (user.tenant?.subscription?.id) {
      await prisma.billingEvent.create({
        data: {
          subscriptionId: user.tenant.subscription.id,
          type: "USER_DELETED",
          note: `Cuenta eliminada: ${user.name} (${user.email})`,
          metadata: JSON.stringify({
            action: "USER_DELETED",
            userEmail: user.email,
            userName: user.name,
            role: user.role,
            actor: params.actor || "superadmin",
          }),
        },
      });
    }

    return deleted;
  },
};
