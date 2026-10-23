/**
 * Prisma Seed — Restro Dev Data
 * Run: npx prisma db seed (or npm run db:seed)
 *
 * Seeds 4 Plans (STARTER, CARTA_DIGITAL, RESTRO_IA, BUSINESS)
 * and 4 Demo Tenants (1 restaurant per plan) for testing.
 */

import { PrismaClient } from "../generated/prisma/client";
import { createHash, randomUUID } from "crypto";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

let connectionString = `${process.env.DATABASE_URL}`;
if (connectionString.includes("?pgbouncer=true")) {
  connectionString = connectionString.replace("?pgbouncer=true", "");
}
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Ensures a user exists in Supabase Auth (auth.users + auth.identities) with the given password
 * and returns their Supabase Auth UUID so public.User.id matches 1:1.
 */
async function ensureSupabaseAuthUser(email: string, password: string, name: string): Promise<string> {
  const normalizedEmail = email.toLowerCase().trim();
  const existing = await pool.query<{ id: string }>(
    `SELECT id FROM auth.users WHERE email = $1 LIMIT 1`,
    [normalizedEmail]
  );

  if (existing.rows.length > 0) {
    const userId = existing.rows[0].id;
    const metaPatch = JSON.stringify({ name, email_verified: true });
    await pool.query(
      `UPDATE auth.users
       SET encrypted_password = extensions.crypt($2, extensions.gen_salt('bf')),
           email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
           raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || $3::jsonb,
           updated_at = NOW()
       WHERE id = $1::uuid`,
      [userId, password, metaPatch]
    );
    return userId;
  }

  const userId = randomUUID();
  const identityId = randomUUID();
  const rawUserMetaData = JSON.stringify({
    sub: userId,
    email: normalizedEmail,
    name,
    email_verified: true,
    phone_verified: false,
  });
  const identityData = JSON.stringify({
    sub: userId,
    email: normalizedEmail,
    email_verified: true,
    phone_verified: false,
  });

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
    [userId, normalizedEmail, password, rawUserMetaData]
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
    [identityId, userId, userId, identityData]
  );

  return userId;
}

async function seedCategoriesAndItems(
  menuId: string,
  categoriesData: {
    name: string;
    items: {
      name: string;
      price: number;
      description?: string;
      isHighlighted?: boolean;
      modifierGroups?: {
        name: string;
        isRequired?: boolean;
        minSelections?: number;
        maxSelections?: number;
        options: { name: string; priceExtra?: number }[];
      }[];
    }[];
  }[]
) {
  const createdItems: { id: string; name: string; price: number }[] = [];

  for (let cIdx = 0; cIdx < categoriesData.length; cIdx++) {
    const catDef = categoriesData[cIdx];
    const category = await prisma.category.create({
      data: {
        menuId,
        name: catDef.name,
        sortOrder: cIdx,
      },
    });

    for (let iIdx = 0; iIdx < catDef.items.length; iIdx++) {
      const itemDef = catDef.items[iIdx];
      const item = await prisma.menuItem.create({
        data: {
          categoryId: category.id,
          name: itemDef.name,
          price: itemDef.price,
          description: itemDef.description ?? null,
          isHighlighted: itemDef.isHighlighted ?? false,
          sortOrder: iIdx,
          ...(itemDef.modifierGroups && itemDef.modifierGroups.length > 0
            ? {
                modifierGroups: {
                  create: itemDef.modifierGroups.map((group, gIdx) => ({
                    name: group.name,
                    isRequired: group.isRequired ?? false,
                    minSelections: group.minSelections ?? 0,
                    maxSelections: group.maxSelections ?? 1,
                    sortOrder: gIdx,
                    options: {
                      create: group.options.map((opt, oIdx) => ({
                        name: opt.name,
                        priceExtra: opt.priceExtra ?? 0,
                        isAvailable: true,
                        sortOrder: oIdx,
                      })),
                    },
                  })),
                },
              }
            : {}),
        },
      });
      createdItems.push({ id: item.id, name: item.name, price: item.price });
    }
  }

  return createdItems;
}

const DEMO_SLUGS = ["don-carlos", "el-mirador", "bella-napoli", "imperial"];
const DEMO_EMAILS = [
  "admin@restro.dev",
  "starter@restro.dev",
  "carta@restro.dev",
  "ia@restro.dev",
  "business@restro.dev",
];

async function main() {
  console.log("Seeding Restro dev database (4 planes + 4 tenants de prueba sincronizados con Supabase Auth)...");

  // Cleanup ONLY the demo tenants/users so real registered accounts are preserved
  const existingDemoTenants = await prisma.tenant.findMany({
    where: { slug: { in: DEMO_SLUGS } },
    select: { id: true },
  });
  const demoTenantIds = existingDemoTenants.map((t) => t.id);

  if (demoTenantIds.length > 0) {
    await prisma.billingEvent.deleteMany({ where: { subscription: { tenantId: { in: demoTenantIds } } } });
    await prisma.tenantFeatureOverride.deleteMany({ where: { tenantId: { in: demoTenantIds } } });
    await prisma.orderTelemetry.deleteMany({ where: { order: { tenantId: { in: demoTenantIds } } } });
    await prisma.orderStatusHistory.deleteMany({ where: { order: { tenantId: { in: demoTenantIds } } } });
    await prisma.orderItem.deleteMany({ where: { order: { tenantId: { in: demoTenantIds } } } });
    await prisma.order.deleteMany({ where: { tenantId: { in: demoTenantIds } } });
    await prisma.analyticsEvent.deleteMany({ where: { tenantId: { in: demoTenantIds } } });
    await prisma.staffMember.deleteMany({ where: { tenantId: { in: demoTenantIds } } });
    await prisma.businessHour.deleteMany({ where: { tenantId: { in: demoTenantIds } } });
    await prisma.menuItemModifierOption.deleteMany({ where: { group: { menuItem: { category: { menu: { tenantId: { in: demoTenantIds } } } } } } });
    await prisma.menuItemModifierGroup.deleteMany({ where: { menuItem: { category: { menu: { tenantId: { in: demoTenantIds } } } } } });
    await prisma.table.deleteMany({ where: { tenantId: { in: demoTenantIds } } });
    await prisma.menuItem.deleteMany({ where: { category: { menu: { tenantId: { in: demoTenantIds } } } } });
    await prisma.category.deleteMany({ where: { menu: { tenantId: { in: demoTenantIds } } } });
    await prisma.menu.deleteMany({ where: { tenantId: { in: demoTenantIds } } });
    await prisma.subscription.deleteMany({ where: { tenantId: { in: demoTenantIds } } });
    await prisma.user.deleteMany({ where: { OR: [{ tenantId: { in: demoTenantIds } }, { email: { in: DEMO_EMAILS } }] } });
    await prisma.tenant.deleteMany({ where: { id: { in: demoTenantIds } } });
  } else {
    await prisma.user.deleteMany({ where: { email: { in: DEMO_EMAILS } } });
  }

  // ─── 1. UPSERT PLANS ────────────────────────────────────────────────────────
  const starterPlan = await prisma.plan.upsert({
    where: { key: "STARTER" },
    update: {
      label: "Starter",
      tag: "GRATIS",
      description: "Para restaurantes que inician su digitalización (hasta 5 mesas y 5 productos, solo carta digital)",
      priceMonthly: 0,
      maxTables: 5,
      maxMenuItems: 5,
      maxStaff: 1,
      maxMenus: 1,
      analyticsDays: 0,
      sortOrder: 1,
    },
    create: {
      key: "STARTER",
      label: "Starter",
      tag: "GRATIS",
      description: "Para restaurantes que inician su digitalización (hasta 5 mesas y 5 productos, solo carta digital)",
      priceMonthly: 0,
      maxTables: 5,
      maxMenuItems: 5,
      maxStaff: 1,
      maxMenus: 1,
      analyticsDays: 0,
      sortOrder: 1,
    },
  });

  const cartaDigitalPlan = await prisma.plan.upsert({
    where: { key: "CARTA_DIGITAL" },
    update: {
      label: "Carta Digital",
      tag: "ESENCIAL",
      description: "Productos ilimitados y códigos QR por mesa para imprimir (solo carta digital, sin KDS ni analítica)",
      priceMonthly: 9900,
      priceYearly: 95000,
      maxTables: -1,
      maxMenuItems: -1,
      maxStaff: 1,
      maxMenus: 1,
      analyticsDays: 0,
      hasCustomBranding: true,
      sortOrder: 2,
    },
    create: {
      key: "CARTA_DIGITAL",
      label: "Carta Digital",
      tag: "ESENCIAL",
      description: "Productos ilimitados y códigos QR por mesa para imprimir (solo carta digital, sin KDS ni analítica)",
      priceMonthly: 9900,
      priceYearly: 95000,
      maxTables: -1,
      maxMenuItems: -1,
      maxStaff: 1,
      maxMenus: 1,
      analyticsDays: 0,
      hasCustomBranding: true,
      sortOrder: 2,
    },
  });

  const restroIaPlan = await prisma.plan.upsert({
    where: { key: "RESTRO_IA" },
    update: {
      label: "Restro IA",
      tag: "PRO",
      description: "Operación con KDS en tiempo real, inventario y analítica impulsada por IA",
      priceMonthly: 49900,
      priceYearly: 479000,
      maxTables: -1,
      maxMenuItems: -1,
      maxStaff: 10,
      maxMenus: 5,
      analyticsDays: 365,
      hasAI: true,
      hasInventory: true,
      hasMultiLanguage: true,
      hasExportPDF: true,
      hasCustomBranding: true,
      sortOrder: 3,
    },
    create: {
      key: "RESTRO_IA",
      label: "Restro IA",
      tag: "PRO",
      description: "Operación con KDS en tiempo real, inventario y analítica impulsada por IA",
      priceMonthly: 49900,
      priceYearly: 479000,
      maxTables: -1,
      maxMenuItems: -1,
      maxStaff: 10,
      maxMenus: 5,
      analyticsDays: 365,
      hasAI: true,
      hasInventory: true,
      hasMultiLanguage: true,
      hasExportPDF: true,
      hasCustomBranding: true,
      sortOrder: 3,
    },
  });

  const businessPlan = await prisma.plan.upsert({
    where: { key: "BUSINESS" },
    update: {
      label: "Business",
      tag: "ENTERPRISE",
      description: "Mesas y staff ilimitados, WhatsApp Business, reportes Excel/PDF y soporte prioritario",
      priceMonthly: 99900,
      priceYearly: 959000,
      maxTables: -1,
      maxMenuItems: -1,
      maxStaff: -1,
      maxMenus: -1,
      analyticsDays: 365,
      hasAI: true,
      hasInventory: true,
      hasMultiLanguage: true,
      hasExportPDF: true,
      hasExportExcel: true,
      hasCustomBranding: true,
      hasWhatsApp: true,
      hasPrioritySupport: true,
      sortOrder: 4,
    },
    create: {
      key: "BUSINESS",
      label: "Business",
      tag: "ENTERPRISE",
      description: "Mesas y staff ilimitados, WhatsApp Business, reportes Excel/PDF y soporte prioritario",
      priceMonthly: 99900,
      priceYearly: 959000,
      maxTables: -1,
      maxMenuItems: -1,
      maxStaff: -1,
      maxMenus: -1,
      analyticsDays: 365,
      hasAI: true,
      hasInventory: true,
      hasMultiLanguage: true,
      hasExportPDF: true,
      hasExportExcel: true,
      hasCustomBranding: true,
      hasWhatsApp: true,
      hasPrioritySupport: true,
      sortOrder: 4,
    },
  });

  const passwordHash = hashPassword("restro123");

  // ─── 2. TENANT 1: STARTER (Gratis — máx 5 mesas y 5 productos; inicia con 4/5 para probar creación) ──
  const starterTenant = await prisma.tenant.create({
    data: {
      name: "La Parrilla de Don Carlos",
      slug: "don-carlos",
      description: "Los mejores cortes de carne de Bogotá, desde 1985 (Demo Plan Starter)",
      phone: "+57 310 555 0001",
      address: "Calle 93 # 15-40, Chapinero",
      city: "Bogotá",
      brandColor: "#2563EB",
      isMenuOnly: true,
      onboarding: true,
    },
  });

  const adminAuthId = await ensureSupabaseAuthUser("admin@restro.dev", "restro123", "Carlos Gómez (Starter)");
  const starterAuthId = await ensureSupabaseAuthUser("starter@restro.dev", "restro123", "Carlos Gómez (Starter)");

  await prisma.user.createMany({
    data: [
      {
        id: adminAuthId,
        email: "admin@restro.dev",
        name: "Carlos Gómez (Starter)",
        passwordHash,
        tenantId: starterTenant.id,
        role: "OWNER",
      },
      {
        id: starterAuthId,
        email: "starter@restro.dev",
        name: "Carlos Gómez (Starter)",
        passwordHash,
        tenantId: starterTenant.id,
        role: "OWNER",
      },
    ],
  });

  await prisma.subscription.create({
    data: {
      tenantId: starterTenant.id,
      planId: starterPlan.id,
      status: "ACTIVE",
    },
  });

  const starterMenu = await prisma.menu.create({
    data: { tenantId: starterTenant.id, name: "Carta Principal" },
  });

  // 4 productos (4/5 del cupo Starter) para que al entrar puedas crear el #5 y ver el bloqueo en 5/5
  await seedCategoriesAndItems(starterMenu.id, [
    {
      name: "Entradas",
      items: [
        {
          name: "Patacones con hogao",
          price: 18000,
          description: "Plátano verde frito con salsa de tomate y cebolla",
          modifierGroups: [
            {
              name: "Adiciones",
              isRequired: false,
              minSelections: 0,
              maxSelections: 2,
              options: [
                { name: "Queso costeño rallado", priceExtra: 4500 },
                { name: "Guacamole artesanal", priceExtra: 5000 },
                { name: "Suero costeño", priceExtra: 3500 },
              ],
            },
          ],
        },
        {
          name: "Chorizo santafereño",
          price: 22000,
          description: "Chorizo artesanal a la parrilla con ají y arepa",
          modifierGroups: [
            {
              name: "Elige 1 acompañante incluido",
              isRequired: true,
              minSelections: 1,
              maxSelections: 1,
              options: [
                { name: "Arepa blanca asada", priceExtra: 0 },
                { name: "Papa criolla dorada", priceExtra: 0 },
                { name: "Patacón crocante", priceExtra: 0 },
              ],
            },
          ],
        },
      ],
    },
    {
      name: "Carnes a la Parrilla",
      items: [
        {
          name: "Churrasco 300g",
          price: 68000,
          description: "Corte premium madurado 21 días, con papas rústicas",
          isHighlighted: true,
          modifierGroups: [
            {
              name: "Término de la carne",
              isRequired: true,
              minSelections: 1,
              maxSelections: 1,
              options: [
                { name: "Azul / Sellado", priceExtra: 0 },
                { name: "Medio", priceExtra: 0 },
                { name: "Tres cuartos", priceExtra: 0 },
                { name: "Bien asado", priceExtra: 0 },
              ],
            },
            {
              name: "Acompañantes incluidos (Elige hasta 2)",
              isRequired: true,
              minSelections: 1,
              maxSelections: 2,
              options: [
                { name: "Papas rústicas al romero", priceExtra: 0 },
                { name: "Ensalada fresca de la casa", priceExtra: 0 },
                { name: "Yuca al vapor con chimichurri", priceExtra: 0 },
                { name: "Patacón con hogao", priceExtra: 0 },
                { name: "Arroz blanco", priceExtra: 0 },
              ],
            },
            {
              name: "Adiciones extra",
              isRequired: false,
              minSelections: 0,
              maxSelections: 3,
              options: [
                { name: "Chorizo artesanal", priceExtra: 9500 },
                { name: "Queso provolone fundido", priceExtra: 8000 },
                { name: "Porción extra de papas", priceExtra: 7000 },
              ],
            },
          ],
        },
        {
          name: "Punta de anca 250g",
          price: 62000,
          description: "Jugosa y tierna, con chimichurri casero",
          isHighlighted: true,
          modifierGroups: [
            {
              name: "Término de la carne",
              isRequired: true,
              minSelections: 1,
              maxSelections: 1,
              options: [
                { name: "Medio", priceExtra: 0 },
                { name: "Tres cuartos", priceExtra: 0 },
                { name: "Bien asado", priceExtra: 0 },
              ],
            },
            {
              name: "Acompañantes incluidos",
              isRequired: true,
              minSelections: 1,
              maxSelections: 2,
              options: [
                { name: "Papa sabanera salada", priceExtra: 0 },
                { name: "Ensalada verde", priceExtra: 0 },
                { name: "Arepa con queso", priceExtra: 0 },
                { name: "Maduro al horno con bocadillo", priceExtra: 3500 },
              ],
            },
          ],
        },
      ],
    },
  ]);

  // 4 mesas (4/5 del cupo Starter) para probar la creación de la 5ta mesa y el límite en 5/5
  const starterTables = [
    { name: "Mesa 1", capacity: 4 },
    { name: "Mesa 2", capacity: 4 },
    { name: "Mesa 3", capacity: 6 },
    { name: "Mesa 4", capacity: 2 },
  ];
  for (let i = 0; i < starterTables.length; i++) {
    await prisma.table.create({
      data: { tenantId: starterTenant.id, ...starterTables[i], sortOrder: i },
    });
  }

  // ─── 3. TENANT 2: CARTA DIGITAL ($9.900/mes — Productos y QRs ilimitados) ───
  const cartaTenant = await prisma.tenant.create({
    data: {
      name: "Café & Bistro El Mirador",
      slug: "el-mirador",
      description: "Café de especialidad, brunch artesanal y pastelería recién horneada (Demo Plan Carta Digital)",
      phone: "+57 310 555 0002",
      address: "Carrera 14 # 85-22, Zona T",
      city: "Bogotá",
      brandColor: "#0D9488",
      isMenuOnly: true,
      onboarding: true,
    },
  });

  const cartaAuthId = await ensureSupabaseAuthUser("carta@restro.dev", "restro123", "Laura Restrepo (Carta Digital)");

  await prisma.user.create({
    data: {
      id: cartaAuthId,
      email: "carta@restro.dev",
      name: "Laura Restrepo (Carta Digital)",
      passwordHash,
      tenantId: cartaTenant.id,
      role: "OWNER",
    },
  });

  await prisma.subscription.create({
    data: {
      tenantId: cartaTenant.id,
      planId: cartaDigitalPlan.id,
      status: "ACTIVE",
    },
  });

  const cartaMenu = await prisma.menu.create({
    data: { tenantId: cartaTenant.id, name: "Carta Digital El Mirador" },
  });

  // 22 productos (>20) para demostrar productos ilimitados en Carta Digital
  await seedCategoriesAndItems(cartaMenu.id, [
    {
      name: "Cafés de Especialidad",
      items: [
        { name: "Espresso Doble Origen Huila", price: 8500, description: "Notas achocolatadas y frutos rojos", isHighlighted: true },
        {
          name: "Cappuccino Artesanal",
          price: 11500,
          description: "Leche texturizada o bebida de almendras",
          modifierGroups: [
            {
              name: "Tipo de leche",
              isRequired: true,
              minSelections: 1,
              maxSelections: 1,
              options: [
                { name: "Leche entera", priceExtra: 0 },
                { name: "Leche deslactosada", priceExtra: 0 },
                { name: "Leche de almendras", priceExtra: 2500 },
                { name: "Leche de avena", priceExtra: 2500 },
              ],
            },
          ],
        },
        { name: "Flat White", price: 12000, description: "Doble ristretto con microespuma sedosa" },
        { name: "Latte de Vainilla Natural", price: 13500 },
        { name: "Cold Brew 18 Horas", price: 14000, description: "Extracción en frío servida con hielo y piel de naranja" },
        { name: "Filtrado V60 / Chemex", price: 15000, description: "Grano exótico Geisha de temporada" },
      ],
    },
    {
      name: "Brunch & Tostadas",
      items: [
        {
          name: "Avocado Toast en Masa Madre",
          price: 28000,
          description: "Aguacate hass, huevo poché, semillas y aceite de trufa",
          isHighlighted: true,
          modifierGroups: [
            {
              name: "Acompañantes y adiciones",
              isRequired: false,
              minSelections: 0,
              maxSelections: 3,
              options: [
                { name: "Salmón ahumado 60g", priceExtra: 11000 },
                { name: "Huevo poché adicional", priceExtra: 4500 },
                { name: "Tocineta artesanal crocante", priceExtra: 6500 },
                { name: "Queso feta desmoronado", priceExtra: 5000 },
              ],
            },
          ],
        },
        {
          name: "Huevos Benedictinos con Salmón",
          price: 36000,
          description: "Sobre brioche artesanal con salsa holandesa",
          modifierGroups: [
            {
              name: "Acompañamiento incluido",
              isRequired: true,
              minSelections: 1,
              maxSelections: 1,
              options: [
                { name: "Mix de hojas orgánicas", priceExtra: 0 },
                { name: "Papas hashbrown doradas", priceExtra: 0 },
                { name: "Fruta fresca de estación", priceExtra: 0 },
              ],
            },
          ],
        },
        { name: "Croissant de Jamón Serrano y Brie", price: 29000, description: "Horneado al momento con rúgula y miel" },
        { name: "Pancakes de Avena y Arándanos", price: 26000, description: "Con miel de maple orgánica y yogur griego" },
        { name: "Bowl de Açaí Amazónico", price: 31000, description: "Granola de la casa, banano, fresas y nibs de cacao" },
        { name: "Omelette Mediterráneo", price: 27000, description: "Queso feta, espinaca, tomates secos y aceitunas" },
      ],
    },
    {
      name: "Pastelería Artesanal",
      items: [
        { name: "Croissant de Mantequilla Francesa", price: 9500 },
        { name: "Pain au Chocolat Belga", price: 11000 },
        { name: "Tarta Vasca de Queso", price: 19000, description: "Cremosa por dentro y caramelizada por fuera", isHighlighted: true },
        { name: "Rollo de Canela y Cardamomo", price: 13000 },
        { name: "Torta de Zanahoria y Nueces", price: 16000 },
      ],
    },
    {
      name: "Bebidas Frías & Infusiones",
      items: [
        { name: "Matcha Latte Frío", price: 16000, description: "Matcha ceremonial japonés con leche de avena" },
        { name: "Soda Italiana de Frutos Rojos", price: 13500 },
        { name: "Kombucha Artesanal Jengibre", price: 14500 },
        { name: "Jugo Prensado en Frío Verde", price: 15000, description: "Manzana verde, apio, pepino, espinaca y jengibre" },
        { name: "Té Chai con Especias", price: 13000 },
      ],
    },
  ]);

  // 8 mesas (>5) con códigos QR listos para imprimir
  const cartaTables = [
    { name: "Mesa 1", capacity: 2 },
    { name: "Mesa 2", capacity: 2 },
    { name: "Mesa 3", capacity: 4 },
    { name: "Mesa 4", capacity: 4 },
    { name: "Mesa 5", capacity: 4 },
    { name: "Mesa 6", capacity: 6 },
    { name: "Terraza 1", capacity: 4 },
    { name: "Terraza 2", capacity: 6 },
  ];
  for (let i = 0; i < cartaTables.length; i++) {
    await prisma.table.create({
      data: { tenantId: cartaTenant.id, ...cartaTables[i], sortOrder: i },
    });
  }

  // ─── 4. TENANT 3: RESTRO IA ($49.900/mes — KDS + IA + ilimitados) ───────────
  const iaTenant = await prisma.tenant.create({
    data: {
      name: "Trattoria Bella Napoli",
      slug: "bella-napoli",
      description: "Auténtica cocina italiana con horno de leña y pastas frescas (Demo Plan Restro IA)",
      phone: "+57 310 555 0003",
      address: "Calle 70 # 5-25, Zona G",
      city: "Bogotá",
      brandColor: "#7C3AED",
      isMenuOnly: false,
      onboarding: true,
    },
  });

  const iaAuthId = await ensureSupabaseAuthUser("ia@restro.dev", "restro123", "Marco Rossi (Restro IA)");

  await prisma.user.create({
    data: {
      id: iaAuthId,
      email: "ia@restro.dev",
      name: "Marco Rossi (Restro IA)",
      passwordHash,
      tenantId: iaTenant.id,
      role: "OWNER",
    },
  });

  await prisma.subscription.create({
    data: {
      tenantId: iaTenant.id,
      planId: restroIaPlan.id,
      status: "ACTIVE",
    },
  });

  const iaMenu = await prisma.menu.create({
    data: { tenantId: iaTenant.id, name: "Menu Italiano" },
  });

  const iaItems = await seedCategoriesAndItems(iaMenu.id, [
    {
      name: "Antipasti",
      items: [
        { name: "Burrata Pugliese con Prosciutto", price: 42000, description: "Tomates cherry confitados, pesto genovés y focaccia", isHighlighted: true },
        { name: "Carpaccio di Manzo", price: 38000, description: "Láminas de res, parmesano reggiano, alcaparras y rúgula" },
        { name: "Bruschetta Clásica", price: 24000, description: "Pan rústico con tomate San Marzano, ajo y albahaca" },
      ],
    },
    {
      name: "Pizzas en Horno de Leña",
      items: [
        { name: "Margherita D.O.P.", price: 44000, description: "Mozzarella di bufala, pomodoro San Marzano y albahaca", isHighlighted: true },
        { name: "Diavola Piccante", price: 49000, description: "Salami napolitano picante, mozzarella y aceite de peperoncino" },
        { name: "Quattro Formaggi & Miel de Trufa", price: 54000, description: "Gorgonzola, fontina, parmigiano y fior di latte" },
      ],
    },
    {
      name: "Pastas Frescas",
      items: [
        { name: "Tagliatelle al Tartufo Nero", price: 58000, description: "Pasta artesanal en salsa cremosa de trufa negra", isHighlighted: true },
        { name: "Spaghetti alla Carbonara", price: 46000, description: "Guanciale crujiente, pecorino romano y yema de huevo" },
        { name: "Ravioli de Ossobuco", price: 52000, description: "Rellenos de ossobuco braseado en reducción de vino tinto" },
      ],
    },
    {
      name: "Dolci & Bebidas",
      items: [
        { name: "Tiramisú della Casa", price: 22000, description: "Mascarpone italiano, espresso y cacao amargo" },
        { name: "Aperol Spritz", price: 32000, description: "Aperol, prosecco y soda con rodaja de naranja" },
        { name: "Limonata Siciliana", price: 14000 },
      ],
    },
  ]);

  const iaTables = [];
  for (let i = 1; i <= 8; i++) {
    const t = await prisma.table.create({
      data: {
        tenantId: iaTenant.id,
        name: `Mesa ${i}`,
        capacity: i % 2 === 0 ? 4 : 2,
        sortOrder: i - 1,
      },
    });
    iaTables.push(t);
  }

  // Pedido activo de ejemplo para Bella Napoli (KDS y Analítica)
  if (iaItems.length >= 2 && iaTables.length > 0) {
    const orderTotal = iaItems[0].price + iaItems[3].price * 2;
    await prisma.order.create({
      data: {
        tenantId: iaTenant.id,
        tableId: iaTables[0].id,
        type: "DINE_IN",
        status: "PREPARING",
        orderNumber: 101,
        subtotal: orderTotal,
        total: orderTotal,
        preparingAt: new Date(),
        items: {
          create: [
            {
              menuItemId: iaItems[0].id,
              name: iaItems[0].name,
              price: iaItems[0].price,
              quantity: 1,
              subtotal: iaItems[0].price,
              status: "PREPARING",
            },
            {
              menuItemId: iaItems[3].id,
              name: iaItems[3].name,
              price: iaItems[3].price,
              quantity: 2,
              subtotal: iaItems[3].price * 2,
              status: "PENDING",
            },
          ],
        },
      },
    });
  }

  // ─── 5. TENANT 4: BUSINESS ($99.900/mes — Todo ilimitado + WhatsApp) ────────
  const businessTenant = await prisma.tenant.create({
    data: {
      name: "Grupo Gastronómico Imperial",
      slug: "imperial",
      description: "Alta cocina de mar y tierra, coctelería de autor y salones VIP (Demo Plan Business)",
      phone: "+57 310 555 0004",
      address: "Parque de la 93 # 13-10",
      city: "Bogotá",
      brandColor: "#EA580C",
      isMenuOnly: false,
      allowDineIn: true,
      allowTakeout: true,
      allowDelivery: true,
      allowWhatsAppOrdering: true,
      whatsappNumber: "+573105550004",
      onboarding: true,
    },
  });

  const businessAuthId = await ensureSupabaseAuthUser("business@restro.dev", "restro123", "Valeria Mendoza (Business)");

  await prisma.user.create({
    data: {
      id: businessAuthId,
      email: "business@restro.dev",
      name: "Valeria Mendoza (Business)",
      passwordHash,
      tenantId: businessTenant.id,
      role: "OWNER",
    },
  });

  await prisma.subscription.create({
    data: {
      tenantId: businessTenant.id,
      planId: businessPlan.id,
      status: "ACTIVE",
    },
  });

  const businessMenu = await prisma.menu.create({
    data: { tenantId: businessTenant.id, name: "Carta Degustación & Salón" },
  });

  const businessItems = await seedCategoriesAndItems(businessMenu.id, [
    {
      name: "Entradas de Autor",
      items: [
        { name: "Ceviche de Corvina y Leche de Tigre al Ají Amarillo", price: 46000, isHighlighted: true },
        { name: "Pulpo a la Parrilla sobre Puré de Criolla", price: 54000, isHighlighted: true },
        { name: "Tartar de Atún Rojo y Aguacate", price: 49000 },
      ],
    },
    {
      name: "Cortes & Mariscos",
      items: [
        { name: "Tomahawk Angus Certificado 900g", price: 245000, description: "Maduración dry-aged 45 días, ideal para compartir", isHighlighted: true },
        { name: "Langosta del Caribe al Thermidor", price: 165000 },
        { name: "Salmón Glaseado en Miso y Sésamo", price: 78000 },
        { name: "Risotto de Mariscos al Azafrán", price: 82000 },
      ],
    },
    {
      name: "Coctelería & Vinos",
      items: [
        { name: "Negroni Ahumado en Barrica", price: 42000 },
        { name: "Gin Tonic Botánico Imperial", price: 38000 },
        { name: "Copa Vino Tinto Reserva Malbec", price: 35000 },
      ],
    },
  ]);

  const businessTableNames = [
    { name: "Salón 1", capacity: 4 },
    { name: "Salón 2", capacity: 4 },
    { name: "Salón 3", capacity: 6 },
    { name: "Salón 4", capacity: 6 },
    { name: "Salón 5", capacity: 4 },
    { name: "Salón 6", capacity: 8 },
    { name: "VIP 1", capacity: 10 },
    { name: "VIP 2", capacity: 12 },
    { name: "Terraza 1", capacity: 4 },
    { name: "Barra Principal", capacity: 6 },
  ];

  const businessTables = [];
  for (let i = 0; i < businessTableNames.length; i++) {
    const t = await prisma.table.create({
      data: { tenantId: businessTenant.id, ...businessTableNames[i], sortOrder: i },
    });
    businessTables.push(t);
  }

  if (businessItems.length >= 2 && businessTables.length > 0) {
    const orderTotal = businessItems[0].price + businessItems[3].price;
    await prisma.order.create({
      data: {
        tenantId: businessTenant.id,
        tableId: businessTables[6].id,
        type: "DINE_IN",
        status: "READY",
        orderNumber: 201,
        subtotal: orderTotal,
        total: orderTotal,
        preparingAt: new Date(Date.now() - 600000),
        readyAt: new Date(),
        items: {
          create: [
            {
              menuItemId: businessItems[0].id,
              name: businessItems[0].name,
              price: businessItems[0].price,
              quantity: 1,
              subtotal: businessItems[0].price,
              status: "READY",
            },
            {
              menuItemId: businessItems[3].id,
              name: businessItems[3].name,
              price: businessItems[3].price,
              quantity: 1,
              subtotal: businessItems[3].price,
              status: "READY",
            },
          ],
        },
      },
    });
  }

  // ─── 6. SYNC ANY EXISTING SUPABASE AUTH USERS MISSING FROM public.User ──────
  const authUsersRes = await pool.query<{
    id: string;
    email: string;
    raw_user_meta_data: { name?: string } | null;
  }>(`SELECT id, email, raw_user_meta_data FROM auth.users WHERE email IS NOT NULL`);

  for (const authUser of authUsersRes.rows) {
    const existingPublicUser = await prisma.user.findFirst({
      where: {
        OR: [{ id: authUser.id }, { email: authUser.email.toLowerCase() }],
      },
    });

    if (!existingPublicUser) {
      const displayName = (authUser.raw_user_meta_data?.name || authUser.email.split("@")[0] || "Mi Restaurante").trim();
      let candidateSlug = slugify(displayName) || "restaurante";
      const takenSlug = await prisma.tenant.findUnique({ where: { slug: candidateSlug }, select: { id: true } });
      if (takenSlug) {
        candidateSlug = `${candidateSlug}-${authUser.id.slice(0, 6)}`;
      }

      const restoredTenant = await prisma.tenant.create({
        data: {
          name: displayName,
          slug: candidateSlug,
          country: "CO",
          isMenuOnly: true,
          onboarding: true,
        },
      });

      await prisma.menu.create({
        data: { tenantId: restoredTenant.id, name: "Carta Principal" },
      });

      await prisma.user.create({
        data: {
          id: authUser.id,
          email: authUser.email.toLowerCase(),
          name: displayName,
          tenantId: restoredTenant.id,
          role: "OWNER",
        },
      });

      await prisma.subscription.create({
        data: {
          tenantId: restoredTenant.id,
          planId: starterPlan.id,
          status: "ACTIVE",
        },
      });

      console.log(`  [Restored Supabase Auth User] ${authUser.email} -> ${displayName} (/restaurant/${candidateSlug})`);
    }
  }

  console.log("Seed completado exitosamente (100% compatible con Supabase Auth):");
  console.log("  1. [STARTER]       La Parrilla de Don Carlos (/restaurant/don-carlos) -> starter@restro.dev / admin@restro.dev (restro123) [4/5 mesas, 4/5 productos]");
  console.log("  2. [CARTA_DIGITAL] Café & Bistro El Mirador  (/restaurant/el-mirador) -> carta@restro.dev    (restro123) [8 mesas, 22 productos ilimitados]");
  console.log("  3. [RESTRO_IA]     Trattoria Bella Napoli    (/restaurant/bella-napoli) -> ia@restro.dev     (restro123)");
  console.log("  4. [BUSINESS]      Grupo Gastronómico Imperial (/restaurant/imperial) -> business@restro.dev (restro123)");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
