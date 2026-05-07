---
layout: home

hero:
  name: "Sim-Pesa"
  tagline: "M-Pesa on localhost. Finally."
  text: "Stop fighting the Daraja sandbox. Run a complete, stateful M-Pesa STK Push simulator in 60 seconds -- locally, for free, forever."
  actions:
    - theme: brand
      text: "Get Started ->"
      link: /guide/quickstart
    - theme: alt
      text: "View on GitHub"
      link: https://github.com/paul-murithi/simpesa

features:
  - title: Zero sandbox downtime
    details: "Error 1037? Error 9999? Gone. Sim-Pesa runs on your machine. No Safaricom dependency, no rate limits, no waiting for their infra to recover."

  - title: Transactionally correct
    details: "PostgreSQL row-level locking, ACID-compliant balance updates, and idempotent transaction IDs -- the same guarantees you'd demand in production."

  - title: Virtual Smartphone UI
    details: "Manually approve or cancel STK Push prompts via a real browser UI. Test PIN errors, cancellations, and timeout paths without any physical phone."

  - title: Full async event loop
    details: "BullMQ-backed worker queue, exponential backoff retries, webhook dispatch -- the complete M-Pesa callback flow, running 100% locally."

  - title: One command to run everything
    details: "`docker compose up -d` starts the API, worker, Postgres, Redis, and dashboard. The First Run wizard handles everything else."

  - title: Chaos testing built in
    details: "Toggle Auto-Approve for load testing, inject balance constraints, simulate locked subscribers, or force error codes -- all from the dashboard."
---

## Why Sim-Pesa exists

Every M-Pesa integration in East Africa flows through Safaricom's Daraja sandbox. And every developer building on Daraja has lost hours -- sometimes days -- to this:

```
{ "ResponseCode": "1", "ResponseDescription": "DS Timeout" }
```

Error 1037 (DS Timeout). Error 9999 (General Error). Error 1001 (Subscriber Locked). These aren't edge cases. They're the Daraja sandbox on a bad day.

Sim-Pesa is a local-first, containerized drop-in replacement for the Daraja sandbox. The same HTTP interface. Zero external dependencies. 100% deterministic.

---

## 60-second quickstart

The fastest way to trigger your first simulated STK Push is via the Dashboard:

1.  Open [http://localhost:5173](http://localhost:5173) and complete the 5-second setup wizard.
2.  In the **Initiate STK Push** panel, enter an amount and click **Send Request**.
3.  Watch the transaction appear in the live feed.
4.  Approve it on the **Virtual Smartphone**.

### Using curl (Optional)

If you prefer using the command line, first copy your **Bearer Token** from the dashboard top bar, then run:

```bash
curl -X POST http://localhost:3000/stkpush/v1/processrequest \
-H "Authorization: Bearer <your-token>" \
-H "Content-Type: application/json" \
-d '{
  "short_code": "174379",
  "phone_number": "254700000000",
  "amount": 10,
  "external_reference": "SIMPESA_TEST"
}'
```

---

## What you're actually running

Sim-Pesa isn't a mock server with hardcoded responses. It's a full transactional state machine with five coordinated services:

| Service | Stack | What it does |
|---|---|---|
| Ingestion API | Node.js + TypeScript | Receives STK Push requests, validates, enqueues |
| Worker | Node.js + TypeScript | Processes jobs, locks rows, updates balances |
| Database | PostgreSQL 16 | Source of truth -- merchants, users, transactions |
| Queue | Redis + BullMQ | Job lifecycle, retry management, backpressure |
| Dashboard | React + Vanilla CSS | Virtual Smartphone, transaction monitor, wizard |

Every balance update uses `SELECT ... FOR UPDATE` to prevent double-spending under concurrency. Every webhook uses exponential backoff. Every transaction is immutably logged with its full request/response payload.

Sim-Pesa is a high-fidelity simulation environment built for mission-critical developer workflows.

---

## Designed for real workflows

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; margin-top: 2rem;">

<div style="padding: 1.5rem; border: 1px solid var(--vp-c-bg-soft); border-radius: 8px; background: var(--vp-c-bg-soft);">
<h3>Hackathons</h3>
<p>Skip sandbox registration. Ship M-Pesa integrations in your first hour without waiting for credentials.</p>
</div>

<div style="padding: 1.5rem; border: 1px solid var(--vp-c-bg-soft); border-radius: 8px; background: var(--vp-c-bg-soft);">
<h3>Integration Testing</h3>
<p>Write deterministic test suites against stable, controlled state. No non-deterministic Daraja failures.</p>
</div>

<div style="padding: 1.5rem; border: 1px solid var(--vp-c-bg-soft); border-radius: 8px; background: var(--vp-c-bg-soft);">
<h3>Onboarding</h3>
<p>New engineers test the full payment flow safely without touching production or shared sandbox accounts.</p>
</div>

<div style="padding: 1.5rem; border: 1px solid var(--vp-c-bg-soft); border-radius: 8px; background: var(--vp-c-bg-soft);">
<h3>Demos</h3>
<p>Show a live STK Push flow that works every single time, even offline, for consistent sales or technical demos.</p>
</div>

</div>

---

## The error codes Sim-Pesa eliminates

| Daraja Error | What it means | Sim-Pesa |
|---|---|---|
| 1037 | DS Timeout -- PIN entry not submitted in time | Configurable timeout path |
| 1001 | Subscriber Locked -- concurrent USSD/STK session | Controlled via state machine |
| 9999 | System Error -- Safaricom's catch-all failure | Deterministic by design |
| 2001 | Invalid PIN | Testable via Virtual Smartphone |
| 1 | Insufficient Funds | Configurable via dashboard |

---

## Open source. No strings.

Sim-Pesa is MIT licensed. No API keys. No rate limits. No cloud account. Run it, fork it, extend it, ship it.

[Read the architecture ->](/architecture/index) | [API reference ->](/api/index) | [GitHub ->](https://github.com/paul-murithi/simpesa)

