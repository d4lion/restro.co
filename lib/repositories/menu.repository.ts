import { prisma } from "@/lib/prisma";

export interface RepoModifierGroup {
  id?: string;
  name: string;
  previousName?: string;
  isRequired: boolean;
  minSelections: number;
  maxSelections: number;
  saveAsReusable?: boolean;
  options: {
    name: string;
    priceExtra: number;
    isAvailable?: boolean;
  }[];
}

export const menuRepository = {
  async getPublicMenu(tenantId: string) {
    const menu = await prisma.menu.findFirst({
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

    if (!menu) return null;
    const reusableModifierGroups = await this.getReusableModifierGroups(menu.id);
    if (reusableModifierGroups.length === 0) return menu;

    const reusableByName = new Map(
      reusableModifierGroups.map((rg) => [rg.name.trim().toLowerCase(), rg])
    );

    return {
      ...menu,
      categories: menu.categories.map((cat) => ({
        ...cat,
        items: cat.items.map((item) => ({
          ...item,
          modifierGroups: item.modifierGroups.map((mg) => {
            const reusable = reusableByName.get(mg.name.trim().toLowerCase());
            if (!reusable) return mg;
            return {
              ...mg,
              name: reusable.name,
              isRequired: reusable.isRequired,
              minSelections: reusable.minSelections,
              maxSelections: reusable.maxSelections,
              options: reusable.options
                .filter((o) => o.isAvailable)
                .map((o) => ({
                  id: o.id,
                  groupId: mg.id,
                  name: o.name,
                  priceExtra: o.priceExtra,
                  isAvailable: o.isAvailable,
                  sortOrder: o.sortOrder,
                  createdAt: mg.createdAt,
                  updatedAt: mg.updatedAt,
                })),
            };
          }),
        })),
      })),
    };
  },

  async getReusableModifierGroups(menuId: string) {
    try {
      const groups = await prisma.$queryRaw<
        {
          id: string;
          name: string;
          isRequired: boolean;
          minSelections: number;
          maxSelections: number;
          sortOrder: number;
        }[]
      >`
        SELECT "id", "name", "isRequired", "minSelections", "maxSelections", "sortOrder"
        FROM "ReusableModifierGroup"
        WHERE "menuId" = ${menuId}
        ORDER BY "sortOrder" ASC, "createdAt" ASC
      `;

      if (groups.length === 0) return [];

      const options = await prisma.$queryRaw<
        {
          id: string;
          groupId: string;
          name: string;
          priceExtra: number;
          isAvailable: boolean;
          sortOrder: number;
        }[]
      >`
        SELECT o."id", o."groupId", o."name", o."priceExtra", o."isAvailable", o."sortOrder"
        FROM "ReusableModifierOption" o
        INNER JOIN "ReusableModifierGroup" g ON g."id" = o."groupId"
        WHERE g."menuId" = ${menuId}
        ORDER BY o."sortOrder" ASC, o."createdAt" ASC
      `;

      const optionsByGroup = new Map<string, typeof options>();
      for (const opt of options) {
        const list = optionsByGroup.get(opt.groupId) ?? [];
        list.push(opt);
        optionsByGroup.set(opt.groupId, list);
      }

      return groups.map((g) => ({
        ...g,
        options: optionsByGroup.get(g.id) ?? [],
      }));
    } catch {
      return [];
    }
  },

  async getFullMenu(tenantId: string) {
    const menu = await prisma.menu.findFirst({
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

    if (!menu) return null;
    const reusableModifierGroups = await this.getReusableModifierGroups(menu.id);
    const reusableByName = new Map(
      reusableModifierGroups.map((rg) => [rg.name.trim().toLowerCase(), rg])
    );

    return {
      ...menu,
      reusableModifierGroups,
      categories: menu.categories.map((cat) => ({
        ...cat,
        items: cat.items.map((item) => ({
          ...item,
          modifierGroups: item.modifierGroups.map((mg) => {
            const reusable = reusableByName.get(mg.name.trim().toLowerCase());
            if (!reusable) return mg;
            return {
              ...mg,
              name: reusable.name,
              isRequired: reusable.isRequired,
              minSelections: reusable.minSelections,
              maxSelections: reusable.maxSelections,
              options: reusable.options.map((o) => ({
                id: o.id,
                groupId: mg.id,
                name: o.name,
                priceExtra: o.priceExtra,
                isAvailable: o.isAvailable,
                sortOrder: o.sortOrder,
                createdAt: mg.createdAt,
                updatedAt: mg.updatedAt,
              })),
            };
          }),
        })),
      })),
    };
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

  async countMenuItemsByTenant(tenantId: string): Promise<number> {
    return prisma.menuItem.count({
      where: {
        category: {
          menu: {
            tenantId,
          },
        },
      },
    });
  },

  async upsertReusableModifierGroup(menuId: string, group: RepoModifierGroup) {
    const cleanName = group.name.trim();
    if (!cleanName) return null;
    const prevName = group.previousName?.trim();
    const derivedGroupId =
      group.id && group.id.startsWith("derived-")
        ? group.id.slice("derived-".length)
        : null;

    let derivedOriginalName: string | undefined;
    if (derivedGroupId) {
      const derivedGroup = await prisma.menuItemModifierGroup.findUnique({
        where: { id: derivedGroupId },
        select: { name: true },
      });
      derivedOriginalName = derivedGroup?.name?.trim();
    }

    let existingRows: { id: string; name: string }[] = [];

    if (
      group.id &&
      !group.id.startsWith("temp-") &&
      !group.id.startsWith("derived-")
    ) {
      existingRows = await prisma.$queryRaw<{ id: string; name: string }[]>`
        SELECT "id", "name" FROM "ReusableModifierGroup"
        WHERE "id" = ${group.id} AND "menuId" = ${menuId}
        LIMIT 1
      `;
    }

    if (existingRows.length === 0 && prevName) {
      existingRows = await prisma.$queryRaw<{ id: string; name: string }[]>`
        SELECT "id", "name" FROM "ReusableModifierGroup"
        WHERE "menuId" = ${menuId} AND LOWER(TRIM("name")) = LOWER(${prevName})
        LIMIT 1
      `;
    }

    if (existingRows.length === 0 && derivedOriginalName) {
      existingRows = await prisma.$queryRaw<{ id: string; name: string }[]>`
        SELECT "id", "name" FROM "ReusableModifierGroup"
        WHERE "menuId" = ${menuId} AND LOWER(TRIM("name")) = LOWER(${derivedOriginalName})
        LIMIT 1
      `;
    }

    if (existingRows.length === 0) {
      existingRows = await prisma.$queryRaw<{ id: string; name: string }[]>`
        SELECT "id", "name" FROM "ReusableModifierGroup"
        WHERE "menuId" = ${menuId} AND LOWER(TRIM("name")) = LOWER(${cleanName})
        LIMIT 1
      `;
    }

    const validOptions = (group.options || [])
      .filter((o) => o.name.trim().length > 0)
      .map((o, oIdx) => ({
        name: o.name.trim(),
        priceExtra: Number(o.priceExtra) || 0,
        isAvailable: o.isAvailable ?? true,
        sortOrder: oIdx,
      }));

    let targetGroupId: string;
    const existingDbName = existingRows[0]?.name?.trim();

    if (existingRows.length > 0) {
      targetGroupId = existingRows[0].id;
      await prisma.$executeRaw`
        UPDATE "ReusableModifierGroup"
        SET "name" = ${cleanName},
            "isRequired" = ${Boolean(group.isRequired)},
            "minSelections" = ${Number(group.minSelections) || 0},
            "maxSelections" = ${Number(group.maxSelections) || 1},
            "updatedAt" = NOW()
        WHERE "id" = ${targetGroupId}
      `;
      await prisma.$executeRaw`
        DELETE FROM "ReusableModifierOption"
        WHERE "groupId" = ${targetGroupId}
      `;
    } else {
      targetGroupId = `rmg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      const maxSortRows = await prisma.$queryRaw<{ maxSort: number | null }[]>`
        SELECT MAX("sortOrder") AS "maxSort"
        FROM "ReusableModifierGroup"
        WHERE "menuId" = ${menuId}
      `;
      const nextSort = (maxSortRows[0]?.maxSort ?? -1) + 1;

      await prisma.$executeRaw`
        INSERT INTO "ReusableModifierGroup" (
          "id", "createdAt", "updatedAt", "menuId", "name",
          "isRequired", "minSelections", "maxSelections", "sortOrder"
        ) VALUES (
          ${targetGroupId}, NOW(), NOW(), ${menuId}, ${cleanName},
          ${Boolean(group.isRequired)}, ${Number(group.minSelections) || 0},
          ${Number(group.maxSelections) || 1}, ${nextSort}
        )
      `;
    }

    for (const opt of validOptions) {
      const optId = `rmo_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      await prisma.$executeRaw`
        INSERT INTO "ReusableModifierOption" (
          "id", "createdAt", "updatedAt", "groupId", "name",
          "priceExtra", "isAvailable", "sortOrder"
        ) VALUES (
          ${optId}, NOW(), NOW(), ${targetGroupId}, ${opt.name},
          ${opt.priceExtra}, ${opt.isAvailable}, ${opt.sortOrder}
        )
      `;
    }

    // Propagate update to all MenuItemModifierGroup rows across all dishes in this menu that use this saved group
    const nameMatches = Array.from(
      new Set(
        [cleanName, prevName, existingDbName, derivedOriginalName]
          .map((n) => n?.trim())
          .filter((n): n is string => Boolean(n && n.length > 0))
      )
    );

    const matchingItemGroups = await prisma.menuItemModifierGroup.findMany({
      where: {
        menuItem: {
          category: {
            menuId,
          },
        },
        OR: [
          ...nameMatches.map((n) => ({
            name: { equals: n, mode: "insensitive" as const },
          })),
          ...(derivedGroupId ? [{ id: derivedGroupId }] : []),
        ],
      },
      select: { id: true },
    });

    if (matchingItemGroups.length > 0) {
      const matchingGroupIds = matchingItemGroups.map((g) => g.id);
      await prisma.$transaction(async (tx) => {
        await tx.menuItemModifierGroup.updateMany({
          where: { id: { in: matchingGroupIds } },
          data: {
            name: cleanName,
            isRequired: Boolean(group.isRequired),
            minSelections: Number(group.minSelections) || 0,
            maxSelections: Number(group.maxSelections) || 1,
          },
        });

        await tx.menuItemModifierOption.deleteMany({
          where: { groupId: { in: matchingGroupIds } },
        });

        const optionsToCreate = matchingGroupIds.flatMap((gId) =>
          validOptions.map((opt) => ({
            groupId: gId,
            name: opt.name,
            priceExtra: opt.priceExtra,
            isAvailable: opt.isAvailable,
            sortOrder: opt.sortOrder,
          }))
        );

        if (optionsToCreate.length > 0) {
          await tx.menuItemModifierOption.createMany({
            data: optionsToCreate,
          });
        }
      });
    }

    return { id: targetGroupId, name: cleanName };
  },

  async deleteReusableModifierGroup(groupId: string) {
    return prisma.$executeRaw`
      DELETE FROM "ReusableModifierGroup"
      WHERE "id" = ${groupId}
    `;
  },

  async createMenuItem(categoryId: string, data: {
    name: string;
    description?: string;
    price: number;
    imageUrl?: string;
    modifierGroups?: RepoModifierGroup[];
  }) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { menuId: true },
    });

    const lastItem = await prisma.menuItem.findFirst({
      where: { categoryId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    const rawGroups = (data.modifierGroups || []).filter((g) => g.name.trim().length > 0);
    const existingReusable = category?.menuId
      ? await this.getReusableModifierGroups(category.menuId)
      : [];
    const reusableByName = new Map(
      existingReusable.map((r) => [r.name.trim().toLowerCase(), r])
    );

    const cleanGroups = rawGroups.map((g) => {
      const matched = reusableByName.get(g.name.trim().toLowerCase());
      if (matched) {
        return {
          ...g,
          name: matched.name,
          isRequired: matched.isRequired,
          minSelections: matched.minSelections,
          maxSelections: matched.maxSelections,
          options: matched.options.map((o) => ({
            name: o.name,
            priceExtra: o.priceExtra,
            isAvailable: o.isAvailable,
          })),
        };
      }
      return g;
    });

    if (category?.menuId && rawGroups.length > 0) {
      for (const group of rawGroups) {
        if (
          group.saveAsReusable &&
          !reusableByName.has(group.name.trim().toLowerCase())
        ) {
          await this.upsertReusableModifierGroup(category.menuId, group);
        }
      }
    }

    return prisma.menuItem.create({
      data: {
        categoryId,
        name: data.name,
        description: data.description ?? null,
        price: data.price,
        imageUrl: data.imageUrl ?? null,
        sortOrder: (lastItem?.sortOrder ?? -1) + 1,
        modifierGroups: cleanGroups.length > 0 ? {
          create: cleanGroups.map((g, gIdx) => ({
            name: g.name.trim(),
            isRequired: g.isRequired,
            minSelections: g.minSelections,
            maxSelections: g.maxSelections,
            sortOrder: gIdx,
            options: {
              create: g.options
                .filter((o) => o.name.trim().length > 0)
                .map((o, oIdx: number) => ({
                  name: o.name.trim(),
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
    const rawGroups = data.modifierGroups
      ? data.modifierGroups.filter((g) => g.name.trim().length > 0)
      : undefined;

    const existingItem =
      rawGroups && rawGroups.length > 0
        ? await prisma.menuItem.findUnique({
            where: { id: itemId },
            include: { category: { select: { menuId: true } } },
          })
        : null;
    const menuId = existingItem?.category?.menuId;

    const existingReusable =
      menuId && rawGroups && rawGroups.length > 0
        ? await this.getReusableModifierGroups(menuId)
        : [];
    const reusableByName = new Map(
      existingReusable.map((r) => [r.name.trim().toLowerCase(), r])
    );

    if (menuId && rawGroups && rawGroups.length > 0) {
      for (const group of rawGroups) {
        if (
          group.saveAsReusable &&
          !reusableByName.has(group.name.trim().toLowerCase())
        ) {
          await this.upsertReusableModifierGroup(menuId, group);
        }
      }
    }

    const cleanGroups = rawGroups?.map((g) => {
      const matched = reusableByName.get(g.name.trim().toLowerCase());
      if (matched) {
        return {
          ...g,
          name: matched.name,
          isRequired: matched.isRequired,
          minSelections: matched.minSelections,
          maxSelections: matched.maxSelections,
          options: matched.options.map((o) => ({
            name: o.name,
            priceExtra: o.priceExtra,
            isAvailable: o.isAvailable,
          })),
        };
      }
      return g;
    });

    return prisma.$transaction(async (tx) => {
      // If modifierGroups are provided, delete existing and recreate
      if (cleanGroups !== undefined) {
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
          ...(cleanGroups ? {
            modifierGroups: {
              create: cleanGroups.map((g, gIdx) => ({
                name: g.name.trim(),
                isRequired: g.isRequired,
                minSelections: g.minSelections,
                maxSelections: g.maxSelections,
                sortOrder: gIdx,
                options: {
                  create: g.options
                    .filter((o) => o.name.trim().length > 0)
                    .map((o, oIdx: number) => ({
                      name: o.name.trim(),
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
