# Hawk2UI Editor Command Drawer Status Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tighten the persistent workbench chrome so the editor feels like a stripped-down developer tool with a useful command bar, bottom drawer, and dense status bar.

**Architecture:** `App.vue` owns persistent shell composition. Shared workbench helpers provide command metadata and status summaries. UI components stay Hawk-native and avoid DOM component libraries. The central editor region remains the only large middle surface.

**Tech Stack:** Hawk2UI Vue, TypeScript, Hawk CSS, existing bridge status routes, existing bottom drawer and status components.

---

## Task 1: Command Bar Structure

- [ ] Audit current command bar controls in `src/App.vue` and group them into project, run, panel, and overflow clusters.
- [ ] Add a small command metadata helper in `src/core/workbench.ts` if repeated labels, disabled states, or status text become duplicated.
- [ ] Keep commands compact and deterministic: Open Project, New File, Save, Validate, Build, Run Preview, Stop Preview, Command Palette, Project, Chat, Docs, and Settings.
- [ ] Use text or compact symbol labels that render through Hawk today; switch to a verified icon package only in a separate focused change.
- [ ] Do not add screenshot capture as a permanent top-level command in this pass.

## Task 2: Bottom Drawer Polish

- [ ] Update `src/ui/BottomDrawer.vue` so Terminal, Logs, Debug, and Problems have stable tab widths and do not resize on active state changes.
- [ ] Support collapsed, compact, and expanded drawer heights with explicit state names.
- [ ] Keep the status bar visible when the drawer is collapsed.
- [ ] Preserve the terminal sidecar feature gate and current bridge polling behavior.
- [ ] Ensure Problems can show validation and LSP diagnostics without owning the LSP implementation.

## Task 3: Status Bar Signals

- [ ] Update `src/ui/StatusBar.vue` to present project, manifest, bridge, preview, LSP, terminal, and platform/system signals in a compact row.
- [ ] Reserve green/red for actionable health. Use neutral colors for idle, unknown, or disabled integrations.
- [ ] Use monospace styling for counts, CPU, memory, GPU, ports, and timing values.
- [ ] Collapse low-priority items at narrow widths instead of overlapping text.

## Task 4: Editor-First Layout Pass

- [ ] Update `styles/main.hawk.css` so top chrome, editor region, drawer, and status bar have stable dimensions.
- [ ] Confirm the center region is editor-only with no fixed left or right sidebar.
- [ ] Keep cards limited to floating panels and repeated list items.
- [ ] Remove decorative styling that reads as marketing UI, oversized hero content, or nested cards.
- [ ] Ensure all labels fit within controls at expected desktop and narrow widths.

## Task 5: Verification

- [ ] Run `bun run build`.
- [ ] Run `bun run validate`.
- [ ] Run `bun run verify` before committing if TypeScript helpers or shell behavior change.
- [ ] Manually check no permanent sidebars appear, drawer modes work, status text does not overlap, and command bar controls remain reachable.
