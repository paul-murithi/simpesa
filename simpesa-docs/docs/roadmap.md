---
title: Project Roadmap
sidebar_position: 4
---

# Project Roadmap

The development of Sim-Pesa is structured into four major phases, focusing on infrastructure, core logic, asynchronous processing, and UI/UX.

## Phase 1: Infrastructure and Foundation (January)
- **Docker Setup**: Multi-container configuration for API, Postgres, and Redis.
- **DB Schema**: Migration system for Merchants, Users, and Transactions.
- **API Ingestion**: Baseline STK Push endpoints.
- **Visibility**: Structured logging with trace ID correlation.

## Phase 2: Transactional Logic and Locking (February)
- **State Machine**: Implementation of the `PENDING → SUCCESS/FAILED` lifecycle.
- **Concurrency Control**: Row-level locking to prevent race conditions during balance updates.
- **Idempotency**: Atomic transaction creation using PostgreSQL `ON CONFLICT`.

## Phase 3: Asynchronous Queuing and Webhooks (March)
- **BullMQ Integration**: Offloading processing to background workers.
- **Webhook Dispatcher**: Reliable delivery system with persistence.
- **Resilience**: Exponential backoff for failed callback attempts.

## Phase 4: UI/UX and Simulation Polish (April)
- **React Dashboard**: Real-time transaction monitoring.
- **Virtual Smartphone**: Interactive PIN entry simulation.
- **Onboarding Wizard**: Simplified merchant registration flow.
- **Documentation**: Professional Docusaurus portal.
