# Repository Guidelines

## Project Structure & Module Organization

This is a Hawk2UI editor dogfood app. Application code lives in `src/`: `src/WorkbenchEntry.vue` is the interactive desktop entry compiled by the Hawk Vue adapter, and `src/App.vue` preserves the richer componentized workbench prototype. `hawk.json` is the portable Hawk2UI manifest for package identity, Vue framework entry, desktop target metadata, parameters, and runtime capabilities. `vite.hawk.config.ts` controls the sealed Vite bundle and keeps `hawk:*` modules external. `docs/` is for project notes and plans when present. There is no dedicated assets directory yet; add one only when a feature needs static files.

## Build, Test, and Development Commands

Use Bun for JavaScript tooling because `package.json` declares `packageManager: "bun@1.0.0"`.

- `bun install`: install dependencies.
- `bun run dev`: start the Hawk2UI development runtime.
- `bun run build`: build `dist/main.js` with `vite.hawk.config.ts`.
- `bun run build:artifact`: produce a Hawk2UI release artifact.
- `bun run validate`: validate the Hawk2UI project manifest and bundle assumptions.

## Coding Style & Naming Conventions

Use TypeScript throughout. The desktop entry and prototypes use Vue 3 `<script setup lang="ts">`. Match existing formatting: two-space indentation, double quotes, semicolons, and concise imports. Name Vue components in PascalCase (`AssistantPanel.vue`) and local helpers in camelCase. Prefer Hawk host elements and events already supported by the renderer, such as `hawk-view`, `hawk-text`, `hawk-button`, and `@pointerdown`. Keep `hawk.json` portable; put local editor state in `workspace.hawk` and keep secrets as environment references, not literal values.

## Testing Guidelines

Bun tests live next to the modules they cover, for example `src/core/workspace.test.ts` and `src/WorkbenchEntry.test.ts`. When adding logic beyond simple UI wiring, add focused tests and run `bun test`. Before opening a PR, run `bun run build` and `bun run validate`; use `bun run verify` for the combined test, build, and manifest check.

## Commit & Pull Request Guidelines

The current history only contains `first commit`, so no project-specific convention is established. Use short, imperative commit messages; conventional prefixes such as `feat:`, `fix:`, and `chore:` are acceptable. PRs should include a clear description, validation commands run, linked issues or plans, and screenshots or recordings for visible UI changes.

## Agent-Specific Instructions

Treat code and manifests as the source of truth. Do not invent Hawk2UI manifest fields, CLI commands, runtime APIs, or packaging behavior without verifying them locally.
