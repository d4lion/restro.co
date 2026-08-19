import { prisma } from "@/lib/prisma";
import type { CreateOrderDto, OrderWithItems, TableSession, OrderStatus, TableStatus } from "@/lib/types";
import { ORDER_STATUSES } from "@/lib/types";

export interface OrderRepository {
  create(data: CreateOrderDto): Promise<{ id: string; orderNumber: number }>;
  findByTenant(tenantId: string, limit?: number): Promise<OrderWithItems[]>;
  findByTable(tableId: string): Promise<OrderWithItems[]>;
  findActiveByTenant(tenantId: string): Promise<OrderWithItems[]>;
  findById(orderId: string): Promise<OrderWithItems | null>;
  updateStatus(orderId: string, status: OrderStatus, changedById?: string): Promise<void>;
  getTableSession(tableId: string): Promise<TableSession>;
}

async function getNextOrderNumber(tenantId: string): Promise<number> {
  const last = await prisma.order.findFirst({
    where: { tenantId },
    orderBy: { orderNumber: "desc" },
    select: { orderNumber: true },
  });
  return (last?.orderNumber ?? 0) + 1;
}

function mapOrderToDto(order: any): OrderWithItems {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    type: order.type,
    status: order.status,
    createdAt: order.createdAt,
    customerName: order.customerName,
    items: order.items.map((item: any) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      notes: item.notes,
      subtotal: item.subtotal,
    })),
    total: order.total,
    notes: order.notes,
  };
}

const orderInclude = {
  items: {
    include: { menuItem: { select: { name: true } } },
  },
  table: { select: { name: true } },
};

export const orderRepository: OrderRepository = {
  async create(data) {
    const orderNumber = await getNextOrderNumber(data.tenantId);

    // Fetch menu items for price snapshot
    const menuItemIds = data.items.map((i) => i.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds } },
      select: { id: true, name: true, price: true },
    });
    const menuItemMap = new Map(menuItems.map((m) => [m.id, m]));

    let subtotal = 0;
    const orderItems = data.items.map((item) => {
      const menuItem = menuItemMap.get(item.menuItemId);
      if (!menuItem) throw new Error(`MenuItem ${item.menuItemId} not found`);
      const itemSubtotal = menuItem.price * item.quantity;
      subtotal += itemSubtotal;
      return {
        menuItemId: item.menuItemId,
        name: menuItem.name,
        price: menuItem.price,
        quantity: item.quantity,
        notes: item.notes ?? null,
        subtotal: itemSubtotal,
      };
    });

    const order = await prisma.order.create({
      data: {
        tenantId: data.tenantId,
        type: data.type,
        tableId: data.tableId ?? null,
        customerName: data.customerName ?? null,
        customerPhone: data.customerPhone ?? null,
        deliveryAddress: data.deliveryAddress ?? null,
        deliveryNotes: data.deliveryNotes ?? null,
        notes: data.notes ?? null,
        orderNumber,
        subtotal,
        total: subtotal, // Add taxes/discounts logic here later
        status: "PENDING",
        items: { create: orderItems },
        statusHistory: {
          create: { toStatus: "PENDING" },
        },
      },
      select: { id: true, orderNumber: true },
    });

    return order;
  },

  async findByTenant(tenantId, limit = 100) {
    const orders = await prisma.order.findMany({
      where: { tenantId },
      include: orderInclude,
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return orders.map(mapOrderToDto);
  },

  async findActiveByTenant(tenantId) {
    const orders = await prisma.order.findMany({
      where: {
        tenantId,
        status: { in: ["PENDING", "PREPARING", "READY"] },
      },
      include: orderInclude,
      orderBy: { createdAt: "asc" },
    });
    return orders.map(mapOrderToDto);
  },

  async findByTable(tableId) {
    const orders = await prisma.order.findMany({
      where: {
        tableId,
        status: { in: ["PENDING", "PREPARING", "READY"] },
      },
      include: orderInclude,
      orderBy: { createdAt: "asc" },
    });
    return orders.map(mapOrderToDto);
  },

  async findById(orderId) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: orderInclude,
    });
    if (!order) return null;
    return mapOrderToDto(order);
  },

  async updateStatus(orderId, status, changedById) {
    const current = await prisma.order.findUnique({
      where: { id: orderId },
      select: { status: true },
    });

    await prisma.$transaction([
      prisma.order.update({
        where: { id: orderId },
        data: { status },
      }),
      prisma.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: current?.status ?? null,
          toStatus: status,
          changedById: changedById ?? null,
        },
      }),
    ]);
  },

  async getTableSession(tableId) {
    const table = await prisma.table.findUnique({
      where: { id: tableId },
      select: { id: true, name: true, isActive: true },
    });
    if (!table) throw new Error(`Table ${tableId} not found`);

    const activeOrders = await prisma.order.findMany({
      where: {
        tableId,
        status: { in: ["PENDING", "PREPARING", "READY"] },
      },
      include: orderInclude,
      orderBy: { createdAt: "asc" },
    });

    const mappedOrders = activeOrders.map(mapOrderToDto);
    const totalAccumulated = mappedOrders.reduce((sum, o) => sum + o.total, 0);

    let tableStatus: TableStatus = "FREE";
    if (!table.isActive) {
      tableStatus = "DISABLED";
    } else if (activeOrders.length > 0) {
      tableStatus = "ACTIVE";
    }

    return {
      tableId: table.id,
      tableName: table.name,
      status: tableStatus,
      activeOrders: mappedOrders,
      totalAccumulated,
      sessionOpenedAt: activeOrders[0]?.createdAt ?? null,
    };
  },
};
