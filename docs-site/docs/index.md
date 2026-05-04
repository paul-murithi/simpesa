---
layout: home

hero:
  name: Sim-Pesa
  text: "Test M-Pesa integrations locally — no Daraja sandbox required."
  tagline: Simulate STK Push flows, callbacks, failures, and edge cases in seconds using a fully local environment.
  actions:
    - theme: brand
      text: Get Started (5 min)
      link: /guide/developer
    - theme: alt
      text: View on GitHub
      link: https://github.com/paul-murithi/simpesa

features:
  - title: ⚡ Instant STK Push Simulation
    details: Trigger transactions and see them appear on your dashboard instantly. No sandbox delays.
  - title: 🔁 Realistic Async Callbacks
    details: Mimics Daraja's webhook behavior with reliable delivery and exponential backoff.
  - title: 💥 Simulate Failures
    details: Easily test edge cases like insufficient balance, user cancellations, and timeouts.
  - title: 🧠 Full Lifecycle Visibility
    details: Understand every step of the transaction from ingestion to final callback.
  - title: 📴 Works Fully Offline
    details: No internet? No problem. Sim-Pesa runs entirely on your local machine.
  - title: 🔒 Idempotency Built-in
    details: Redis-based fingerprinting protects against duplicate requests, just like production.
---

## Building with Safaricom Daraja can be frustrating...
*   **Sandbox Downtime:** Tests failing because the sandbox is down again?
*   **Unclear Docs:** Struggling to understand why a callback didn't arrive?
*   **Slow Feedback Loops:** Waiting for SMS that never comes?
*   **Unpredictable Callbacks:** Sandbox callbacks can be flaky and slow.

### Sim-Pesa fixes that.
It's built to solve the real Daraja frustrations developers experience firsthand. Whether you're a beginner learning M-Pesa or a team prototyping complex payment flows, Sim-Pesa provides a stable, predictable, and fast environment to build with confidence.

---

## How it Works
Sim-Pesa mimics the real-world M-Pesa flow so you can test reliably.

1.  **Your App** sends an STK Push request to the **Sim-Pesa API**.
2.  The API enqueues the request in a **BullMQ (Redis)** queue.
3.  A **Background Worker** picks up the job and waits for user interaction.
4.  You interact with the **Virtual Smartphone UI** (Enter PIN/Cancel).
5.  The Worker finalizes the transaction and enqueues a **Callback**.
6.  The **Webhook Processor** delivers the results back to **Your App**.

---

## Who is Sim-Pesa for?
*   **Beginners:** Learning how M-Pesa STK Push works without the setup overhead.
*   **Experienced Developers:** Tired of sandbox instability and slow testing cycles.
*   **Teams:** Prototyping and testing payment flows in CI/CD or local dev.
*   **Hackathons:** Getting a payment integration working in minutes, not hours.

---

## "Built to solve real Daraja frustrations I experienced firsthand"
Sim-Pesa isn't just a mock server; it's a system designed to replicate the architectural patterns and edge cases you'll face in production.

[Get Started Now](/guide/quickstart) | [Explore the Docs](/architecture/) | [Technical Blogs](https://hashnode.com/@paul-murithi)
