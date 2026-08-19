import { prisma } from "@/lib/prisma";

export const menuRepository = {
  async getPublicMenu(tenantId: string) {
    return prisma.menu.findFirst({
      where: { tenantId, isActive: true },
      include: {
        categories: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
          include: {
            items: {
              where: { isAvailable: true },
              orderBy: { sortOrder: "asc" },
            },
          },
        },
      },
    });
  },

  async getFullMenu(tenantId: string) {
    return prisma.menu.findFirst({
      where: { tenantId },
      include: {
        categories: {
          orderBy: { sortOrder: "asc" },
          include: {
            items: { orderBy: { sortOrder: "asc" } },
          },
        },
      },
    });
  },

  async createCategory(tenantId: string, menuId: string, data: {
    name: string;
    description?: string;
    emoji?: string;
  }) {
    const lastCategory = await prisma.category.findFirst({
      where: { menuId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    return prisma.category.create({
      data: {
        menuId,
        name: data.name,
        description: data.description ?? null,
        emoji: data.emoji ?? null,
        sortOrder: (lastCategory?.sortOrder ?? -1) + 1,
      },
    });
  },

  async createMenuItem(categoryId: string, data: {
    name: string;
    description?: string;
    price: number;
    imageUrl?: string;
  }) {
    const lastItem = await prisma.menuItem.findFirst({
      where: { categoryId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    return prisma.menuItem.create({
      data: {
        categoryId,
        name: data.name,
        description: data.description ?? null,
        price: data.price,
        imageUrl: data.imageUrl ?? null,
        sortOrder: (lastItem?.sortOrder ?? -1) + 1,
      },
    });
  },

  async updateMenuItem(itemId: string, data: Partial<{
    name: string;
    description: string;
    price: number;
    imageUrl: string;
    isAvailable: boolean;
    isHighlighted: boolean;
  }>) {
    return prisma.menuItem.update({
      where: { id: itemId },
      data,
    });
  },

  async toggleItemAvailability(itemId: string) {
    const item = await prisma.menuItem.findUnique({
      where: { id: itemId },
      select: { isAvailable: true },
    });
    return prisma.menuItem.update({
      where: { id: itemId },
      data: { isAvailable: !item?.isAvailable },
    });
  },

  async deleteMenuItem(itemId: string) {
    return prisma.menuItem.delete({ where: { id: itemId } });
  },

  async deleteCategory(categoryId: string) {
    return prisma.category.delete({ where: { id: categoryId } });
  },
};
