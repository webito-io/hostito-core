import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL env var is missing.');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString,
  }),
});

async function main() {
  const resources = [
    'users',
    'roles',
    'organizations',
    'payment-gateways',
    'taxes',
    'currencies',
    'permissions',
    'products',
    'orders',
    'invoices',
    'servers',
    'payments',
    'notifications',
    'settings',
    'email-templates',
    'domains',
    'audit-logs',
    'announcements'
  ];

  for (const resource of resources) {
    for (const [action, scope] of [
      ['create', 'all'],
      ['read', 'all'],
      ['update', 'all'],
      ['delete', 'all'],
      ['create', 'own'],
      ['read', 'own'],
      ['update', 'own'],
      ['delete', 'own'],
    ]) {
      await prisma.permission.upsert({
        where: { resource_action_scope: { resource, action, scope } },
        update: {},
        create: { resource, action, scope },
      });
    }
  }

  const adminPerms = await prisma.permission.findMany({
    where: { scope: 'all' },
  });
  const userPerms = await prisma.permission.findMany({
    where: { scope: 'own' },
  });

  await prisma.role.upsert({
    where: { id: 10 },
    update: {},
    create: {
      id: 10,
      name: 'SuperAdmin',
      permissions: { connect: adminPerms.map((p) => ({ id: p.id })) },
    },
  });

  await prisma.role.upsert({
    where: { id: 100 },
    update: {},
    create: {
      id: 100,
      name: 'User',
      permissions: { connect: userPerms.map((p) => ({ id: p.id })) },
    },
  });

  const providers = ['stripe', 'paypal', 'crypto'];
  for (const name of providers) {
    await prisma.paymentGateway.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const defaultSettings = [
    { key: 'site_name', value: 'Hostito', isPublic: true },
    { key: 'maintenance_mode', value: 'false', isPublic: true },
    { key: 'support_email', value: 'support@webito.io', isPublic: true },
  ];

  for (const setting of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
