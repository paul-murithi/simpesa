# Contributing to Sim-Pesa

Thank you for your interest in contributing to Sim-Pesa! This project is a monorepo managed with NPM workspaces.

## Local Development Setup

### 1. Prerequisites
- Node.js (v18+)
- Docker & Docker Compose
- NPM

### 2. Installation & Setup
Clone the repo and run the setup script:
```bash
git clone https://github.com/paul-murithi/simpesa.git
cd simpesa
npm run setup
```
This script will copy `.env.example` to `.env` and install all dependencies.

### 3. Running the Stack
For local development with hot-reloading:

1. **Start Infrastructure**:
   ```bash
   docker compose -f docker-compose.dev.yml up -d
   ```
2. **Start Services**:
   ```bash
   npm run dev
   ```

To run the entire stack in production-like containers:
```bash
docker compose up -d
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
