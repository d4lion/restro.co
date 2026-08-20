import { prisma } from "@/lib/prisma";

export interface RepoModifierGroup {
  name: string;
  isRequired: boolean;
  minSelections: number;
  maxSelections: number;
  options: {
    name: string;
    priceExtra: number;
    isAvailable?: boolean;
  }[];
}

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
              include: {
                modifierGroups: {
                  orderBy: { sortOrder: "asc" },
                  include: {
                    options: {
                      where: { isAvailable: true },
                      orderBy: { sortOrder: "asc" },
                    }
                  }
                }
              }
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
            items: { 
              orderBy: { sortOrder: "asc" },
              include: {
                modifierGroups: {
                  orderBy: { sortOrder: "asc" },
                  include: {
                    options: { orderBy: { sortOrder: "asc" } }
                  }
                }
              }
            },
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

  async updateCategory(categoryId: string, data: Partial<{
    name: string;
    description: string;
    emoji: string;
  }>) {
    return prisma.category.update({
      where: { id: categoryId },
      data,
    });
  },

  async createMenuItem(categoryId: string, data: {
    name: string;
    description?: string;
    price: number;
    imageUrl?: string;
    modifierGroups?: RepoModifierGroup[];
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
        modifierGroups: data.modifierGroups && data.modifierGroups.length > 0 ? {
          create: data.modifierGroups.map((g, gIdx) => ({
            name: g.name,
            isRequired: g.isRequired,
            minSelections: g.minSelections,
            maxSelections: g.maxSelections,
            sortOrder: gIdx,
            options: {
              create: g.options.map((o, oIdx: number) => ({
                name: o.name,
                priceExtra: o.priceExtra,
                isAvailable: o.isAvailable ?? true,
                sortOrder: oIdx
              }))
            }
          }))
        } : undefined
      },
    });
  },

  async updateMenuItem(itemId: string, data: Partial<{
    categoryId: string;
    name: string;
    description: string;
    price: number;
    imageUrl: string;
    isAvailable: boolean;
    isHighlighted: boolean;
    modifierGroups: RepoModifierGroup[];
  }>) {
    return prisma.$transaction(async (tx) => {
      // If modifierGroups are provided, delete existing and recreate
      if (data.modifierGroups !== undefined) {
        await tx.menuItemModifierGroup.deleteMany({
          where: { menuItemId: itemId }
        });
      }

      return tx.menuItem.update({
        where: { id: itemId },
        data: {
          categoryId: data.categoryId,
          name: data.name,
          description: data.description,
          price: data.price,
          imageUrl: data.imageUrl,
          isAvailable: data.isAvailable,
          isHighlighted: data.isHighlighted,
          ...(data.modifierGroups ? {
            modifierGroups: {
              create: data.modifierGroups.map((g, gIdx) => ({
                name: g.name,
                isRequired: g.isRequired,
                minSelections: g.minSelections,
                maxSelections: g.maxSelections,
                sortOrder: gIdx,
                options: {
                  create: g.options.map((o, oIdx: number) => ({
                    name: o.name,
                    priceExtra: o.priceExtra,
                    isAvailable: o.isAvailable ?? true,
                    sortOrder: oIdx
                  }))
                }
              }))
            }
          } : {})
        },
      });
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

  // --- MODIFIERS ---

  async createModifierGroup(menuItemId: string, data: {
    name: string;
    isRequired?: boolean;
    minSelections?: number;
    maxSelections?: number;
  }) {
    const lastGroup = await prisma.menuItemModifierGroup.findFirst({
      where: { menuItemId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    return prisma.menuItemModifierGroup.create({
      data: {
        menuItemId,
        name: data.name,
        isRequired: data.isRequired ?? false,
        minSelections: data.minSelections ?? 0,
        maxSelections: data.maxSelections ?? 1,
        sortOrder: (lastGroup?.sortOrder ?? -1) + 1,
      },
    });
  },

  async updateModifierGroup(groupId: string, data: Partial<{
    name: string;
    isRequired: boolean;
    minSelections: number;
    maxSelections: number;
    sortOrder: number;
  }>) {
    return prisma.menuItemModifierGroup.update({
      where: { id: groupId },
      data,
    });
  },

  async deleteModifierGroup(groupId: string) {
    return prisma.menuItemModifierGroup.delete({ where: { id: groupId } });
  },

  async createModifierOption(groupId: string, data: {
    name: string;
    priceExtra?: number;
    isAvailable?: boolean;
  }) {
    const lastOption = await prisma.menuItemModifierOption.findFirst({
      where: { groupId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    return prisma.menuItemModifierOption.create({
      data: {
        groupId,
        name: data.name,
        priceExtra: data.priceExtra ?? 0,
        isAvailable: data.isAvailable ?? true,
        sortOrder: (lastOption?.sortOrder ?? -1) + 1,
      },
    });
  },

  async updateModifierOption(optionId: string, data: Partial<{
    name: string;
    priceExtra: number;
    isAvailable: boolean;
    sortOrder: number;
  }>) {
    return prisma.menuItemModifierOption.update({
      where: { id: optionId },
      data,
    });
  },

  async deleteModifierOption(optionId: string) {
    return prisma.menuItemModifierOption.delete({ where: { id: optionId } });
  },
};
