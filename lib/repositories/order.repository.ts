import { prisma } from "@/lib/prisma";
import type { CreateOrderDto, OrderWithItems, TableSession, OrderStatus, TableStatus } from "@/lib/types";
import { ORDER_STATUSES } from "@/lib/types";

export interface OrderRepository {
  create(data: CreateOrderDto): Promise<{ id: string; orderNumber: number }>;
  findByTenant(tenantId: string, limit?: number): Promise<OrderWithItems[]>;
  findByTable(tableId: string): Promise<OrderWithItems[]>;
  findActiveByTenant(tenantId: string): Promise<OrderWithItems[]>;
  findById(orderId: string): Promise<OrderWithItems | null>;
  updateStatus(orderId: string, status: OrderStatus, changedById?: string, cancellationReason?: string): Promise<void>;
  batchUpdateStatus(items: Array<{ orderId: string; status: OrderStatus }>, changedById?: string): Promise<void>;
  getTableSession(tableId: string): Promise<TableSession>;
  togglePriority(orderId: string, isPriority?: boolean): Promise<any>;
  reportIncident(orderId: string, incidentNote: string): Promise<any>;
  updateItemStatus(itemId: string, status: string): Promise<any>;
}

async function getNextOrderNumber(tenantId: string): Promise<number> {
  const last = await prisma.order.findFirst({
    where: { tenantId },
    orderBy: { orderNumber: "desc" },
    select: { orderNumber: true },
  });
  return (last?.orderNumber ?? 0) + 1;
}

function getTenantTimeComponents(date: Date, timeZone = "America/Bogota") {
  const dateStr = date.toLocaleString("en-US", { timeZone });
  const localDate = new Date(dateStr);
  return {
    hourOfDay: localDate.getHours(),
    dayOfWeek: localDate.getDay(),
  };
}

function mapOrderToDto(order: any): OrderWithItems {
  const nowMs = Date.now();
  const createdAtMs = new Date(order.createdAt).getTime();
  const preparingAtMs = order.preparingAt ? new Date(order.preparingAt).getTime() : createdAtMs;
  const targetMinutes = order.targetPrepTimeMinutes || 12;
  const targetSec = targetMinutes * 60;

  let elapsedSec = 0;
  if (order.status === "READY" || order.status === "DELIVERED") {
    if (typeof order.actualPrepTimeSeconds === "number" && order.actualPrepTimeSeconds > 0) {
      elapsedSec = order.actualPrepTimeSeconds;
    } else if (order.readyAt) {
      elapsedSec = Math.max(0, Math.floor((new Date(order.readyAt).getTime() - preparingAtMs) / 1000));
    } else {
      elapsedSec = Math.max(0, Math.floor((nowMs - createdAtMs) / 1000));
    }
  } else {
    // PENDING or PREPARING
    elapsedSec = Math.max(0, Math.floor((nowMs - createdAtMs) / 1000));
  }

  const isBreached = Boolean(order.wasSlaBreached) || elapsedSec > targetSec;

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    type: order.type,
    status: order.status,
    createdAt: order.createdAt,
    customerName: order.customerName,
    customerPhone: order.customerPhone ?? null,
    deliveryAddress: order.deliveryAddress ?? null,
    deliveryNotes: order.deliveryNotes ?? null,
    tableId: order.tableId ?? null,
    tableName: order.table?.name ?? null,
    isPriority: order.isPriority ?? false,
    targetPrepTimeMinutes: targetMinutes,
    incidentNote: order.incidentNote ?? null,

    // Lifecycle Milestones & Telemetry
    preparingAt: order.preparingAt ?? null,
    readyAt: order.readyAt ?? null,
    deliveredAt: order.deliveredAt ?? null,
    cancelledAt: order.cancelledAt ?? null,
    actualPrepTimeSeconds: order.actualPrepTimeSeconds ?? null,
    actualTotalTimeSeconds: order.actualTotalTimeSeconds ?? null,
    wasSlaBreached: isBreached,
    cancellationReason: order.cancellationReason ?? null,

    items: order.items.map((item: any) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      notes: item.notes,
      status: item.status ?? "PENDING",
      station: item.station ?? null,
      preparingAt: item.preparingAt ?? null,
      readyAt: item.readyAt ?? null,
      prepTimeSeconds: item.prepTimeSeconds ?? null,
      modifiersJson: item.modifiersJson,
      subtotal: item.subtotal,
    })),
    statusHistory: order.statusHistory?.map((h: any) => ({
      id: h.id,
      fromStatus: h.fromStatus ?? null,
      toStatus: h.toStatus,
      createdAt: h.createdAt,
      changedById: h.changedById ?? null,
      note: h.note ?? null,
    })) || [],
    total: order.total,
    notes: order.notes,
  };
}

const orderInclude = {
  items: true,
  table: {
    select: { name: true },
  },
  statusHistory: {
    orderBy: { createdAt: "asc" as const },
  },
};

const orderIncludeWithHistory = {
  items: true,
  table: {
    select: { name: true },
  },
  statusHistory: {
    orderBy: { createdAt: "asc" as const },
  },
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
      const extraPrice = item.modifiers?.reduce((sum, mod) => sum + mod.priceExtra, 0) || 0;
      const unitPrice = menuItem.price + extraPrice;
      const itemSubtotal = unitPrice * item.quantity;
      subtotal += itemSubtotal;
      return {
        menuItemId: item.menuItemId,
        name: menuItem.name,
        price: menuItem.price, // Storing base price here
        quantity: item.quantity,
        notes: item.notes ?? null,
        modifiersJson: item.modifiers ? JSON.stringify(item.modifiers) : null,
        subtotal: itemSubtotal,
      };
    });

    // Strict & Secure Table Validation (Matches ONLY unguessable id or qrToken CUIDs to prevent enumeration attacks like ?table=1, ?table=2)
    let validatedTableId: string | null = null;
    let customerName = data.customerName ?? null;

    if (data.tableId) {
      const cleanParam = data.tableId.trim();

      const tableRecord = await prisma.table.findFirst({
        where: {
          tenantId: data.tenantId,
          OR: [
            { id: cleanParam },
            { qrToken: cleanParam },
          ],
        },
        select: { id: true, name: true },
      });

      if (tableRecord) {
        validatedTableId = tableRecord.id;
        if (!customerName || customerName === "Cliente Local") {
          customerName = tableRecord.name;
        } else if (!customerName.includes(tableRecord.name)) {
          customerName = `${tableRecord.name} — ${customerName}`;
        }
      }
    }

    // Verify tenant requireTableQrForDineIn policy
    if (data.type === "DINE_IN" && !validatedTableId) {
      const tenantSetting = await prisma.tenant.findUnique({
        where: { id: data.tenantId },
        select: { requireTableQrForDineIn: true },
      });

      if (tenantSetting?.requireTableQrForDineIn) {
        throw new Error("Por seguridad, debes escanear el código QR único de tu mesa para realizar pedidos en el local.");
      }
    }

    // Calculate Kitchen Load & Telemetry Snapshot
    const now = new Date();
    const { hourOfDay, dayOfWeek } = getTenantTimeComponents(now);

    const [activeOrdersCount, preparingOrdersCount] = await Promise.all([
      prisma.order.count({
        where: { tenantId: data.tenantId, status: { in: ["PENDING", "PREPARING"] } },
      }),
      prisma.order.count({
        where: { tenantId: data.tenantId, status: "PREPARING" },
      }),
    ]);

    const totalItemQuantity = data.items.reduce((sum, i) => sum + i.quantity, 0);
    const uniqueItemCount = data.items.length;
    const hasModifiers = data.items.some((i) => i.modifiers && i.modifiers.length > 0);

    const order = await prisma.order.create({
      data: {
        tenantId: data.tenantId,
        type: data.type,
        tableId: validatedTableId,
        customerName: customerName,
        customerPhone: data.customerPhone ?? null,
        deliveryAddress: data.deliveryAddress ?? null,
        deliveryNotes: data.deliveryNotes ?? null,
        notes: data.notes ?? null,
        orderNumber,
        subtotal,
        total: subtotal,
        status: "PENDING",
        items: { create: orderItems },
        statusHistory: {
          create: { toStatus: "PENDING" },
        },
        telemetry: {
          create: {
            tenantId: data.tenantId,
            hourOfDay,
            dayOfWeek,
            activeOrdersCountAtCreation: activeOrdersCount,
            preparingOrdersCountAtCreation: preparingOrdersCount,
            totalItemQuantity,
            uniqueItemCount,
            hasModifiers,
            channelSource: data.type,
          },
        },
      },
      select: { id: true, orderNumber: true },
    });

    // Mark table as active/occupied in DB for POS/Meseros/KDS
    if (validatedTableId) {
      await prisma.table.update({
        where: { id: validatedTableId },
        data: { isActive: true },
      });
    }

    return order;
  },

  async findByTenant(tenantId, limit = 100) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const orders = await prisma.order.findMany({
      where: {
        tenantId,
        OR: [
          // All active orders in kitchen flow
          { status: { in: ["PENDING", "PREPARING", "READY"] } },
          // Delivered or cancelled orders from TODAY only
          {
            status: { in: ["DELIVERED", "CANCELLED"] },
            createdAt: { gte: startOfToday },
          },
        ],
      },
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
      include: orderIncludeWithHistory,
    });
    if (!order) return null;
    return mapOrderToDto(order);
  },

  async updateStatus(orderId, status, changedById, cancellationReason) {
    const current = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        tenantId: true,
        type: true,
        status: true,
        createdAt: true,
        preparingAt: true,
        targetPrepTimeMinutes: true,
        items: { select: { quantity: true, modifiersJson: true } },
        telemetry: { select: { id: true } },
      },
    });

    const now = new Date();
    const updateData: Record<string, any> = { status };

    const createdMs = current?.createdAt ? new Date(current.createdAt).getTime() : now.getTime();
    const prepStart = current?.preparingAt || current?.createdAt || now;
    const elapsedSecFromPrep = Math.max(0, Math.floor((now.getTime() - prepStart.getTime()) / 1000));
    const elapsedSecFromCreated = Math.max(0, Math.floor((now.getTime() - createdMs) / 1000));
    const maxElapsedSec = Math.max(elapsedSecFromPrep, elapsedSecFromCreated);
    const targetSec = (current?.targetPrepTimeMinutes || 12) * 60;

    if (status === "PREPARING" && !current?.preparingAt) {
      updateData.preparingAt = now;
    } else if (status === "READY") {
      updateData.readyAt = now;
      updateData.actualPrepTimeSeconds = elapsedSecFromCreated;
    } else if (status === "DELIVERED") {
      updateData.deliveredAt = now;
      if (current?.createdAt) {
        updateData.actualTotalTimeSeconds = Math.max(0, Math.floor((now.getTime() - createdMs) / 1000));
      }
    } else if (status === "CANCELLED") {
      updateData.cancelledAt = now;
      if (cancellationReason) {
        updateData.cancellationReason = cancellationReason;
      }
    }

    // Flag SLA breach if target prep time was exceeded
    if (maxElapsedSec > targetSec || (typeof updateData.actualPrepTimeSeconds === "number" && updateData.actualPrepTimeSeconds > targetSec)) {
      updateData.wasSlaBreached = true;
    }

    // Auto-backfill telemetry record if order was created before telemetry model existed
    if (current && !current.telemetry) {
      const orderDate = current.createdAt || now;
      const { hourOfDay, dayOfWeek } = getTenantTimeComponents(orderDate);
      const totalItemQuantity = current.items?.reduce((sum, i) => sum + i.quantity, 0) || 1;
      const uniqueItemCount = current.items?.length || 1;
      const hasModifiers = current.items?.some((i) => !!i.modifiersJson && i.modifiersJson !== "[]") || false;

      updateData.telemetry = {
        create: {
          tenantId: current.tenantId,
          hourOfDay,
          dayOfWeek,
          activeOrdersCountAtCreation: 0,
          preparingOrdersCountAtCreation: 0,
          totalItemQuantity,
          uniqueItemCount,
          hasModifiers,
          channelSource: current.type || "DINE_IN",
        },
      };
    }

    await prisma.$transaction([
      prisma.order.update({
        where: { id: orderId },
        data: updateData,
      }),
      prisma.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: current?.status ?? null,
          toStatus: status,
          changedById: changedById ?? null,
          note: cancellationReason ?? null,
        },
      }),
    ]);
  },

  async batchUpdateStatus(items, changedById) {
    if (!items || items.length === 0) return;

    const orderIds = items.map((i) => i.orderId);
    const currentOrders = await prisma.order.findMany({
      where: { id: { in: orderIds } },
      select: {
        id: true,
        tenantId: true,
        type: true,
        status: true,
        createdAt: true,
        preparingAt: true,
        targetPrepTimeMinutes: true,
        items: { select: { quantity: true, modifiersJson: true } },
        telemetry: { select: { id: true } },
      },
    });

    const currentMap = new Map(currentOrders.map((o) => [o.id, o]));
    const now = new Date();
    const dbOperations: any[] = [];

    for (const item of items) {
      const current = currentMap.get(item.orderId);
      if (!current) continue;

      const updateData: Record<string, any> = { status: item.status };
      const createdMs = current.createdAt ? new Date(current.createdAt).getTime() : now.getTime();
      const prepStart = current.preparingAt || current.createdAt || now;
      const elapsedSecFromPrep = Math.max(0, Math.floor((now.getTime() - prepStart.getTime()) / 1000));
      const elapsedSecFromCreated = Math.max(0, Math.floor((now.getTime() - createdMs) / 1000));
      const maxElapsedSec = Math.max(elapsedSecFromPrep, elapsedSecFromCreated);
      const targetSec = (current.targetPrepTimeMinutes || 12) * 60;

      if (item.status === "PREPARING" && !current.preparingAt) {
        updateData.preparingAt = now;
      } else if (item.status === "READY") {
        updateData.readyAt = now;
        updateData.actualPrepTimeSeconds = elapsedSecFromCreated;
      } else if (item.status === "DELIVERED") {
        updateData.deliveredAt = now;
        if (current.createdAt) {
          updateData.actualTotalTimeSeconds = Math.max(0, Math.floor((now.getTime() - createdMs) / 1000));
        }
      } else if (item.status === "CANCELLED") {
        updateData.cancelledAt = now;
      }

      if (maxElapsedSec > targetSec || (typeof updateData.actualPrepTimeSeconds === "number" && updateData.actualPrepTimeSeconds > targetSec)) {
        updateData.wasSlaBreached = true;
      }

      if (!current.telemetry) {
        const orderDate = current.createdAt || now;
        const { hourOfDay, dayOfWeek } = getTenantTimeComponents(orderDate);
        const totalItemQuantity = current.items?.reduce((sum, i) => sum + i.quantity, 0) || 1;
        const uniqueItemCount = current.items?.length || 1;
        const hasModifiers = current.items?.some((i) => !!i.modifiersJson && i.modifiersJson !== "[]") || false;

        updateData.telemetry = {
          create: {
            tenantId: current.tenantId,
            hourOfDay,
            dayOfWeek,
            activeOrdersCountAtCreation: 0,
            preparingOrdersCountAtCreation: 0,
            totalItemQuantity,
            uniqueItemCount,
            hasModifiers,
            channelSource: current.type || "DINE_IN",
          },
        };
      }

      dbOperations.push(
        prisma.order.update({
          where: { id: item.orderId },
          data: updateData,
        })
      );

      dbOperations.push(
        prisma.orderStatusHistory.create({
          data: {
            orderId: item.orderId,
            fromStatus: current.status ?? null,
            toStatus: item.status,
            changedById: changedById ?? null,
          },
        })
      );
    }

    if (dbOperations.length > 0) {
      await prisma.$transaction(dbOperations);
    }
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

  async togglePriority(orderId: string, isPriority?: boolean) {
    const current = await prisma.order.findUnique({
      where: { id: orderId },
      select: { isPriority: true },
    });
    const nextPriority = typeof isPriority === "boolean" ? isPriority : !current?.isPriority;

    return prisma.order.update({
      where: { id: orderId },
      data: { isPriority: nextPriority },
    });
  },

  async reportIncident(orderId: string, incidentNote: string) {
    return prisma.$transaction([
      prisma.order.update({
        where: { id: orderId },
        data: { incidentNote },
      }),
      prisma.orderStatusHistory.create({
        data: {
          orderId,
          toStatus: "INCIDENT",
          note: incidentNote,
        },
      }),
    ]);
  },

  async updateItemStatus(itemId: string, status: string) {
    const item = await prisma.orderItem.findUnique({
      where: { id: itemId },
      select: { status: true, createdAt: true, preparingAt: true },
    });

    const now = new Date();
    const updateData: Record<string, any> = { status };

    if (status === "PREPARING" && !item?.preparingAt) {
      updateData.preparingAt = now;
    } else if (status === "READY") {
      updateData.readyAt = now;
      const start = item?.preparingAt || item?.createdAt || now;
      updateData.prepTimeSeconds = Math.max(0, Math.floor((now.getTime() - start.getTime()) / 1000));
    }

    return prisma.orderItem.update({
      where: { id: itemId },
      data: updateData,
    });
  },
};
