# Roadmap

## Now

- Keep the web alpha stable in Next.js App Router.
- Preserve Lab, Drawer, NoteCard, reference notes, Write, insertion, references, and localStorage.
- Keep backend GraphQL modules simple and mock-backed.
- Centralize domain types in `packages/core`.
- Keep `packages/db` prepared for Prisma without forcing persistence into the current flow.
- Expand i18n structure gradually for `pt` and `en`.

## Next

- Add a typed global state strategy for shared workspace state if browser events become hard to reason about.
- Replace the alpha reference marker implementation when a stronger note-to-text binding model is selected.
- Introduce Apollo Client or another GraphQL client behind `lib/apollo`.
- Add focused tests around note insertion, bibliography derivation, and Drawer/Write interactions.
- Expand the Write experience toward a more fluid Obsidian-style edit/preview model.

## Later

- Add real persistence through `packages/db`.
- Model projects, documents, notes, and reference sources in database-backed services.
- Add OpenAlex as a Lab module.
- Add PePSIC as a Lab module if product scope confirms it.
- Add richer citation and ABNT automation.

## Out Of Scope For Alpha

- Authentication
- Permissions
- Users and teams
- Full database rollout
- AI integrations
- Desktop app
- Real OpenAlex or PePSIC integration
- Rewriting Prometeus from scratch
