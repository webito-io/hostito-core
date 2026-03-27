import { PrismaClient } from "@prisma/client";
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';

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
    'services',
    'notifications',
    'settings',
    'notification-templates',
    'domains',
    'audit-logs',
    'announcements',
    'categories',
    'provisioners',
    'payments',
    'carts',
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

  const superadmin = await prisma.role.upsert({
    where: { name: 'SuperAdmin' },
    update: {},
    create: {
      name: 'SuperAdmin',
      permissions: { connect: adminPerms.map((p) => ({ id: p.id })) },
    },
  });

  const userrole = await prisma.role.upsert({
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

  // --- 8. Notification Providers ---
  const notificationProviders = [
    {
      name: 'smtp',
      config: {
        host: 'smtp.example.com',
        port: 587,
        user: 'user@example.com',
        password: 'your-password',
        from: 'noreply@example.com',
      },
    },
  ];

  for (const provider of notificationProviders) {
    await prisma.notificationProvider.upsert({
      where: { name: provider.name },
      update: {},
      create: {
        name: provider.name,
        isActive: true,
        config: provider.config,
      },
    });
  }

  // --- 9. Provisioners ---
  const provisioners = [
    {
      name: 'cpanel',
      config: {
        apiVersion: '1',
        port: 2087,
        protocol: 'https',
        endpoint: '/json-api/',
        authHeader: 'whm',
        description: 'cPanel/WHM hosting control panel provisioner',
      },
    },
    {
      name: 'directadmin',
      config: {
        port: 2222,
        protocol: 'https',
        endpoint: '/api/',
        description: 'DirectAdmin hosting control panel provisioner',
      },
    },
  ];

  for (const provisioner of provisioners) {
    await prisma.provisioner.upsert({
      where: { name: provisioner.name },
      update: {},
      create: {
        name: provisioner.name,
        isActive: true,
        config: provisioner.config,
      },
    });
  }

  // --- 10. Registrars ---
  const registrars = [
    {
      name: 'spaceship',
      config: {
        baseUrl: 'https://spaceship.dev/api/v1',
        apiKey: '',
        apiSecret: '',
      },
    },
  ];

  for (const registrar of registrars) {
    await prisma.registrar.upsert({
      where: { name: registrar.name },
      update: {},
      create: {
        name: registrar.name,
        isActive: false,
        config: registrar.config,
      },
    });
  }

  // --- 11. Notification Templates ---
  const notificationTemplates = [
    {
      name: 'verify_email',
      subject: 'Verify your email address',
      body: `<p>Hi,</p>
<p>Thank you for registering. Please use the verification code below to confirm your email address:</p>
<h2 style="letter-spacing: 4px;">{{data.verificationToken}}</h2>
<p>This code is valid for a limited time. If you did not create an account, you can safely ignore this email.</p>
<p>Thanks,<br/>The ${process.env.Brand} Team</p>`,
    },
    {
      name: 'reset_password',
      subject: 'Reset your password',
      body: `<p>Hi,</p>
<p>We received a request to reset your password. Click the link below to set a new password:</p>
<p><a href="{{data.token}}">Reset Password</a></p>
<p>This link will expire in 1 hour. If you did not request a password reset, you can safely ignore this email.</p>
<p>Thanks,<br/>The ${process.env.Brand} Team</p>`,
    },
    {
      name: 'welcome',
      subject: `Welcome to ${process.env.Brand}`,
      body: `<p>Hi {{data.firstName}},</p>
<p>Your email has been verified and your account is now active. Welcome aboard!</p>
<p>You can now log in and start managing your services.</p>
<p>Thanks,<br/>The ${process.env.Brand} Team</p>`,
    },
  ];

  for (const template of notificationTemplates) {
    await prisma.notificationTemplate.upsert({
      where: { name: template.name },
      update: {},
      create: template,
    });
  }

  // --- 12. Settings ---
  const defaultSettings: any[] = [
    { key: 'site_name', value: process.env.Brand, isPublic: true },
    { key: 'maintenance_mode', value: 'false', isPublic: true },
    { key: 'support_email', value: 'support@webito.io', isPublic: true },
    { key: 'notification_drivers', value: { email: 'smtp', sms: 'twilio' }, isPublic: false },
    { key: 'admin_roles', value: [superadmin.id], isPublic: true }, // the roles have access to admin dashboard
    { key: 'default_role', value: userrole.id, isPublic: false }, // default_role
  ];

  for (const setting of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  // --- 13. Sample Taxes ---
  await prisma.tax.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'VAT',
      rate: 10,
      isActive: true,
    },
  });

  await prisma.tax.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: 'EU VAT',
      rate: 20,
      country: 'DE',
      isActive: true,
    },
  });

  // --- 14. Sample Category ---
  const hostingCategory = await prisma.category.upsert({
    where: { slug: 'shared-hosting' },
    update: {},
    create: {
      name: 'Shared Hosting',
      slug: 'shared-hosting',
      description: 'Shared web hosting plans',
    },
  });

  // --- 14. Sample Server ---
  const cpanelProvisioner = await prisma.provisioner.findUnique({
    where: { name: 'cpanel' },
  });

  let sampleServer: any = null;
  if (cpanelProvisioner) {
    sampleServer = await prisma.server.upsert({
      where: { id: 1 },
      update: {},
      create: {
        name: 'Web Server 1',
        hostname: 'srv1.example.com',
        ip: '192.168.1.1',
        port: 2087,
        credentials: {
          username: 'root',
          apiToken: 'your-whm-api-token-here',
        },
        isActive: true,
        maxAccounts: 200,
        provisionerId: cpanelProvisioner.id,
      },
    });
  }

  // --- 15. Sample Products ---
  const starterHosting = await prisma.product.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Starter Hosting',
      description: 'Perfect for small websites and blogs',
      type: 'SERVICE',
      currencyId: currency.id,
      categoryId: hostingCategory.id,
      serverId: sampleServer?.id ?? null,
      config: { package: 'starter', maxEmails: 5 },
      isActive: true,
      variants: {
        create: [
          { action: 'RECURRING', cycle: 'MONTHLY', price: 4.99 },
          { action: 'RECURRING', cycle: 'ANNUAL', price: 49.99 },
          { action: 'SETUP', cycle: 'ONETIME', price: 2.99 },
        ],
      },
    },
  });

  const proHosting = await prisma.product.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: 'Pro Hosting',
      description: 'For growing businesses and high-traffic sites',
      type: 'SERVICE',
      currencyId: currency.id,
      categoryId: hostingCategory.id,
      serverId: sampleServer?.id ?? null,
      config: { package: 'pro', maxEmails: 50 },
      isActive: true,
      variants: {
        create: [
          { action: 'RECURRING', cycle: 'MONTHLY', price: 12.99 },
          { action: 'RECURRING', cycle: 'ANNUAL', price: 129.99 },
          { action: 'SETUP', cycle: 'ONETIME', price: 0 },
        ],
      },
    },
  });

  // --- 16. Sample Domain Products ---
  const comDomain = await prisma.product.upsert({
    where: { id: 3 },
    update: {},
    create: {
      name: '.com Domain',
      type: 'DOMAIN',
      tld: '.com',
      currencyId: currency.id,
      isActive: true,
      variants: {
        create: [
          { action: 'REGISTER', cycle: 'ANNUAL', price: 11.99 },
          { action: 'RENEW', cycle: 'ANNUAL', price: 13.99 },
          { action: 'TRANSFER', cycle: 'ONETIME', price: 11.99 },
        ],
      },
    },
  });

  const netDomain = await prisma.product.upsert({
    where: { id: 4 },
    update: {},
    create: {
      name: '.net Domain',
      type: 'DOMAIN',
      tld: '.net',
      currencyId: currency.id,
      isActive: true,
      variants: {
        create: [
          { action: 'REGISTER', cycle: 'ANNUAL', price: 13.99 },
          { action: 'RENEW', cycle: 'ANNUAL', price: 15.99 },
          { action: 'TRANSFER', cycle: 'ONETIME', price: 13.99 },
        ],
      },
    },
  });

  const orgDomain = await prisma.product.upsert({
    where: { id: 5 },
    update: {},
    create: {
      name: '.org Domain',
      type: 'DOMAIN',
      tld: '.org',
      currencyId: currency.id,
      isActive: true,
      variants: {
        create: [
          { action: 'REGISTER', cycle: 'ANNUAL', price: 9.99 },
          { action: 'RENEW', cycle: 'ANNUAL', price: 12.99 },
          { action: 'TRANSFER', cycle: 'ONETIME', price: 9.99 },
        ],
      },
    },
  });

  // --- 17. Sample Coupons ---
  await prisma.coupon.upsert({
    where: { code: 'WELCOME20' },
    update: {},
    create: {
      code: 'WELCOME20',
      type: 'PERCENTAGE',
      value: 20,
      maxUses: 100,
      isActive: true,
      expiresAt: new Date('2027-12-31'),
    },
  });

  await prisma.coupon.upsert({
    where: { code: 'FLAT5' },
    update: {},
    create: {
      code: 'FLAT5',
      type: 'FIXED',
      value: 5,
      currencyId: currency.id,
      maxUses: 50,
      isActive: true,
      expiresAt: new Date('2027-12-31'),
    },
  });

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
