import { PrismaClient } from "@prisma/client";
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

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
    'coupons',
    'payments',
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
    'notification-templates',
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
    where: { name: 'SuperAdmin' },
    update: {},
    create: {
      name: 'SuperAdmin',
      permissions: { connect: adminPerms.map((p) => ({ id: p.id })) },
    },
  });

  await prisma.role.upsert({
    where: { name: 'User' },
    update: {},
    create: {
      name: 'User',
      permissions: { connect: userPerms.map((p) => ({ id: p.id })) },
    },
  });

  // --- 4. Currencies ---
  const currency = await prisma.currency.upsert({
    where: { code: 'USD' },
    update: {},
    create: {
      code: 'USD',
      name: 'US Dollar',
      symbol: '$',
      rate: 1.0,
      isDefault: true,
    },
  });

  // --- 5. Organizations ---
  const orgName = 'Default Organization';
  let org = await prisma.organization.findFirst({
    where: { name: orgName },
  });

  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: orgName,
        currencyId: currency.id,
      },
    });
  }

  // --- 6. Super Admin User ---
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (adminEmail && adminPassword) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: {},
      create: {
        email: adminEmail,
        password: hashedPassword,
        firstName: 'Super',
        lastName: 'Admin',
        role: { connect: { name: 'SuperAdmin' } },
        organization: { connect: { id: org.id } },
        status: 'ACTIVE',
        emailVerified: true,
      },
    });
  }

  // --- 7. Payment Gateways ---
  const gateways = [
    {
      name: 'stripe',
      config: {
        publicKey: 'pk_test_...',
        secretKey: 'sk_test_...',
        webhookSecret: 'whsec_...',
      },
    },
    {
      name: 'paypal',
      config: {
        clientId: '...',
        clientSecret: '...',
        mode: 'sandbox',
      },
    },
    {
      name: 'crypto',
      config: {
        apiKey: '...',
        merchantId: '...',
      },
    },
  ];

  for (const gateway of gateways) {
    await prisma.paymentGateway.upsert({
      where: { name: gateway.name },
      update: {},
      create: {
        name: gateway.name,
        isActive: true,
        config: gateway.config,
      },
    });
  }

  // --- 8. Settings ---
  const defaultSettings: any[] = [
    { key: 'site_name', value: 'Hostito', isPublic: true },
    { key: 'maintenance_mode', value: 'false', isPublic: true },
    { key: 'support_email', value: 'support@webito.io', isPublic: true },
    { key: 'notification_drivers', value: { email: 'smtp', sms: 'twilio' }, isPublic: false },
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
