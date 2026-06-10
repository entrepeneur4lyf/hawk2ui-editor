# Hawk2UI Editor Workbench UX Design

Date: 2026-06-09
Status: Updated after user review on 2026-06-10

## Purpose

Hawk2UI Editor is the flagship dogfood application for building Hawk2UI projects. It should be a useful developer tool and a complex example that shows how to combine a native Hawk2UI workbench with optional webview-backed surfaces.

This spec covers the workbench shell and interaction model only. The real code editor surface and AI chat system are separate specs.

## Goals

- Keep the main work area focused on a tabbed editor.
- Avoid permanent left or right sidebars.
- Use floating panels for project navigation, docs, chat, and settings.
- Allow floating panels to minimize into thin edge dock gutters without becoming permanent sidebars.
- Provide a top menubar/command bar for global actions and panel launchers.
- Provide a collapsible bottom drawer for terminal, logs, debug, and problems.
- Provide a bottom status bar with project, runtime, validation, bridge, and system state.
- Preserve Hawk2UI as the native app shell rather than turning the whole app into a browser UI.

## Non-Goals

- No implementation of the webview code editor surface.
- No AI SDK UI chat integration.
- No SQLite transcript persistence.
- No LSP integration.
- No assistant inline edits.
- No permanent sidebars.
- No first-pass layout mode where docked panels resize the central editor.
- No hover-only access; every hover action must also have a click or keyboard path.

## Layout

The workbench has four persistent regions:

1. **Top menubar / command bar**: compact app title, project commands, run controls, and icon buttons for floating panels.
2. **Central editor region**: the only large middle surface. It contains editor tabs for files, docs, settings documents, and future generated artifacts.
3. **Bottom drawer**: collapsible terminal, logs, debug, and problems views.
4. **Status bar**: compact runtime and project state.

Floating panels sit above the editor region and can be opened, moved, minimized, docked, pinned, and closed. They are recoverable if saved coordinates are off-screen.

Thin dock gutters may appear on the left and right edges when panels are minimized or docked. A gutter is a narrow tool rail, not a sidebar: it should be about 28-36px wide, contain only panel icons, and must not resize the editor surface in the first pass.

## Command Bar

The command bar should expose high-frequency actions without becoming a sidebar replacement:

- Open project
- New file
- Save
- Validate
- Build
- Run preview
- Stop preview
- Open command palette
- Toggle Project panel
- Toggle Chat panel
- Toggle Docs panel
- Toggle Settings panel

Screenshot capture may be exposed through the command palette or overflow menu, but it should not be a permanent top-level icon in the first pass.

## Floating Panels

Floating panels should follow Ark UI Floating Panel behavior where possible. If Ark UI cannot render cleanly through the Hawk native Vue renderer, the app should keep a Hawk-native floating panel fallback.

Initial panels:

- **Project**: file tree, project settings tab, manifest summary, and future workspace settings.
- **Docs**: documentation browser. Selecting a doc opens it as an editor tab.
- **Chat**: placeholder shell for the future AI Chat spec. It should reserve space for checkpoint sections and assistant tool events.
- **Editor Settings**: theme, font, wrapping, tab size, and editor behavior.
- **Chat Settings**: provider and workflow settings. Detailed behavior belongs to the AI Chat spec.

Panels may dock to edge gutters, but they must remain tool windows. A docked or peeked panel overlays the editor by default; it does not permanently consume editor layout space unless a later explicit setting adds that behavior.

## Dock Gutters

Dock gutters are the home for minimized and docked panels. They preserve the no-sidebar model while making frequent panels easy to reach.

Panel vocabulary:

- **Floating**: visible tool window at saved `x/y/width/height`.
- **Minimized**: hidden body with an icon attached to a gutter.
- **Docked**: attached to a gutter and available as a peek overlay.
- **Peeked**: temporarily visible because the user hovered or focused the gutter icon.
- **Pinned**: docked panel stays visible until explicitly unpinned or closed.

Expected behavior:

- Top command bar toggles still open and close panels.
- Dragging a floating panel to a gutter docks it.
- Dragging a dock icon or docked panel away restores the last floating rectangle.
- Hovering a dock icon opens a delayed peek overlay; accidental edge movement should not open large panels immediately.
- Clicking a dock icon opens the panel immediately.
- Pinning keeps a docked panel open.
- Escape or clicking the editor closes an unpinned peek.
- Keyboard shortcuts and command palette actions must be able to open the same panels; hover is convenience only.

Planned workspace state shape:

```ts
type PanelMode = "floating" | "minimized" | "docked";
type DockEdge = "left" | "right";

interface PanelLayoutState {
  open: boolean;
  mode: PanelMode;
  dockEdge?: DockEdge;
  pinned: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  lastFloating?: { x: number; y: number; width: number; height: number };
}
```

The current app state only stores `open`, `x`, `y`, `width`, and `height`. The implementation plan should migrate panel state conservatively and preserve existing workspaces.

## Bottom Drawer

The bottom drawer has tabs:

- Terminal
- Logs
- Debug
- Problems

It supports collapsed, compact, and expanded heights. The status bar remains visible when the drawer is collapsed. The Problems tab shows validation and editor diagnostics once the Editor spec provides diagnostics.

## Status Bar

The status bar should be dense and scannable:

- Project opened or missing
- Manifest valid or invalid
- Bridge connected or disconnected
- Preview stopped, starting, running, or failed
- Active provider summary when chat is enabled
- CPU, memory, GPU, and platform indicators when available

Numbers should use monospace text. Green and red state should be reserved for actionable health.

## Visual Direction

The workbench should feel like a stripped-down developer editor, not a landing page. The default theme should be black, functional, and syntax-highlighting friendly: near-black base surfaces, slightly lifted tool panels, compact controls, clear separators, and one restrained accent for active/focused state. Cards should be limited to floating panels and repeated list items. Avoid oversized hero typography, decorative gradients, and marketing-style sections.

## Error States

The shell should handle these states visibly:

- No project opened.
- Bridge unavailable.
- Preview command failed.
- Panel position recovered after viewport change.
- Docked panel state recovered after viewport or workspace changes.
- Docs unavailable.
- Editor surface unavailable.

Errors should appear at the relevant surface and also leave a compact status signal.

## Acceptance Criteria

- The app has no permanent sidebars.
- The central region is reserved for tabbed editor content.
- Project, docs, chat, and settings open as floating panels.
- Floating panels can minimize or dock into thin edge gutters without resizing the editor.
- Hover peek, click open, pin, unpin, and escape-to-close are specified for docked panels.
- Panel layout state can be persisted and migrated from the current floating-only state.
- Terminal/log/debug/problems live in a collapsible bottom drawer.
- The status bar reports project and runtime health.
- The design leaves clear integration points for the Editor and AI Chat specs.

## References

- Ark UI Floating Panel: https://ark-ui.com/docs/components/floating-panel
