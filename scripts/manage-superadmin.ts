/**
 * Script de gestión de Super Administradores para Restro SaaS
 *
 * Uso:
 * 1. Listar superadmins:
 *    npx tsx -r dotenv/config scripts/manage-superadmin.ts list
 *
 * 2. Promover un usuario existente a Super Admin:
 *    npx tsx -r dotenv/config scripts/manage-superadmin.ts promote <email>
 *
 * 3. Crear un nuevo Super Admin:
 *    npx tsx -r dotenv/config scripts/manage-superadmin.ts create <email> <password> <nombre>
 */

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { randomUUID } from "crypto";

let connectionString = process.env.DATABASE_URL || "";
if (connectionString.includes("?pgbouncer=true")) {
  connectionString = connectionString.replace("?pgbouncer=true", "");
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function listSuperAdmins() {
  console.log("\n--- Super Administradores Registrados ---");
  const users = await prisma.user.findMany({
    where: { role: "SUPERADMIN" },
    include: { tenant: true },
  });

  if (users.length === 0) {
    console.log("No hay usuarios con rol SUPERADMIN en la base de datos.");
  } else {
    users.forEach((u) => {
      console.log(`• ${u.name} (${u.email}) — Tenant asignado: ${u.tenant.name} (${u.tenant.slug})`);
    });
  }

  const envEmails = process.env.SUPERADMIN_EMAILS;
  if (envEmails) {
    console.log(`\nEmails configurados en SUPERADMIN_EMAILS (.env): ${envEmails}`);
  }
}

async function promoteToSuperAdmin(email: string) {
  const normalized = email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({
    where: { email: normalized },
  });

  if (!existing) {
    console.error(`\n❌ Error: No se encontró ningún usuario con el correo "${normalized}".`);
    console.log("Usa 'create' para crear una cuenta nueva.");
    return;
  }

  await prisma.user.update({
    where: { email: normalized },
    data: { role: "SUPERADMIN" },
  });

  console.log(`\n✅ ¡Éxito! El usuario "${normalized}" ahora tiene rol SUPERADMIN.`);
}

async function createSuperAdmin(email: string, password: string, name: string) {
  const normalizedEmail = email.toLowerCase().trim();

  // 1. Ensure or find platform system tenant
  let systemTenant = await prisma.tenant.findFirst({
    where: { slug: "restro-platform" },
  });

  if (!systemTenant) {
    const starterPlan = await prisma.plan.findFirst();
    systemTenant = await prisma.tenant.create({
      data: {
        name: "Restro Platform HQ",
        slug: "restro-platform",
        country: "CO",
        isMenuOnly: true,
      },
    });

    if (starterPlan) {
      await prisma.subscription.create({
        data: {
          tenantId: systemTenant.id,
          planId: starterPlan.id,
          status: "ACTIVE",
        },
      });
    }
  }

  // 2. Ensure in Supabase Auth
  let userId: string;
  const existingAuth = await pool.query<{ id: string }>(
    `SELECT id FROM auth.users WHERE email = $1 LIMIT 1`,
    [normalizedEmail]
  );

  if (existingAuth.rows.length > 0) {
    userId = existingAuth.rows[0].id;
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
  } else {
    userId = randomUUID();
    const identityId = randomUUID();
    const rawMeta = JSON.stringify({ sub: userId, email: normalizedEmail, name, email_verified: true });

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
      [userId, normalizedEmail, password, rawMeta]
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
  }

  // 3. Upsert into public.User with SUPERADMIN role
  await prisma.user.upsert({
    where: { email: normalizedEmail },
    update: {
      id: userId,
      role: "SUPERADMIN",
      name,
    },
    create: {
      id: userId,
      email: normalizedEmail,
      name,
      tenantId: systemTenant.id,
      role: "SUPERADMIN",
    },
  });

  console.log(`\n✅ ¡Super Administrador creado exitosamente!`);
  console.log(`• Email: ${normalizedEmail}`);
  console.log(`• Nombre: ${name}`);
  console.log(`• Rol: SUPERADMIN`);
  console.log(`• Inicia sesión en /login y accede a la ruta ofuscada: /a/g/s`);
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0]?.toLowerCase() || "list";

  if (command === "list") {
    await listSuperAdmins();
  } else if (command === "promote") {
    const email = args[1];
    if (!email) {
      console.error("Debes especificar el email a promover: npx tsx scripts/manage-superadmin.ts promote <email>");
      process.exit(1);
    }
    await promoteToSuperAdmin(email);
  } else if (command === "create") {
    const email = args[1];
    const password = args[2];
    const name = args[3] || "Super Administrador";
    if (!email || !password) {
      console.error("Uso: npx tsx scripts/manage-superadmin.ts create <email> <password> [nombre]");
      process.exit(1);
    }
    await createSuperAdmin(email, password, name);
  } else {
    console.log("Comandos disponibles: list | promote <email> | create <email> <password> [nombre]");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
