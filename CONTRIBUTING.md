# Contributing to Sim-Pesa

Thank you for your interest in contributing to Sim-Pesa! This project is a monorepo managed with NPM workspaces.

## Local Development Setup

### 1. Prerequisites
- Node.js (v18+)
- Docker & Docker Compose
- NPM

### 2. Installation
Clone the repo and install dependencies from the root:
```bash
npm install
```

### 3. Environment Configuration
Copy the example environment file and adjust as needed:
```bash
cp .env.example .env
```

### 4. Running the Stack
The easiest way to develop is using Docker Compose:
```bash
docker compose up -d
```

To run services in development mode (with hot-reload):
```bash
npm run dev
```

## Testing
We use Vitest for testing. You can run tests for the entire monorepo or specific packages.

```bash
# Run all tests
npm test

# Run tests for a specific app
npm test -w apps/api
```

## Project Structure
- `apps/`: Main applications (API, Worker, UI).
- `packages/`: Shared libraries (DB, Queue, Utils, Types).
- `docs/`: Source markdown for documentation.
- `simpesa-docs/`: Docusaurus documentation website.

## Coding Standards
- **TypeScript**: All code must be strictly typed.
- **Linting**: Run `npm run lint` before submitting a PR.
- **Formatting**: We use Prettier for consistent code style.
- **Commits**: Follow the Conventional Commits specification.
```bash
feat: add auto-approve toggle to UI
fix: resolve race condition in worker balance update
docs: update API reference for result codes
```
