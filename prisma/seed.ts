/**
 * Prisma Seed — Restro Dev Data
 * Run: npx prisma db seed
 */

import { PrismaClient } from "../generated/prisma/client";
import { createHash } from "crypto";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

let connectionString = `${process.env.DATABASE_URL}`;
if (connectionString.includes("?pgbouncer=true")) {
  connectionString = connectionString.replace("?pgbouncer=true", "");
}
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

async function main() {
  console.log("Seeding Restro dev database...");

  // Cleanup
  await prisma.orderStatusHistory.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.table.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.category.deleteMany();
  await prisma.menu.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();

  // Tenant: Restaurante Demo (Starter / Free Plan)
  const tenant = await prisma.tenant.create({
    data: {
      name: "La Parrilla de Don Carlos",
      slug: "don-carlos",
      description: "Los mejores cortes de carne de Bogotá, desde 1985",
      phone: "+57 310 555 0000",
      address: "Calle 93 # 15-40, Chapinero",
      city: "Bogotá",
      brandColor: "#2563EB",
      plan: "STARTER", // Starter Free plan to show free tier promo footer
    },
  });

  console.log(`Tenant: ${tenant.name} (slug: ${tenant.slug})`);

  // Owner User
  await prisma.user.create({
    data: {
      email: "admin@restro.dev",
      name: "Carlos Gómez",
      passwordHash: hashPassword("restro123"),
      tenantId: tenant.id,
      role: "OWNER",
    },
  });

  // Subscription
  await prisma.subscription.create({
    data: {
      tenantId: tenant.id,
      plan: "STARTER",
      status: "ACTIVE",
    },
  });

  // Menu
  const menu = await prisma.menu.create({
    data: { tenantId: tenant.id, name: "Carta Principal" },
  });

  // Categories & Items
  const entradasCat = await prisma.category.create({
    data: { menuId: menu.id, name: "Entradas", sortOrder: 0 },
  });

  const carnesCat = await prisma.category.create({
    data: { menuId: menu.id, name: "Carnes a la Parrilla", sortOrder: 1 },
  });

  const bebidasCat = await prisma.category.create({
    data: { menuId: menu.id, name: "Bebidas", sortOrder: 2 },
  });

  const postresCat = await prisma.category.create({
    data: { menuId: menu.id, name: "Postres", sortOrder: 3 },
  });

  // Entradas
  const entradas = [
    { name: "Patacones con hogao", price: 18000, description: "Plátano verde frito con salsa de tomate y cebolla" },
    { name: "Chorizo santafereño", price: 22000, description: "Chorizo artesanal a la parrilla con ají y arepa" },
    { name: "Deditos de queso", price: 16000, description: "5 unidades con salsa de ajo y perejil" },
    { name: "Ensalada fresca", price: 14000, description: "Lechuga, tomate, pepino, zanahoria y aderezo de la casa" },
  ];

  for (let i = 0; i < entradas.length; i++) {
    await prisma.menuItem.create({
      data: { categoryId: entradasCat.id, ...entradas[i], sortOrder: i },
    });
  }

  // Carnes
  const carnes = [
    { name: "Churrasco 300g", price: 68000, description: "Corte premium madurado 21 días, con papas rústicas", isHighlighted: true },
    { name: "Lomo al trapo", price: 75000, description: "Tradición colombiana, envuelto en sal y brasa", isHighlighted: true },
    { name: "Punta de anca 250g", price: 62000, description: "Jugosa y tierna, con chimichurri casero" },
    { name: "Costilla BBQ", price: 55000, description: "Media parrilla de costilla con salsa BBQ de guayaba" },
    { name: "Combo parrillada (2 personas)", price: 120000, description: "Churrasco, costilla, chorizo, morcilla y acompañamientos" },
  ];

  for (let i = 0; i < carnes.length; i++) {
    await prisma.menuItem.create({
      data: { categoryId: carnesCat.id, ...carnes[i], sortOrder: i },
    });
  }

  // Bebidas
  const bebidas = [
    { name: "Limonada de coco", price: 12000, description: "Con leche de coco y hielo" },
    { name: "Jugo natural", price: 10000, description: "Maracuyá, lulo, mora o mango" },
    { name: "Gaseosa", price: 6000, description: "Coca-Cola, Sprite o Agua" },
    { name: "Cerveza artesanal", price: 16000, description: "Rubia o roja, 330ml" },
    { name: "Agua mineral 500ml", price: 5000 },
  ];

  for (let i = 0; i < bebidas.length; i++) {
    await prisma.menuItem.create({
      data: { categoryId: bebidasCat.id, ...bebidas[i], sortOrder: i },
    });
  }

  // Postres
  const postres = [
    { name: "Tres leches casero", price: 16000, description: "Receta de la abuela" },
    { name: "Mousse de maracuyá", price: 14000 },
    { name: "Brownie con helado", price: 18000, description: "Brownie caliente con helado de vainilla" },
  ];

  for (let i = 0; i < postres.length; i++) {
    await prisma.menuItem.create({
      data: { categoryId: postresCat.id, ...postres[i], sortOrder: i },
    });
  }

  // Tables
  const tableNames = [
    { name: "Mesa 1", capacity: 4 },
    { name: "Mesa 2", capacity: 4 },
    { name: "Mesa 3", capacity: 6 },
    { name: "Mesa 4", capacity: 2 },
    { name: "Mesa 5", capacity: 8 },
  ];

  for (let i = 0; i < tableNames.length; i++) {
    await prisma.table.create({
      data: { tenantId: tenant.id, ...tableNames[i], sortOrder: i },
    });
  }

  console.log("Seed completado exitosamente (Don Carlos en Starter Plan)");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
