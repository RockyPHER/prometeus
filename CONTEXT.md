# Prometeus Context

Prometeus is a modular platform for research, organization, and technical production. It is built for people who move between discovery, note-taking, and structured writing, especially in academic, technical, and research-heavy work.

## Product Vision

Prometeus should reduce the cognitive cost of moving between tools. Research, notes, references, and writing should stay connected inside one workspace.

The product should help users preserve provenance: a note used in a text should remain connected to its source, citation, and bibliography entry.

## Core Flow

Lab is the primary research and experimentation surface. Tools appear as modular bubbles. A Lab tool may generate notes, but it may also exist only for lookup, validation, comparison, or experimentation.

Drawer is the global operational memory of the workspace. It persists across Lab and Write, stores free notes and reference notes, supports search and filtering, and allows notes to be edited, deleted, reordered, opened, dragged, or inserted.

Write is the writing surface. It currently supports Markdown editing, preview, references, note insertion, localStorage persistence, and bibliography derivation from used reference notes.

## Conceptual Principles

Lab, Drawer, and Write are not isolated pages. They are parts of one research-to-writing loop.

Reference notes are stricter than free notes. A reference note exists only when it is linked to an external source.

Bibliography is system-managed. It should be derived from reference usage, not treated as detached manual text.

The alpha may keep typed browser events for cross-feature commands, but those events must remain centralized.

The interface should be quiet, visual, and operational. Prometeus is not a marketing surface; it is a workspace.
