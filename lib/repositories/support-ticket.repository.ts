import { prisma } from "@/lib/prisma";

export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type TicketCategory = "TECHNICAL" | "BILLING" | "FEATURE_REQUEST" | "ONBOARDING" | "GENERAL";

export interface SupportTicketRecord {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  tenantId: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  authorName: string | null;
  notes: string | null;
  resolvedAt: Date | null;
  tenant?: {
    id: string;
    name: string;
    slug: string;
  };
}

export const supportTicketRepository = {
  async findByTenantId(tenantId: string): Promise<SupportTicketRecord[]> {
    return prisma.supportTicket.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      include: {
        tenant: {
          select: { id: true, name: true, slug: true },
        },
      },
    });
  },

  async findRecent(limit = 10): Promise<SupportTicketRecord[]> {
    return prisma.supportTicket.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        tenant: {
          select: { id: true, name: true, slug: true },
        },
      },
    });
  },

  async findOpenAndUrgent(limit = 10): Promise<SupportTicketRecord[]> {
    return prisma.supportTicket.findMany({
      where: {
        status: { in: ["OPEN", "IN_PROGRESS"] },
      },
      take: limit,
      orderBy: [
        { priority: "desc" },
        { createdAt: "desc" },
      ],
      include: {
        tenant: {
          select: { id: true, name: true, slug: true },
        },
      },
    });
  },

  async getStats(): Promise<{
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    urgent: number;
  }> {
    const [total, open, inProgress, resolved, urgent] = await Promise.all([
      prisma.supportTicket.count(),
      prisma.supportTicket.count({ where: { status: "OPEN" } }),
      prisma.supportTicket.count({ where: { status: "IN_PROGRESS" } }),
      prisma.supportTicket.count({ where: { status: "RESOLVED" } }),
      prisma.supportTicket.count({
        where: {
          priority: "URGENT",
          status: { in: ["OPEN", "IN_PROGRESS"] },
        },
      }),
    ]);

    return { total, open, inProgress, resolved, urgent };
  },

  async create(data: {
    tenantId: string;
    title: string;
    description: string;
    priority?: TicketPriority;
    category?: TicketCategory;
    authorName?: string;
    notes?: string;
  }): Promise<SupportTicketRecord> {
    return prisma.supportTicket.create({
      data: {
        tenantId: data.tenantId,
        title: data.title.trim(),
        description: data.description.trim(),
        priority: data.priority || "MEDIUM",
        category: data.category || "GENERAL",
        authorName: data.authorName?.trim() || null,
        notes: data.notes?.trim() || null,
        status: "OPEN",
      },
      include: {
        tenant: {
          select: { id: true, name: true, slug: true },
        },
      },
    });
  },

  async update(
    id: string,
    data: {
      status?: TicketStatus;
      priority?: TicketPriority;
      category?: TicketCategory;
      notes?: string;
      resolvedAt?: Date | null;
    }
  ): Promise<SupportTicketRecord> {
    const resolvedAt =
      data.status === "RESOLVED" || data.status === "CLOSED"
        ? new Date()
        : data.status === "OPEN" || data.status === "IN_PROGRESS"
        ? null
        : undefined;

    return prisma.supportTicket.update({
      where: { id },
      data: {
        ...data,
        ...(resolvedAt !== undefined ? { resolvedAt } : {}),
      },
      include: {
        tenant: {
          select: { id: true, name: true, slug: true },
        },
      },
    });
  },

  async delete(id: string): Promise<boolean> {
    await prisma.supportTicket.delete({ where: { id } });
    return true;
  },
};
