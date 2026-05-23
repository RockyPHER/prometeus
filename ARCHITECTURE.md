# Prometeus Architecture

This document is a strict guide for humans and agents working on Prometeus. Do not reverse these decisions without an explicit product or architecture request.

## Monorepo

Prometeus is a pnpm workspace orchestrated by Turborepo.

```text
prometeus/
  apps/
    api/
    web/
  packages/
    core/
    db/
```

Root scripts must route through Turbo:

- `pnpm dev`
- `pnpm build`
- `pnpm lint`
- `pnpm typecheck`

## Responsibilities

`apps/web` is the product focus for the alpha. It uses Next.js App Router with routes under `src/app/[locale]`, Tailwind, and feature folders for Lab, Drawer, Notes, and Write. Product components belong in `features`. Generic UI belongs in `components/ui`. Global providers belong in `components/providers`.

`apps/api` is a prepared NestJS backend using GraphQL code-first. It should stay modular by domain: tools, notes, documents, and projects. Services may return mocks during alpha. GraphQL schema generation is automatic through `autoSchemaFile`; do not hand-edit `schema.gql`.

`packages/core` is the source of truth for shared domain contracts: `WorkspaceMode`, tools, notes, note payloads, documents, projects, and shared event payload types. Web code should consume these contracts directly. API GraphQL models may mirror them when decorators require runtime classes, but field names and semantics must stay aligned with `packages/core`.

`packages/db` is the future persistence boundary. It owns Prisma schema, migrations, seed, and the Prisma client entrypoint. No app should instantiate `PrismaClient` directly, and app-level database wiring should only be introduced when real persistence work begins.

## Business Rules

Lab is primary. It is the research, experimentation, and modular tooling space, not a secondary page.

Drawer is global operational memory. It crosses Lab and Write and must keep free notes, reference notes, search, filters, editing, deletion, reordering, insertion, and current localStorage behavior intact.

Write is the writing environment. It should feel closer to Obsidian over time, with editing and preview becoming increasingly connected.

There are initially two note types: `free` and `reference`.

A reference note requires a linked external source. If there is no verifiable source/link, create a `free` note.

`content` and `excerpt` are different. `content` is the user's annotation. `excerpt` is the external source passage.

ABNT is a formal responsibility of the system. Bibliography must not become loose manual text.

Bibliography should be derived from reference notes used in the text. The bibliography section is not the primary source of truth.

The current `[[ref:id]]` marker is an alpha implementation detail. The conceptual rule is that a passage in Write must retain a link to its note, source, and bibliography entry.

Lab tools do not have to generate notes. Some tools can be only for consultation, validation, or experimentation.

## Frontend Patterns

Routes live under `apps/web/src/app/[locale]`. The root route only redirects to the default locale.

Global UI state for the current alpha may use local React state and localStorage. Cross-feature commands may use browser events only through `apps/web/src/lib/events`.

Do not call `window.dispatchEvent` directly from feature components. Add typed functions to `lib/events` instead.

GraphQL communication should live behind `apps/web/src/lib/api.ts` and future Apollo helpers in `apps/web/src/lib/apollo`.

i18n is prepared for `pt` and `en`. Expand message files instead of scattering new top-level routing text.

Only Tailwind theme colors may be used in the web app. Do not introduce ad-hoc hex, rgb, rgba, hsl, or hsla values in components, CSS, editor themes, inline styles, gradients, or shadows. When a non-class API needs a color, reuse the shared palette from `apps/web/src/theme/colors.ts` or reference Tailwind theme tokens from CSS.

## Backend Patterns

Each module should keep this shape:

```text
module/
  module.ts
  resolver.ts
  service.ts
  model.ts
  dto/
```

Use GraphQL code-first decorators for models and resolvers. Keep services simple until persistence is intentionally introduced.

`packages/db` is a boundary, not an invitation to add persistence rules now. Do not add authentication, users, permissions, or complex database behavior in the alpha migration.

## Visual Principles

Prometeus should stay clear, minimal, soft, and writing-friendly. Use rounded surfaces, compact segmented controls, icon-first actions, restrained teal, low border noise, and scannable cards.

Write should feel like an environment for writing, not a dashboard. Drawer should feel like operational memory, not an admin panel. Lab should stay visual and modular.

Avoid unnecessary explanatory text in the interface. Let controls, icons, and spatial organization do the work.

## Out Of Scope Now

- Authentication
- Permissions
- Full database implementation
- OpenAlex integration
- PePSIC integration
- AI features
- Desktop app
- Rewriting the product from scratch
- Making Lab secondary
- Creating reference notes without a source link
