# PayPart

**AI Payment Operations Investigation Agent**

PayPart is a payment-operations investigation system built around a controlled tool-using AI agent.

A user can describe a payment incident in natural language. The agent determines which financial tools are relevant, retrieves supporting data, evaluates the evidence, diagnoses the issue, and decides whether a controlled follow-up action is necessary.

The current Core release runs on a simulated fintech environment containing accounts, transactions, customers and suppliers, invoices, payment attempts, provider error codes, investigations, and action requests. It does not connect to real bank accounts or move real money.

> **The agent selects the investigation path. Software controls what is allowed.**

## What PayPart does

PayPart can investigate:

- transactions;
- account balances;
- customers or suppliers;
- related invoices;
- payment attempts;
- duplicate-payment risk;
- provider error codes.

When the evidence supports follow-up, the agent can create a pending approval request or support ticket and verify that the action record exists. It can also conclude that no operational action is required.

PayPart cannot move money, retry payments, modify balances, approve financial actions, contact a provider, or access the database outside its controlled tools.

## How the agent works

1. The operator submits an incident description and, when available, a transaction reference.
2. The server creates an investigation and asks the model to select the next relevant tool.
3. Zod validates every tool name and argument against a strict schema.
4. The executor verifies that database UUIDs came from earlier trusted tool results.
5. Repository functions retrieve only the data required by the selected tool.
6. Calls, results, malformed-call recovery, actions, diagnosis, and completion are written to `investigation_events`.
7. The agent stops when it has sufficient evidence and returns a structured report. Tools are optional, not a fixed workflow.

PayPart uses direct Groq tool/function calling. It does not use LangChain or LangGraph.

## Agent tools

| Tool | Purpose |
| --- | --- |
| `get_transaction` | Find a transaction from an external reference such as `PAY-1001`. |
| `get_account` | Retrieve the related account and recorded balance/status. |
| `get_party` | Retrieve the related customer or supplier. |
| `get_invoice` | Retrieve a related invoice when an invoice ID exists. |
| `get_payment_attempts` | List payment attempts for a transaction. |
| `check_duplicate_transactions` | Check for transactions with matching payment characteristics. |
| `get_provider_error` | Retrieve the provider-authored meaning of a non-null error code. |
| `create_support_ticket` | Create a pending technical support action when evidence justifies it. |
| `create_approval_request` | Create a pending human approval action for a controlled financial decision. |
| `verify_action_request` | Verify that an action created by the current investigation exists. |

Creation tools only write pending workflow records. They never execute a payment or approve an action.

## Example investigations

### Failed payment — PAY-1001

```text
Investigate why PAY-1001 failed and tell me what should happen next.
```

The agent can inspect the failed transaction, account context, payment attempts, provider error, and duplicate risk before recommending a controlled next step.

### Successful payment — PAY-1002

```text
Review PAY-1002 and confirm whether anything requires follow-up.
```

For a completed payment with successful evidence and no provider error, the agent can conclude that no operational follow-up is required without creating an action.

Guided versions of these cases are available directly on `/investigate`.

## Architecture

```text
Browser
  -> POST /api/investigations (streamed NDJSON progress)
     -> controlled agent loop
        -> strict Zod tool schemas
           -> trusted-ID and safety checks
              -> repository functions
                 -> Supabase / PostgreSQL
        -> investigation_events audit trail
        -> structured final report
```

```text
src/
├── app/          Next.js routes and investigation API
├── components/   application shell, workbench, charts, and UI components
└── lib/
    ├── agent/    orchestration loop, final-report contract, and safety prompt
    ├── ai/       server-only Groq client
    ├── database/ server-only Supabase client, repositories, and types
    ├── tools/    model-facing definitions and controlled executor
    └── validation/ environment, request, and tool-input schemas
```

## Safety model

- Database access is server-only and limited to named repository functions.
- Tool inputs use strict schemas; additional properties are rejected.
- Database IDs must be UUIDs returned by trusted earlier tool results.
- Null or missing related IDs and error codes are never fabricated.
- Inapplicable tools are removed from the model's available tool set.
- Malformed tool calls are audited and receive at most one controlled correction attempt.
- Support tickets and approval requests remain pending for human review.
- An investigation may finish successfully without creating an action.
- Every investigation step remains visible through the persisted event timeline.

## Technology stack

- Next.js 16 with App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Groq SDK with `openai/gpt-oss-120b`
- Zod
- Supabase
- PostgreSQL

## Product routes

| Route | Purpose |
| --- | --- |
| `/dashboard` | Operational overview, payment status, activity, and pending actions. |
| `/investigate` | Natural-language investigation workbench and guided examples. |
| `/investigations` | Investigation history. |
| `/investigations/[id]` | Diagnosis, transaction context, actions, and chronological audit timeline. |
| `/transactions` | Read-only simulated transaction ledger. |
| `/actions` | Pending approval requests and support tickets. |

The root route redirects to `/dashboard`.

## Current limitations

- The dataset and provider behavior are simulated for the Core release.
- The application assumes an existing compatible Supabase schema and seeded sample data.
- Authentication, authorization roles, and multi-tenant isolation are not implemented.
- Action requests are workflow records only; there are no downstream ticketing or approval-system integrations.
- The agent uses one configured model and provider rather than a model-routing or fallback layer.
- The project is not connected to real payment rails, bank accounts, or provider APIs.

## Local development

Requirements: Node.js 22 or later, npm, an existing PayPart Supabase environment, and a Groq API key.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Configure `.env.local` with:

```dotenv
SUPABASE_URL=
SUPABASE_SECRET_KEY=
GROQ_API_KEY=
```

Environment variables are read only by server modules. Never expose `SUPABASE_SECRET_KEY` through a `NEXT_PUBLIC_` variable and never commit `.env.local`.

Quality checks:

```bash
npm run typecheck
npm run lint
npm run build
```

Open `http://localhost:3000/investigate` to run a guided sample investigation.

## Roadmap

- Add authentication and role-based authorization.
- Add automated agent-contract and scenario evaluations.
- Add provider/model resilience and observability.
- Integrate external support and approval workflows behind the same controlled-action boundary.
- Add production-grade tenancy, retention, and audit export controls.
- Replace simulated data with sandbox integrations before considering any production payment environment.
