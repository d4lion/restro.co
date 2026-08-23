import { prisma } from "@/lib/prisma";

export const tableRepository = {
  async findByTenant(tenantId: string) {
    return prisma.table.findMany({
      where: { tenantId },
      orderBy: { sortOrder: "asc" },
    });
  },

  async findByQrToken(qrToken: string) {
    return prisma.table.findUnique({
      where: { qrToken },
      include: { tenant: true },
    });
  },

  async findById(tableId: string) {
    return prisma.table.findUnique({
      where: { id: tableId },
    });
  },

  async create(tenantId: string, data: { name: string; capacity?: number }) {
    const last = await prisma.table.findFirst({
      where: { tenantId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    return prisma.table.create({
      data: {
        tenantId,
        name: data.name,
        capacity: data.capacity ?? null,
        sortOrder: (last?.sortOrder ?? -1) + 1,
      },
    });
  },

  async update(tableId: string, data: Partial<{ name: string; capacity: number; isActive: boolean }>) {
    return prisma.table.update({
      where: { id: tableId },
      data,
    });
  },

  async delete(tableId: string) {
    return prisma.table.delete({ where: { id: tableId } });
  },

  async deleteMany(tableIds: string[], tenantId: string) {
    return prisma.table.deleteMany({
      where: {
        id: { in: tableIds },
        tenantId,
      },
    });
  },

  // Get all tables with their active order count for the dashboard grid
  async getTablesWithStatus(tenantId: string) {
    const tables = await prisma.table.findMany({
      where: { tenantId },
      orderBy: { sortOrder: "asc" },
      include: {
        orders: {
          where: { status: { in: ["PENDING", "PREPARING", "READY"] } },
          select: { id: true, total: true, createdAt: true, status: true },
        },
      },
    });

    return tables.map((table) => ({
      ...table,
      activeOrderCount: table.orders.length,
      totalAccumulated: table.orders.reduce((sum, o) => sum + o.total, 0),
      oldestOrderAt: table.orders[0]?.createdAt ?? null,
    }));
  },
};
