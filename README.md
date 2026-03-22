# Hostito

> Open source web hosting billing & management system — built with NestJS and PostgreSQL (via Prisma).

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Made by Webito](https://img.shields.io/badge/made%20by-Webito-black)](https://webito.io)
[![Sponsor](https://img.shields.io/badge/Sponsor-webito--io-ff69b4)](https://github.com/sponsors/webito-io)

---

## What is Hostito?

Hostito is a free, open source alternative to WHMCS — built for the modern web.

No PHP. No expensive licenses. No ugly interfaces.

Just a clean, developer-friendly billing and client management system for hosting providers, built with a modern JavaScript stack.

---

## Features

- **Billing & Invoicing** — automated invoice generation, due date reminders.
- **Client Management** — admin panel, client portal, reseller support.
- **Product & Plan Management** — hosting plans, domains, VPS, licenses.
- **Domain Management** — real-time sync with registrars, async nameserver management, locking, and privacy control.
- **Payment Gateways** — Stripe, PayPal, crypto, manual payments.
- **Server Provisioners** — DirectAdmin and cPanel integration with automated account provisioning.
- **Async Processing** — robust background jobs with BullMQ (Redis) for registrar and server actions.
- **Audit Logging** — full tracking of administrative and management actions.
- **Notifications** — email and SMS support.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, NestJS |
| Async | BullMQ (Redis), EventEmitter |
| Database | PostgreSQL, Prisma |
| Auth | JWT (Passport, @nestjs/jwt) |
| API Docs | Swagger / Scalar |

---

## Getting Started

```bash
# Clone the repo
git clone https://github.com/webito-io/hostito-core.git
cd hostito-core

# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Generate Prisma client & run initial migrations
npm run prepare

# Start development server
npm run start:dev
```

---

## Project Structure

```
hostito-core/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── modules/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── roles/
│   │   ├── organizations/
│   │   ├── products/
│   │   ├── orders/
│   │   ├── invoices/
│   │   ├── payment-gateways/            # Factory -> Provider pattern
│   │   ├── provisioners/                # cPanel, DirectAdmin, etc.
│   │   ├── domains/                     # Registrar sync & management
│   │   ├── services/                    # Managed hosting services
│   │   ├── audit-logs/                  # Management audit trail
│   │   ├── notifications/               # Email/SMS handler
│   │   ├── notification-templates/
│   │   └── settings/
│   └── common/                          # Guards, Decorators, DTOs
├── prisma/                              # DB Schema & Migrations
└── test/                                # Jest E2E & Unit tests
```


## API Reference

- **Interactive Docs**: http://localhost:3000/api
- **Auth**: Bearer JWT
- **Engine**: @nestjs/swagger + @scalar/nestjs-api-reference

---

## Roadmap

- [x] Auth & ACL
- [x] Billing & Invoices
- [x] Payment Gateways (Stripe)
- [x] **Domain Management (Sync & Async Actions)**
- [x] **Server Provisioners (DirectAdmin/cPanel)**
- [x] **Audit Logs**
- [x] Multi-currency

---

## Environment Variables

Set these in your `.env`:

- `DATABASE_URL` — Postgres connection string
- `REDIS_HOST_URL` — Redis connection string (e.g. `redis://localhost:6379`)
- `PORT` — server port (default: 3000)
- `JWT_SECRET` — secret for JWT tokens
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_FROM` — SMTP settings

---

## Contributing

Hostito is built by the community, for the community. All contributions are welcome.

1. Fork the repository
2. Create a new branch — `git checkout -b feature/your-feature`
3. Make your changes & write tests
4. Open a Pull Request

---

## License

MIT — free to use, modify, and distribute.
