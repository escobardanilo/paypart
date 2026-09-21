# PayPart

**Payment Operations Workspace**

PayPart is a portfolio implementation of a B2B workspace for coordinating payment-related operational work. It brings payment requests, approvals, transactions, exceptions, ownership, and activity history into one interface.

The current release uses realistic demo data. It does not connect to real bank accounts, initiate payments, modify balances, or claim live provider integrations.

## Product workflow

```text
Request → Review → Approval → Payment → Monitoring → Resolution
```

The workspace is designed around four questions:

- What is happening?
- Who owns it?
- What requires attention?
- What happens next?

## Core areas

| Route | Purpose |
| --- | --- |
| `/` | Public product homepage and demo entry point |
| `/dashboard` | Daily operations overview and priority queue |
| `/requests` | Payment request register and creation workflow |
| `/approvals` | Controlled human authorization workspace |
| `/transactions` | Read-only transaction ledger and payment detail |
| `/exceptions` | Operational queue for payments requiring attention |
| `/activity` | Workspace-wide audit history |

## Safety model

- The portfolio demo never moves money.
- Payment and approval actions are UI demonstrations only.
- Human authorization remains explicit.
- Server-side credentials are never exposed to the browser.
- Database access is isolated behind repository functions.
- Controlled tool execution validates inputs before calling an operation.
- Audit-friendly UI patterns keep actors, objects, ownership, and timestamps visible.

## Architecture

```text
Next.js App Router
├── Public product homepage
├── Payment Operations Workspace
├── Reusable client interaction components
├── Centralized realistic demo data
└── Server infrastructure
    ├── Supabase client and repositories
    ├── Safe diagnostics and retry handling
    ├── Zod environment validation
    └── Generic controlled-tool runtime
```

## Technology stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Zod
- Supabase
- PostgreSQL
- Groq SDK, retained as server-only infrastructure for future operations assistance

## Demo data

The workspace uses EUR as its primary currency and includes fictional counterparties such as Cloud Infrastructure Ltd., Northstar Software, Acme Logistics, Brightline Media, and Atlas Consulting.

Data shown in the main product routes is defined in `src/lib/demo-data.ts`. It is intentionally separated from the server infrastructure so the portfolio can demonstrate the product safely without modifying the existing database schema.

## Local development

Requirements: Node.js 22 or later and npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Server infrastructure expects these variables when its database or AI clients are used:

```dotenv
SUPABASE_URL=
SUPABASE_SECRET_KEY=
GROQ_API_KEY=
```

Never expose the secret key through a `NEXT_PUBLIC_` variable and never commit `.env.local`.

Quality checks:

```bash
npm run typecheck
npm run lint
npm run build
```

Open `http://localhost:3000` for the public homepage or `http://localhost:3000/dashboard` for the workspace.

## Current limitations

- Product records are demo data and are not persisted.
- Authentication, authorization roles, and multi-tenant isolation are not implemented.
- Form and decision interactions are session-level portfolio demonstrations.
- There are no real payment rails, bank accounts, provider APIs, or document uploads.
- Existing Supabase infrastructure is retained for future Payment Operations features without changing the current schema.

## Roadmap

- Persist payment requests and workspace activity.
- Add authentication and role-based approval authority.
- Introduce configurable approval rules and escalation policies.
- Connect sandbox payment-provider data behind read-only adapters.
- Add audit export and retention controls.
- Use controlled assistance to summarize context, explain exceptions, and suggest next actions while preserving human authorization.
