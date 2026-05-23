# Prometeus

Prometeus is a modular workspace for research, operational notes, and technical writing. The product is organized around the Lab, the global Drawer, and Write.

## Stack

- pnpm workspaces
- Turborepo
- TypeScript
- `apps/web`: Next.js App Router, React, Tailwind CSS
- `apps/api`: NestJS with GraphQL code-first
- `packages/core`: shared domain types and contracts
- `packages/db`: future Prisma database layer

## Install

```bash
pnpm install
```

## Run

```bash
pnpm dev
```

Useful local URLs:

- Web: `http://localhost:5173/pt`
- API GraphQL: `http://localhost:3001/graphql`

## Useful Scripts

```bash
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm dev:web
pnpm dev:api
```

The API currently returns mock data through GraphQL. The web app keeps local fallback data so Lab, Drawer, and Write remain usable when the API is offline.

## Project Structure

```text
prometeus/
  apps/
    api/       NestJS GraphQL API prepared for future persistence
    web/       Next.js App Router frontend
  packages/
    core/      Shared domain types and contracts
    db/        Future Prisma schema, migrations, seed, and client boundary
```

See `ARCHITECTURE.md`, `CONTEXT.md`, and `ROADMAP.md` before changing product structure or domain rules.
