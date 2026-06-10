# Hawk2UI Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first Hawk2UI Editor dogfood application inside `/home/shawn/workspace/hawk2ui-editor`.

**Architecture:** The editor is a single-project Vue Hawk2UI workbench. `hawk.json` stays the portable CLI/runtime manifest, `workspace.hawk` stores local Studio/editor state, and provider execution is routed through an explicit assistant boundary instead of browser globals. Because Hawk sealed JS has no raw shell/env access, real AI SDK calls, preview process management, and DOM-heavy code editing run through a local Bun bridge. The Hawk UI remains the native workbench shell; a WebviewJS sidecar window demonstrates a drop-in webview solution for mature code editor widgets without making webview support part of the Hawk2UI framework distribution.

**Tech Stack:** Hawk2UI Vue, Bun, Vite, TypeScript, AI SDK v6, `ai-sdk-provider-codex-cli`, `ai-sdk-provider-claude-code`, `@ai-sdk/openai-compatible`, Ark UI Vue where compatible, WebviewJS sidecar where DOM widgets are needed, CodeMirror for the example editor surface, Hawk runtime modules, local JSON workspace files.

**Implementation status:** Baseline workbench implementation is complete and verified. WebviewJS code editor sidecar is a pending Task 10 revision.

---

## Ground Rules

- Keep all implementation work inside `/home/shawn/workspace/hawk2ui-editor` unless a task explicitly creates a follow-up note for the framework repo.
- Do not commit anything to the public Hawk2UI framework repo from this plan.
- Use Bun for package management, scripts, tests, and the local bridge.
- Do not store raw API keys in `hawk.json`, `workspace.hawk`, logs, fixtures, tests, or docs.
- Treat `workspace.hawk` as local-only and ignored by git.
- Keep provider profiles capability-based: the UI displays what a provider can do instead of assuming behavior from the provider name.
- Treat WebviewJS as an example-sidecar dependency for this dogfood app only. Do not add WebviewJS to the Hawk2UI framework repo or present it as distributed Hawk2UI functionality.

## Current Scaffold State

The CLI generated a Vue plugin project:

- `hawk.json` declares `app.framework = "vue"` and a `plugin` target.
- `package.json` uses `bun@1.0.0` and Vite.
- `src/App.vue` is a small plugin parameter demo.
- The repository currently contains the generated scaffold as its baseline.

The editor should become a desktop workbench. The first task converts the manifest from the plugin starter to a desktop app while preserving the Vue scaffold.

## File Structure

Create or modify these files:

- `.gitignore`: local project ignore rules.
- `hawk.json`: editor app identity, desktop target, capabilities, style entry.
- `package.json`: editor scripts and dependencies.
- `README.md`: local dogfood app instructions.
- `workspace.hawk`: ignored local workspace defaults.
- `styles/main.hawk.css`: Hawk UI visual styling.
- `src/main.ts`: existing Vue mount entry.
- `src/App.vue`: workbench shell composition.
- `src/core/workspace.ts`: parse, validate, default, and serialize `workspace.hawk`.
- `src/core/workspace.test.ts`: workspace document tests.
- `src/core/project.ts`: project manifest summary and open-project state.
- `src/core/project.test.ts`: project summary tests.
- `src/assistant/providers.ts`: provider profile types, defaults, capabilities, and redaction.
- `src/assistant/providers.test.ts`: provider registry tests.
- `src/assistant/client.ts`: UI-facing assistant client that can target `hawk:ai` or the local bridge.
- `src/assistant/client.test.ts`: assistant bridge request tests.
- `src/docs/githubDocs.ts`: docs source/cache model and bridge client request builders.
- `src/docs/githubDocs.test.ts`: docs model tests.
- `src/preview/previewClient.ts`: preview state machine and bridge request builders.
- `src/preview/previewClient.test.ts`: preview state tests.
- `src/bridge/server.ts`: local Bun bridge HTTP server.
- `src/bridge/assistant.ts`: AI SDK provider construction and streaming.
- `src/bridge/docs.ts`: GitHub Markdown fetch/cache.
- `src/bridge/docs.test.ts`: docs path safety tests.
- `src/bridge/preview.ts`: `hawk2ui-cli dev` process controller.
- `src/bridge/webviewEditor.ts`: WebviewJS sidecar lifecycle and file IPC.
- `src/bridge/server.test.ts`: bridge route tests without live provider calls.
- `src/webview-editor/index.html`: DOM editor surface loaded into WebviewJS.
- `src/webview-editor/main.ts`: CodeMirror editor setup and IPC adapter.
- `src/webview-editor/editor.css`: webview-only editor styling.
- `src/ui/HawkFloatingPanel.vue`: Hawk-native floating panel fallback.
- `src/ui/ArkFloatingPanelProbe.vue`: Ark UI compatibility probe.
- `src/ui/AssistantPanel.vue`: assistant UI panel.
- `src/ui/DocsPanel.vue`: documentation UI panel.
- `src/ui/ProjectPanel.vue`: project open/create status panel.
- `src/ui/PreviewPanel.vue`: preview status/control panel.

## Task 1: Local Project Baseline

**Files:**
- Create: `.gitignore`
- Modify: `hawk.json`
- Modify: `package.json`
- Modify: `README.md`
- Create: `styles/main.hawk.css`

- [x] **Step 1: Initialize a local git repository**

Run:

```bash
git init
```

Expected: `Initialized empty Git repository` or `Reinitialized existing Git repository`.

- [x] **Step 2: Add local ignore rules**

Create `.gitignore`:

```gitignore
node_modules/
dist/
.env
.env.*
workspace.hawk
.hawk2ui-cache/
bridge-cache/
*.log
```

- [x] **Step 3: Convert `hawk.json` to a desktop editor app**

Replace `hawk.json` with:

```json
{
  "$schema": "https://hawk2ui.dev/schemas/hawk.schema.json",
  "schemaVersion": 1,
  "package": {
    "id": "com.hawk2ui.editor",
    "name": "Hawk2UI Editor",
    "version": "0.1.0",
    "bundleId": "com.hawk2ui.editor"
  },
  "app": {
    "entry": "src/main.ts",
    "framework": "vue",
    "style": "styles/main.hawk.css"
  },
  "build": {
    "packageManager": "bun",
    "output": "dist/main.js"
  },
  "targets": {
    "desktop": [
      {
        "name": "main",
        "platforms": ["windows", "macos", "linux-wayland", "linux-x11"],
        "window": {
          "title": "Hawk2UI Editor",
          "width": 1280,
          "height": 820,
          "minWidth": 960,
          "minHeight": 640,
          "resizable": true,
          "presentationBackend": "gpu-preferred"
        }
      }
    ]
  },
  "permissions": {
    "capabilities": [
      "native-windowing",
      "sealed-artifacts",
      "network",
      "storage",
      "files",
      "desktop",
      "ai.provider"
    ]
  }
}
```

- [x] **Step 4: Update `package.json` scripts and dependencies**

Replace `package.json` with:

```json
{
  "name": "hawk2ui-editor",
  "private": true,
  "type": "module",
  "packageManager": "bun@1.0.0",
  "scripts": {
    "bundle": "vite build --config vite.hawk.config.ts",
    "build": "vite build --config vite.hawk.config.ts",
    "build:artifact": "hawk2ui-cli build-release",
    "bridge": "bun src/bridge/server.ts",
    "dev": "hawk2ui-cli dev",
    "test": "bun test",
    "validate": "hawk2ui-cli validate",
    "verify": "bun test && bun run build && hawk2ui-cli validate"
  },
  "dependencies": {
    "@ai-sdk/openai-compatible": "^2.0.48",
    "@ark-ui/vue": "^5.37.2",
    "@hawk2ui/vue": "^0.1.0",
    "ai": "^6.0.198",
    "ai-sdk-provider-claude-code": "^3.4.4",
    "ai-sdk-provider-codex-cli": "^1.2.1",
    "vue": "^3.5.0",
    "zod": "^4.4.3"
  },
  "devDependencies": {
    "@babel/generator": "^7.29.7",
    "@types/bun": "^1.3.14",
    "@vitejs/plugin-vue": "^5.0.0",
    "typescript": "^5.0.0",
    "vite": "^6.0.0"
  }
}
```

- [x] **Step 5: Add the style entry**

Create `styles/main.hawk.css`:

```css
.editor-root {
  background-color: token(color.surface);
  color: #f4f7fb;
}

.topbar {
  background-color: token(color.surface);
}

.workspace {
  background-color: token(color.surface);
}

.panel {
  background-color: token(color.surface);
  color: #f4f7fb;
}

.panel-title {
  color: #ffffff;
  font-size: 16px;
}

.muted {
  color: #9aa6b2;
}

.status-ok {
  color: #65d18f;
}

.status-warn {
  color: #f0c66a;
}

.status-error {
  color: #ff7b7b;
}
```

- [x] **Step 6: Update the README**

Replace `README.md` with:

```markdown
# Hawk2UI Editor

Local dogfood app for building a Hawk2UI single-project editor with Vue.

## Commands

- `bun install`
- `bun test`
- `bun run build`
- `hawk2ui-cli validate`
- `bun run bridge`
- `hawk2ui-cli dev`

`workspace.hawk` is local-only and ignored by git. Store API keys in environment variables such as `OPENAI_API_KEY` or `NIM_API_KEY`, not in project files.
```

- [x] **Step 7: Install dependencies**

Run:

```bash
bun install
```

Expected: dependencies install and no raw credentials are written.

- [x] **Step 8: Verify baseline**

Run:

```bash
bun run build
hawk2ui-cli validate
```

Expected: Vite build succeeds and Hawk2UI validation succeeds. If the Ark UI package causes a bundling issue before it is used, remove `@ark-ui/vue` from `dependencies` and move Ark compatibility to Task 6.

- [x] **Step 9: Local checkpoint**

Run:

```bash
git add .gitignore hawk.json package.json README.md styles/main.hawk.css bun.lockb
git commit -m "chore: convert scaffold to editor baseline"
```

Expected: local commit succeeds. This commit is local to `hawk2ui-editor`.

## Task 2: Workspace Document Contract

**Files:**
- Create: `workspace.hawk`
- Create: `src/core/workspace.ts`
- Create: `src/core/workspace.test.ts`

- [x] **Step 1: Add local `workspace.hawk` defaults**

Create `workspace.hawk`:

```json
{
  "schemaVersion": 1,
  "project": {
    "root": "/home/shawn/workspace/hawk2ui-editor"
  },
  "ai": {
    "activeProfile": "codex-cli",
    "profiles": [
      {
        "id": "codex-cli",
        "kind": "agent",
        "adapter": "codex-cli",
        "label": "Codex CLI",
        "model": "gpt-5.5",
        "approvalMode": "on-failure",
        "sandboxMode": "workspace-write",
        "capabilities": ["chat", "project-read", "project-write", "shell", "subscription-auth", "api-key-auth"]
      },
      {
        "id": "claude-code",
        "kind": "agent",
        "adapter": "claude-code",
        "label": "Claude Code",
        "model": "sonnet",
        "permissionMode": "default",
        "capabilities": ["chat", "project-read", "project-write", "shell", "subscription-auth"]
      },
      {
        "id": "nim-kimi",
        "kind": "chat",
        "adapter": "openai-compatible",
        "label": "NVIDIA NIM",
        "baseURL": "https://integrate.api.nvidia.com/v1",
        "apiKey": "env:NIM_API_KEY",
        "model": "moonshotai/kimi-k2.6",
        "capabilities": ["chat", "docs-qa", "api-key-auth", "openai-compatible"]
      }
    ]
  },
  "editor": {
    "theme": "system",
    "layout": "default"
  },
  "panels": {
    "assistant": { "open": true, "x": 24, "y": 24, "width": 420, "height": 620 },
    "docs": { "open": true, "x": 468, "y": 24, "width": 520, "height": 620 },
    "preview": { "open": true, "x": 1008, "y": 24, "width": 240, "height": 300 }
  },
  "docs": {
    "source": {
      "type": "github",
      "owner": "entrepeneur4lyf",
      "repo": "hawk2ui",
      "ref": "main",
      "paths": ["manual/README.md", "manual/SUMMARY.md"]
    },
    "lastRefresh": null
  },
  "preview": {
    "command": "hawk2ui-cli dev",
    "mode": "separate-window",
    "autoStart": false
  },
  "bridge": {
    "baseURL": "http://127.0.0.1:47321"
  }
}
```

- [x] **Step 2: Implement workspace parsing**

Create `src/core/workspace.ts`:

```ts
export type AssistantCapability =
  | "chat"
  | "docs-qa"
  | "project-read"
  | "project-write"
  | "shell"
  | "mcp"
  | "subscription-auth"
  | "api-key-auth"
  | "openai-compatible";

export type AssistantProfile =
  | {
      id: string;
      kind: "agent";
      adapter: "codex-cli";
      label: string;
      model: string;
      approvalMode: "untrusted" | "on-failure" | "on-request" | "never";
      sandboxMode: "read-only" | "workspace-write" | "danger-full-access";
      capabilities: AssistantCapability[];
    }
  | {
      id: string;
      kind: "agent";
      adapter: "claude-code";
      label: string;
      model: string;
      permissionMode: "default" | "acceptEdits" | "bypassPermissions" | "plan";
      capabilities: AssistantCapability[];
    }
  | {
      id: string;
      kind: "chat";
      adapter: "openai-compatible";
      label: string;
      baseURL: string;
      apiKey: `env:${string}`;
      model: string;
      capabilities: AssistantCapability[];
    };

export interface PanelState {
  open: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WorkspaceDocument {
  schemaVersion: 1;
  project: { root: string };
  ai: { activeProfile: string; profiles: AssistantProfile[] };
  editor: { theme: "system" | "light" | "dark"; layout: string };
  panels: Record<string, PanelState>;
  docs: {
    source: {
      type: "github";
      owner: string;
      repo: string;
      ref: string;
      paths: string[];
    };
    lastRefresh: string | null;
  };
  preview: { command: string; mode: "separate-window"; autoStart: boolean };
  bridge: { baseURL: string };
}

export function defaultWorkspaceDocument(root: string): WorkspaceDocument {
  return {
    schemaVersion: 1,
    project: { root },
    ai: {
      activeProfile: "codex-cli",
      profiles: [
        {
          id: "codex-cli",
          kind: "agent",
          adapter: "codex-cli",
          label: "Codex CLI",
      model: "gpt-5.5",
      approvalMode: "on-failure",
          sandboxMode: "workspace-write",
          capabilities: ["chat", "project-read", "project-write", "shell", "subscription-auth", "api-key-auth"],
        },
        {
          id: "claude-code",
          kind: "agent",
          adapter: "claude-code",
          label: "Claude Code",
          model: "sonnet",
          permissionMode: "default",
          capabilities: ["chat", "project-read", "project-write", "shell", "subscription-auth"],
        },
        {
          id: "nim-kimi",
          kind: "chat",
          adapter: "openai-compatible",
          label: "NVIDIA NIM",
          baseURL: "https://integrate.api.nvidia.com/v1",
          apiKey: "env:NIM_API_KEY",
          model: "moonshotai/kimi-k2.6",
          capabilities: ["chat", "docs-qa", "api-key-auth", "openai-compatible"],
        },
      ],
    },
    editor: { theme: "system", layout: "default" },
    panels: {
      assistant: { open: true, x: 24, y: 24, width: 420, height: 620 },
      docs: { open: true, x: 468, y: 24, width: 520, height: 620 },
      preview: { open: true, x: 1008, y: 24, width: 240, height: 300 },
    },
    docs: {
      source: {
        type: "github",
        owner: "entrepeneur4lyf",
        repo: "hawk2ui",
        ref: "main",
        paths: ["manual/README.md", "manual/SUMMARY.md"],
      },
      lastRefresh: null,
    },
    preview: { command: "hawk2ui-cli dev", mode: "separate-window", autoStart: false },
    bridge: { baseURL: "http://127.0.0.1:47321" },
  };
}

export function parseWorkspaceDocument(source: string): WorkspaceDocument {
  const value = JSON.parse(source) as Partial<WorkspaceDocument>;
  assertWorkspaceDocument(value);
  return value;
}

export function serializeWorkspaceDocument(document: WorkspaceDocument): string {
  return `${JSON.stringify(document, null, 2)}\n`;
}

export function activeProfile(document: WorkspaceDocument): AssistantProfile {
  const profile = document.ai.profiles.find((candidate) => candidate.id === document.ai.activeProfile);
  if (!profile) {
    throw new Error(`workspace.ai.activeProfile missing profile: ${document.ai.activeProfile}`);
  }
  return profile;
}

function assertWorkspaceDocument(value: Partial<WorkspaceDocument>): asserts value is WorkspaceDocument {
  if (value.schemaVersion !== 1) throw new Error("workspace.schemaVersion must be 1");
  if (!value.project?.root) throw new Error("workspace.project.root is required");
  if (!value.ai?.activeProfile) throw new Error("workspace.ai.activeProfile is required");
  if (!Array.isArray(value.ai.profiles) || value.ai.profiles.length === 0) {
    throw new Error("workspace.ai.profiles must contain at least one profile");
  }
  for (const profile of value.ai.profiles) validateProfile(profile);
  if (!value.panels || typeof value.panels !== "object") throw new Error("workspace.panels is required");
  for (const [name, panel] of Object.entries(value.panels)) validatePanel(name, panel);
  if (activeProfile(value).id !== value.ai.activeProfile) throw new Error("workspace.ai.activeProfile is invalid");
  if (value.docs?.source?.type !== "github") throw new Error("workspace.docs.source.type must be github");
  if (!value.bridge?.baseURL) throw new Error("workspace.bridge.baseURL is required");
}

function validateProfile(profile: AssistantProfile): void {
  if (!profile.id.trim()) throw new Error("workspace.ai.profile.id is required");
  if (!profile.label.trim()) throw new Error(`workspace.ai.profile.label is required: ${profile.id}`);
  if (!profile.model.trim()) throw new Error(`workspace.ai.profile.model is required: ${profile.id}`);
  if (profile.adapter === "openai-compatible") {
    if (!profile.baseURL.startsWith("https://") && !profile.baseURL.startsWith("http://")) {
      throw new Error(`workspace.ai.profile.baseURL must be absolute: ${profile.id}`);
    }
    if (!profile.apiKey.startsWith("env:")) {
      throw new Error(`workspace.ai.profile.apiKey must be an env reference: ${profile.id}`);
    }
  }
}

function validatePanel(name: string, panel: PanelState): void {
  if (!Number.isFinite(panel.x) || !Number.isFinite(panel.y)) throw new Error(`workspace.panels.${name}.position is invalid`);
  if (!Number.isFinite(panel.width) || panel.width < 160) throw new Error(`workspace.panels.${name}.width is invalid`);
  if (!Number.isFinite(panel.height) || panel.height < 120) throw new Error(`workspace.panels.${name}.height is invalid`);
}
```

- [x] **Step 3: Add workspace tests**

Create `src/core/workspace.test.ts`:

```ts
import { describe, expect, test } from "bun:test";
import {
  activeProfile,
  defaultWorkspaceDocument,
  parseWorkspaceDocument,
  serializeWorkspaceDocument,
} from "./workspace";

describe("workspace.hawk", () => {
  test("creates safe defaults without raw secrets", () => {
    const workspace = defaultWorkspaceDocument("/tmp/project");

    expect(workspace.project.root).toBe("/tmp/project");
    expect(activeProfile(workspace).id).toBe("codex-cli");
    expect(JSON.stringify(workspace)).not.toContain("sk-");
    expect(JSON.stringify(workspace)).toContain("env:NIM_API_KEY");
  });

  test("round-trips valid JSON", () => {
    const workspace = defaultWorkspaceDocument("/tmp/project");
    const parsed = parseWorkspaceDocument(serializeWorkspaceDocument(workspace));

    expect(parsed).toEqual(workspace);
  });

  test("rejects raw api keys in openai-compatible profiles", () => {
    const workspace = defaultWorkspaceDocument("/tmp/project");
    workspace.ai.profiles = [
      {
        id: "bad",
        kind: "chat",
        adapter: "openai-compatible",
        label: "Bad",
        baseURL: "https://example.test/v1",
        apiKey: "sk-test" as `env:${string}`,
        model: "model",
        capabilities: ["chat"],
      },
    ];
    workspace.ai.activeProfile = "bad";

    expect(() => parseWorkspaceDocument(JSON.stringify(workspace))).toThrow("apiKey must be an env reference");
  });
});
```

- [x] **Step 4: Run workspace tests**

Run:

```bash
bun test src/core/workspace.test.ts
```

Expected: all tests pass.

- [x] **Step 5: Local checkpoint**

Run:

```bash
git add workspace.hawk src/core/workspace.ts src/core/workspace.test.ts
git commit -m "feat: define editor workspace document"
```

Expected: `workspace.hawk` is ignored and not committed. If `git add workspace.hawk` reports it is ignored, commit only the source and test files.

## Task 3: Project State And Manifest Summary

**Files:**
- Create: `src/core/project.ts`
- Create: `src/core/project.test.ts`

- [x] **Step 1: Implement project summary parsing**

Create `src/core/project.ts`:

```ts
export interface HawkProjectSummary {
  root: string;
  packageId: string;
  name: string;
  version: string;
  framework: string;
  targets: string[];
  entry: string;
}

interface HawkManifestShape {
  package?: { id?: string; name?: string; version?: string };
  app?: { entry?: string; framework?: string };
  targets?: Record<string, unknown[]>;
}

export function summarizeHawkManifest(root: string, source: string): HawkProjectSummary {
  const manifest = JSON.parse(source) as HawkManifestShape;
  const packageId = requireString(manifest.package?.id, "package.id");
  const name = requireString(manifest.package?.name, "package.name");
  const version = requireString(manifest.package?.version, "package.version");
  const entry = requireString(manifest.app?.entry, "app.entry");
  const framework = manifest.app?.framework ?? "native";
  const targets = Object.entries(manifest.targets ?? {})
    .filter(([, value]) => Array.isArray(value) && value.length > 0)
    .map(([key]) => key);

  if (targets.length === 0) throw new Error("manifest.targets must contain at least one target");

  return { root, packageId, name, version, framework, targets, entry };
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`manifest.${field} is required`);
  return value;
}
```

- [x] **Step 2: Add project summary tests**

Create `src/core/project.test.ts`:

```ts
import { describe, expect, test } from "bun:test";
import { summarizeHawkManifest } from "./project";

describe("project summary", () => {
  test("summarizes a desktop Vue manifest", () => {
    const summary = summarizeHawkManifest(
      "/workspace/app",
      JSON.stringify({
        package: { id: "com.example.app", name: "Example", version: "0.1.0" },
        app: { entry: "src/main.ts", framework: "vue" },
        targets: { desktop: [{ name: "main" }] },
      }),
    );

    expect(summary).toEqual({
      root: "/workspace/app",
      packageId: "com.example.app",
      name: "Example",
      version: "0.1.0",
      framework: "vue",
      targets: ["desktop"],
      entry: "src/main.ts",
    });
  });

  test("rejects manifests without targets", () => {
    expect(() =>
      summarizeHawkManifest(
        "/workspace/app",
        JSON.stringify({
          package: { id: "com.example.app", name: "Example", version: "0.1.0" },
          app: { entry: "src/main.ts", framework: "vue" },
          targets: {},
        }),
      ),
    ).toThrow("manifest.targets");
  });
});
```

- [x] **Step 3: Run project tests**

Run:

```bash
bun test src/core/project.test.ts
```

Expected: all tests pass.

- [x] **Step 4: Local checkpoint**

Run:

```bash
git add src/core/project.ts src/core/project.test.ts
git commit -m "feat: summarize opened hawk projects"
```

## Task 4: Assistant Provider Registry

**Files:**
- Create: `src/assistant/providers.ts`
- Create: `src/assistant/providers.test.ts`

- [x] **Step 1: Implement provider registry helpers**

Create `src/assistant/providers.ts`:

```ts
import type { AssistantCapability, AssistantProfile } from "../core/workspace";

export interface ProviderBadge {
  label: string;
  value: string;
}

export function profileCan(profile: AssistantProfile, capability: AssistantCapability): boolean {
  return profile.capabilities.includes(capability);
}

export function providerBadges(profile: AssistantProfile): ProviderBadge[] {
  const badges: ProviderBadge[] = [{ label: "Model", value: profile.model }];
  if (profileCan(profile, "project-write")) badges.push({ label: "Project", value: "Can edit" });
  else badges.push({ label: "Project", value: "Chat only" });
  if (profileCan(profile, "subscription-auth")) badges.push({ label: "Auth", value: "Subscription" });
  if (profileCan(profile, "api-key-auth")) badges.push({ label: "Auth", value: "API key" });
  if (profile.adapter === "openai-compatible") badges.push({ label: "Endpoint", value: redactEndpoint(profile.baseURL) });
  return badges;
}

export function redactProfile(profile: AssistantProfile): AssistantProfile {
  if (profile.adapter !== "openai-compatible") return profile;
  return { ...profile, apiKey: redactSecretReference(profile.apiKey) as `env:${string}` };
}

export function redactSecretReference(value: string): string {
  if (value.startsWith("env:")) return value;
  return "[redacted]";
}

function redactEndpoint(value: string): string {
  const url = new URL(value);
  return `${url.origin}${url.pathname}`;
}
```

- [x] **Step 2: Add registry tests**

Create `src/assistant/providers.test.ts`:

```ts
import { describe, expect, test } from "bun:test";
import { defaultWorkspaceDocument } from "../core/workspace";
import { profileCan, providerBadges, redactProfile, redactSecretReference } from "./providers";

describe("assistant providers", () => {
  test("marks codex as project-write capable", () => {
    const workspace = defaultWorkspaceDocument("/tmp/project");
    const codex = workspace.ai.profiles.find((profile) => profile.id === "codex-cli");

    expect(codex).toBeDefined();
    expect(profileCan(codex!, "project-write")).toBe(true);
    expect(providerBadges(codex!).some((badge) => badge.value === "Can edit")).toBe(true);
  });

  test("marks nim as chat-only and keeps env secret references", () => {
    const workspace = defaultWorkspaceDocument("/tmp/project");
    const nim = workspace.ai.profiles.find((profile) => profile.id === "nim-kimi");

    expect(nim).toBeDefined();
    expect(profileCan(nim!, "project-write")).toBe(false);
    expect(providerBadges(nim!).some((badge) => badge.value === "Chat only")).toBe(true);
    expect(redactProfile(nim!)).toEqual(nim);
  });

  test("redacts raw secret values", () => {
    expect(redactSecretReference("sk-test")).toBe("[redacted]");
    expect(redactSecretReference("env:OPENAI_API_KEY")).toBe("env:OPENAI_API_KEY");
  });
});
```

- [x] **Step 3: Run provider tests**

Run:

```bash
bun test src/assistant/providers.test.ts
```

Expected: all tests pass.

- [x] **Step 4: Local checkpoint**

Run:

```bash
git add src/assistant/providers.ts src/assistant/providers.test.ts
git commit -m "feat: add assistant provider registry"
```

## Task 5: Local Bridge Process

**Files:**
- Create: `src/bridge/server.ts`
- Create: `src/bridge/assistant.ts`
- Create: `src/bridge/docs.ts`
- Create: `src/bridge/docs.test.ts`
- Create: `src/bridge/preview.ts`
- Create: `src/bridge/server.test.ts`

- [x] **Step 1: Implement assistant provider construction**

Create `src/bridge/assistant.ts`:

```ts
import { streamText } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { codexExec } from "ai-sdk-provider-codex-cli";
import { claudeCode } from "ai-sdk-provider-claude-code";
import type { AssistantProfile } from "../core/workspace";

export interface AssistantRequest {
  prompt: string;
  cwd: string;
  profile: AssistantProfile;
}

export async function* streamAssistantText(request: AssistantRequest): AsyncIterable<string> {
  const model = modelForProfile(request.profile);
  const result = streamText({
    model,
    prompt: request.prompt,
  });

  for await (const text of result.textStream) {
    yield text;
  }
}

function modelForProfile(profile: AssistantProfile) {
  if (profile.adapter === "codex-cli") {
    return codexExec(profile.model, {
      allowNpx: true,
      skipGitRepoCheck: true,
      approvalMode: profile.approvalMode,
      sandboxMode: profile.sandboxMode,
    });
  }

  if (profile.adapter === "claude-code") {
    return claudeCode(profile.model, {
      cwd: process.cwd(),
      permissionMode: profile.permissionMode,
    });
  }

  const envName = profile.apiKey.slice("env:".length);
  const apiKey = process.env[envName];
  if (!apiKey) throw new Error(`Missing environment variable: ${envName}`);

  const provider = createOpenAICompatible({
    name: profile.id,
    baseURL: profile.baseURL,
    apiKey,
  });
  return provider.chatModel(profile.model);
}
```

- [x] **Step 2: Implement docs fetching**

Create `src/bridge/docs.ts`:

```ts
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export interface GitHubDocsSource {
  owner: string;
  repo: string;
  ref: string;
  paths: string[];
}

export interface DocsPage {
  path: string;
  markdown: string;
  fetchedAt: string;
}

export async function fetchDocsPage(
  source: GitHubDocsSource,
  path: string,
  cacheRoot = "bridge-cache/docs",
): Promise<DocsPage> {
  validateDocsSource(source);
  validateDocsPath(path);
  if (!source.paths.includes(path)) {
    throw new Error(`docs path is not configured: ${path}`);
  }

  const cachePath = join(cacheRoot, source.owner, source.repo, source.ref, path);
  const url = `https://raw.githubusercontent.com/${source.owner}/${source.repo}/${source.ref}/${path}`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
    const markdown = await response.text();
    const page = { path, markdown, fetchedAt: new Date().toISOString() };
    await mkdir(dirname(cachePath), { recursive: true });
    await writeFile(cachePath, JSON.stringify(page, null, 2));
    return page;
  } catch (error) {
    const cached = await readFile(cachePath, "utf8").catch(() => "");
    if (cached) return JSON.parse(cached) as DocsPage;
    throw error;
  }
}

function validateDocsSource(source: GitHubDocsSource): void {
  validatePathSegment(source.owner, "docs source owner");
  validatePathSegment(source.repo, "docs source repo");
  validatePathSegment(source.ref, "docs source ref");
  for (const configuredPath of source.paths) validateDocsPath(configuredPath);
}

function validateDocsPath(path: string): void {
  if (path.startsWith("/") || path.split("/").some((segment) => segment === "..")) {
    throw new Error(`docs path must be relative and stay inside the docs cache: ${path}`);
  }
}

function validatePathSegment(value: string, field: string): void {
  if (!value || value.includes("/") || value === "." || value === "..") {
    throw new Error(`${field} is invalid`);
  }
}
```

- [x] **Step 3: Implement preview process controller**

Create `src/bridge/preview.ts`:

```ts
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";

export type PreviewState = "stopped" | "starting" | "running" | "failed";

export interface PreviewStatus {
  state: PreviewState;
  command: string;
  cwd: string;
  output: string[];
}

let child: ChildProcessWithoutNullStreams | undefined;
let status: PreviewStatus = { state: "stopped", command: "hawk2ui-cli dev", cwd: process.cwd(), output: [] };

export function currentPreviewStatus(): PreviewStatus {
  return { ...status, output: [...status.output] };
}

export function startPreview(cwd: string): PreviewStatus {
  if (child) return currentPreviewStatus();
  status = { state: "starting", command: "hawk2ui-cli dev", cwd, output: [] };
  child = spawn("hawk2ui-cli", ["dev"], { cwd, env: process.env });
  child.stdout.on("data", (chunk) => pushOutput(String(chunk)));
  child.stderr.on("data", (chunk) => pushOutput(String(chunk)));
  child.on("spawn", () => {
    status = { ...status, state: "running" };
  });
  child.on("exit", (code) => {
    status = { ...status, state: code === 0 ? "stopped" : "failed" };
    child = undefined;
  });
  return currentPreviewStatus();
}

export function stopPreview(): PreviewStatus {
  if (child) {
    child.kill("SIGTERM");
    child = undefined;
  }
  status = { ...status, state: "stopped" };
  return currentPreviewStatus();
}

function pushOutput(line: string): void {
  const output = [...status.output, line].slice(-80);
  status = { ...status, output };
}
```

- [x] **Step 4: Implement bridge routes**

Create `src/bridge/server.ts`:

```ts
import { fetchDocsPage } from "./docs";
import { currentPreviewStatus, startPreview, stopPreview } from "./preview";
import { streamAssistantText } from "./assistant";

const port = Number(process.env.HAWK2UI_EDITOR_BRIDGE_PORT ?? "47321");

export function createBridgeServer() {
  return Bun.serve({
    port,
    async fetch(request) {
      const url = new URL(request.url);

      if (request.method === "GET" && url.pathname === "/health") {
        return json({ ok: true });
      }

      if (request.method === "POST" && url.pathname === "/docs/page") {
        const body = await request.json();
        const page = await fetchDocsPage(body.source, body.path);
        return json(page);
      }

      if (request.method === "GET" && url.pathname === "/preview/status") {
        return json(currentPreviewStatus());
      }

      if (request.method === "POST" && url.pathname === "/preview/start") {
        const body = await request.json();
        return json(startPreview(String(body.cwd)));
      }

      if (request.method === "POST" && url.pathname === "/preview/stop") {
        return json(stopPreview());
      }

      if (request.method === "POST" && url.pathname === "/assistant/stream") {
        const body = await request.json();
        const stream = new ReadableStream({
          async start(controller) {
            try {
              for await (const text of streamAssistantText(body)) {
                controller.enqueue(new TextEncoder().encode(text));
              }
              controller.close();
            } catch (error) {
              controller.error(error);
            }
          },
        });
        return new Response(stream, { headers: { "content-type": "text/plain; charset=utf-8" } });
      }

      return json({ error: "not found" }, 404);
    },
  });
}

function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json" },
  });
}

if (import.meta.main) {
  createBridgeServer();
  console.log(`Hawk2UI Editor bridge listening on http://127.0.0.1:${port}`);
}
```

- [x] **Step 5: Add bridge tests**

Create `src/bridge/server.test.ts`:

```ts
import { describe, expect, test } from "bun:test";
import { currentPreviewStatus, stopPreview } from "./preview";

describe("bridge preview state", () => {
  test("starts stopped", () => {
    stopPreview();
    expect(currentPreviewStatus().state).toBe("stopped");
  });
  });
  ```

Create `src/bridge/docs.test.ts`:

```ts
import { describe, expect, test } from "bun:test";
import { fetchDocsPage } from "./docs";

describe("bridge docs fetching", () => {
  test("rejects configured paths that escape the docs cache", async () => {
    await expect(
      fetchDocsPage(
        {
          owner: "entrepeneur4lyf",
          repo: "hawk2ui",
          ref: "main",
          paths: ["../secret.md"],
        },
        "../secret.md",
      ),
    ).rejects.toThrow("docs path must be relative");
  });
});
```

- [x] **Step 6: Run bridge tests**

Run:

```bash
bun test src/bridge/server.test.ts src/bridge/docs.test.ts
```

Expected: all tests pass without live provider credentials.

- [x] **Step 7: Local checkpoint**

Run:

```bash
git add src/bridge package.json
git commit -m "feat: add local editor bridge"
```

## Task 6: Ark UI Compatibility And Floating Panels

**Files:**
- Create: `src/ui/ArkFloatingPanelProbe.vue`
- Create: `src/ui/HawkFloatingPanel.vue`

- [x] **Step 1: Add an Ark compatibility probe**

Create `src/ui/ArkFloatingPanelProbe.vue`:

```vue
<script setup lang="ts">
import { FloatingPanel } from "@ark-ui/vue/floating-panel";
</script>

<template>
  <FloatingPanel.Root
    id="probe-root"
    :default-open="true"
    :default-position="{ x: 24, y: 24 }"
    :default-size="{ width: 320, height: 240 }"
    :ids="{
      trigger: 'probe-trigger',
      positioner: 'probe-positioner',
      content: 'probe-content',
      title: 'probe-title',
      header: 'probe-header'
    }"
  >
    <FloatingPanel.Trigger as-child>
      <hawk-button id="probe-trigger-button">Panel</hawk-button>
    </FloatingPanel.Trigger>
    <FloatingPanel.Positioner as-child>
      <hawk-view id="probe-positioner-view">
        <FloatingPanel.Content as-child>
          <hawk-view id="probe-content-view">
            <FloatingPanel.DragTrigger as-child>
              <hawk-view id="probe-drag-view">
                <FloatingPanel.Header as-child>
                  <hawk-view id="probe-header-view">
                    <FloatingPanel.Title as-child>
                      <hawk-text id="probe-title-text">Probe</hawk-text>
                    </FloatingPanel.Title>
                  </hawk-view>
                </FloatingPanel.Header>
              </hawk-view>
            </FloatingPanel.DragTrigger>
            <FloatingPanel.Body as-child>
              <hawk-view id="probe-body-view">
                <hawk-text id="probe-body-text">Ark UI probe</hawk-text>
              </hawk-view>
            </FloatingPanel.Body>
          </hawk-view>
        </FloatingPanel.Content>
      </hawk-view>
    </FloatingPanel.Positioner>
  </FloatingPanel.Root>
</template>
```

- [x] **Step 2: Build the probe**

Temporarily import `ArkFloatingPanelProbe` in `src/App.vue`, render it once, and run:

```bash
bun run build
```

Expected: build succeeds. If Hawk2UI runtime rejects any Ark-generated element because it lacks a stable id, remove the temporary import and implement `HawkFloatingPanel.vue` as the active panel component for MVP.

- [x] **Step 3: Add the Hawk-native fallback panel**

Create `src/ui/HawkFloatingPanel.vue`:

```vue
<script setup lang="ts">
import type { PanelState } from "../core/workspace";

defineProps<{
  idPrefix: string;
  title: string;
  panel: PanelState;
}>();

const emit = defineEmits<{
  close: [];
  nudge: [dx: number, dy: number];
}>();
</script>

<template>
  <hawk-view :id="`${idPrefix}-panel`" class="panel" :width="panel.width" :height="panel.height">
    <hawk-view :id="`${idPrefix}-header`">
      <hawk-text :id="`${idPrefix}-title`" class="panel-title">{{ title }}</hawk-text>
      <hawk-button :id="`${idPrefix}-left`" @pointer-press="emit('nudge', -24, 0)">Left</hawk-button>
      <hawk-button :id="`${idPrefix}-right`" @pointer-press="emit('nudge', 24, 0)">Right</hawk-button>
      <hawk-button :id="`${idPrefix}-up`" @pointer-press="emit('nudge', 0, -24)">Up</hawk-button>
      <hawk-button :id="`${idPrefix}-down`" @pointer-press="emit('nudge', 0, 24)">Down</hawk-button>
      <hawk-button :id="`${idPrefix}-close`" @pointer-press="emit('close')">Close</hawk-button>
    </hawk-view>
    <slot />
  </hawk-view>
</template>
```

- [x] **Step 4: Local checkpoint**

Run:

```bash
git add src/ui/ArkFloatingPanelProbe.vue src/ui/HawkFloatingPanel.vue
git commit -m "feat: add floating panel foundation"
```

## Task 7: Docs, Assistant, Preview Clients

**Files:**
- Create: `src/assistant/client.ts`
- Create: `src/assistant/client.test.ts`
- Create: `src/docs/githubDocs.ts`
- Create: `src/docs/githubDocs.test.ts`
- Create: `src/preview/previewClient.ts`
- Create: `src/preview/previewClient.test.ts`

- [x] **Step 1: Add assistant client**

Create `src/assistant/client.ts`:

```ts
import type { AssistantProfile } from "../core/workspace";

export interface AssistantMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AssistantClientRequest {
  bridgeBaseURL: string;
  projectRoot: string;
  profile: AssistantProfile;
  prompt: string;
}

export async function sendAssistantPrompt(request: AssistantClientRequest): Promise<string> {
  const response = await fetch(`${request.bridgeBaseURL}/assistant/stream`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      prompt: request.prompt,
      cwd: request.projectRoot,
      profile: request.profile,
    }),
  });
  if (!response.ok) throw new Error(`assistant request failed: ${response.status}`);
  return response.text();
}
```

- [x] **Step 2: Add docs client and tests**

Create `src/docs/githubDocs.ts`:

```ts
export interface DocsSource {
  type: "github";
  owner: string;
  repo: string;
  ref: string;
  paths: string[];
}

export interface DocsPageRequest {
  bridgeBaseURL: string;
  source: DocsSource;
  path: string;
}

export function docsPageURL(source: DocsSource, path: string): string {
  return `https://raw.githubusercontent.com/${source.owner}/${source.repo}/${source.ref}/${path}`;
}

export async function loadDocsPage(request: DocsPageRequest): Promise<string> {
  const response = await fetch(`${request.bridgeBaseURL}/docs/page`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ source: request.source, path: request.path }),
  });
  if (!response.ok) throw new Error(`docs request failed: ${response.status}`);
  const page = (await response.json()) as { markdown: string };
  return page.markdown;
}
```

Create `src/docs/githubDocs.test.ts`:

```ts
import { describe, expect, test } from "bun:test";
import { docsPageURL } from "./githubDocs";

describe("GitHub docs", () => {
  test("builds raw GitHub markdown URLs", () => {
    expect(
      docsPageURL(
        {
          type: "github",
          owner: "entrepeneur4lyf",
          repo: "hawk2ui",
          ref: "main",
          paths: ["manual/README.md"],
        },
        "manual/README.md",
      ),
    ).toBe("https://raw.githubusercontent.com/entrepeneur4lyf/hawk2ui/main/manual/README.md");
  });
});
```

- [x] **Step 3: Add preview client and tests**

Create `src/preview/previewClient.ts`:

```ts
export type PreviewState = "stopped" | "starting" | "running" | "failed";

export interface PreviewStatus {
  state: PreviewState;
  command: string;
  cwd: string;
  output: string[];
}

export function previewStatusLabel(status: PreviewStatus): string {
  if (status.state === "running") return `Running: ${status.command}`;
  if (status.state === "starting") return `Starting: ${status.command}`;
  if (status.state === "failed") return `Failed: ${status.command}`;
  return "Stopped";
}

export async function startPreview(bridgeBaseURL: string, cwd: string): Promise<PreviewStatus> {
  const response = await fetch(`${bridgeBaseURL}/preview/start`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ cwd }),
  });
  if (!response.ok) throw new Error(`preview start failed: ${response.status}`);
  return response.json() as Promise<PreviewStatus>;
}

export async function stopPreview(bridgeBaseURL: string): Promise<PreviewStatus> {
  const response = await fetch(`${bridgeBaseURL}/preview/stop`, { method: "POST" });
  if (!response.ok) throw new Error(`preview stop failed: ${response.status}`);
  return response.json() as Promise<PreviewStatus>;
}
```

Create `src/preview/previewClient.test.ts`:

```ts
import { describe, expect, test } from "bun:test";
import { previewStatusLabel } from "./previewClient";

describe("preview client", () => {
  test("formats stopped and running labels", () => {
    expect(previewStatusLabel({ state: "stopped", command: "hawk2ui-cli dev", cwd: "/tmp/app", output: [] })).toBe("Stopped");
    expect(previewStatusLabel({ state: "running", command: "hawk2ui-cli dev", cwd: "/tmp/app", output: [] })).toBe("Running: hawk2ui-cli dev");
  });
});
```

- [x] **Step 4: Run client tests**

Run:

```bash
bun test src/assistant/client.test.ts src/docs/githubDocs.test.ts src/preview/previewClient.test.ts
```

Expected: all tests pass.

- [x] **Step 5: Local checkpoint**

Run:

```bash
git add src/assistant/client.ts src/assistant/client.test.ts src/docs src/preview
git commit -m "feat: add editor service clients"
```

## Task 8: Workbench UI

**Files:**
- Modify: `src/App.vue`
- Create: `src/ui/AssistantPanel.vue`
- Create: `src/ui/DocsPanel.vue`
- Create: `src/ui/ProjectPanel.vue`
- Create: `src/ui/PreviewPanel.vue`

- [x] **Step 1: Add assistant panel**

Create `src/ui/AssistantPanel.vue`:

```vue
<script setup lang="ts">
import { ref } from "vue";
import type { AssistantProfile } from "../core/workspace";
import { providerBadges } from "../assistant/providers";

const props = defineProps<{
  profile: AssistantProfile;
}>();

const prompt = ref("Review this Hawk2UI project and suggest the next useful change.");
const response = ref("Assistant idle.");
</script>

<template>
  <hawk-view id="assistant-panel-body">
    <hawk-text id="assistant-provider">{{ profile.label }}</hawk-text>
    <hawk-text
      v-for="(badge, index) in providerBadges(props.profile)"
      :id="`assistant-badge-${index}`"
      :key="`${badge.label}-${badge.value}`"
      class="muted"
    >
      {{ badge.label }}: {{ badge.value }}
    </hawk-text>
    <hawk-input id="assistant-prompt" v-model="prompt" />
    <hawk-button id="assistant-send" @pointer-press="response = 'Bridge request queued.'">Send</hawk-button>
    <hawk-text id="assistant-response">{{ response }}</hawk-text>
  </hawk-view>
</template>
```

- [x] **Step 2: Add docs panel**

Create `src/ui/DocsPanel.vue`:

```vue
<script setup lang="ts">
import type { DocsSource } from "../docs/githubDocs";

defineProps<{
  source: DocsSource;
}>();
</script>

<template>
  <hawk-view id="docs-panel-body">
    <hawk-text id="docs-title">Live Docs</hawk-text>
    <hawk-text id="docs-source" class="muted">
      {{ source.owner }}/{{ source.repo }}@{{ source.ref }}
    </hawk-text>
    <hawk-button id="docs-refresh">Refresh</hawk-button>
    <hawk-text id="docs-content">manual/README.md will load through the bridge.</hawk-text>
  </hawk-view>
</template>
```

- [x] **Step 3: Add project panel**

Create `src/ui/ProjectPanel.vue`:

```vue
<script setup lang="ts">
import type { HawkProjectSummary } from "../core/project";

defineProps<{
  project: HawkProjectSummary;
}>();
</script>

<template>
  <hawk-view id="project-panel-body">
    <hawk-text id="project-name">{{ project.name }}</hawk-text>
    <hawk-text id="project-id" class="muted">{{ project.packageId }}</hawk-text>
    <hawk-text id="project-framework">Framework: {{ project.framework }}</hawk-text>
    <hawk-text id="project-targets">Targets: {{ project.targets.join(", ") }}</hawk-text>
  </hawk-view>
</template>
```

- [x] **Step 4: Add preview panel**

Create `src/ui/PreviewPanel.vue`:

```vue
<script setup lang="ts">
import type { PreviewStatus } from "../preview/previewClient";
import { previewStatusLabel } from "../preview/previewClient";

defineProps<{
  status: PreviewStatus;
}>();

const emit = defineEmits<{
  start: [];
  stop: [];
}>();
</script>

<template>
  <hawk-view id="preview-panel-body">
    <hawk-text id="preview-title">Preview</hawk-text>
    <hawk-text id="preview-state">{{ previewStatusLabel(status) }}</hawk-text>
    <hawk-button id="preview-start" @pointer-press="emit('start')">Start</hawk-button>
    <hawk-button id="preview-stop" @pointer-press="emit('stop')">Stop</hawk-button>
  </hawk-view>
</template>
```

- [x] **Step 5: Replace `src/App.vue` with the editor shell**

Replace `src/App.vue`:

```vue
<script setup lang="ts">
import { computed, ref } from "vue";
import AssistantPanel from "./ui/AssistantPanel.vue";
import DocsPanel from "./ui/DocsPanel.vue";
import HawkFloatingPanel from "./ui/HawkFloatingPanel.vue";
import PreviewPanel from "./ui/PreviewPanel.vue";
import ProjectPanel from "./ui/ProjectPanel.vue";
import { activeProfile, defaultWorkspaceDocument, type PanelState } from "./core/workspace";
import { summarizeHawkManifest } from "./core/project";
import type { PreviewStatus } from "./preview/previewClient";

const workspace = ref(defaultWorkspaceDocument("/home/shawn/workspace/hawk2ui-editor"));
const project = summarizeHawkManifest(
  workspace.value.project.root,
  JSON.stringify({
    package: { id: "com.hawk2ui.editor", name: "Hawk2UI Editor", version: "0.1.0" },
    app: { entry: "src/main.ts", framework: "vue" },
    targets: { desktop: [{ name: "main" }] },
  }),
);
const preview = ref<PreviewStatus>({
  state: "stopped",
  command: workspace.value.preview.command,
  cwd: workspace.value.project.root,
  output: [],
});
const profile = computed(() => activeProfile(workspace.value));

function closePanel(name: string) {
  workspace.value.panels[name].open = false;
}

function nudgePanel(name: string, dx: number, dy: number) {
  const panel = workspace.value.panels[name];
  workspace.value.panels[name] = { ...panel, x: panel.x + dx, y: panel.y + dy };
}

function panel(name: string): PanelState {
  return workspace.value.panels[name];
}
</script>

<template>
  <hawk-view id="editor-root" class="editor-root">
    <hawk-view id="topbar" class="topbar">
      <hawk-text id="app-title">Hawk2UI Editor</hawk-text>
      <hawk-text id="app-subtitle" class="muted">Single-project workbench</hawk-text>
    </hawk-view>

    <hawk-view id="workspace" class="workspace">
      <ProjectPanel :project="project" />
    </hawk-view>

    <HawkFloatingPanel
      v-if="panel('assistant').open"
      id-prefix="assistant"
      title="Assistant"
      :panel="panel('assistant')"
      @close="closePanel('assistant')"
      @nudge="(dx, dy) => nudgePanel('assistant', dx, dy)"
    >
      <AssistantPanel :profile="profile" />
    </HawkFloatingPanel>

    <HawkFloatingPanel
      v-if="panel('docs').open"
      id-prefix="docs"
      title="Docs"
      :panel="panel('docs')"
      @close="closePanel('docs')"
      @nudge="(dx, dy) => nudgePanel('docs', dx, dy)"
    >
      <DocsPanel :source="workspace.docs.source" />
    </HawkFloatingPanel>

    <HawkFloatingPanel
      v-if="panel('preview').open"
      id-prefix="preview"
      title="Preview"
      :panel="panel('preview')"
      @close="closePanel('preview')"
      @nudge="(dx, dy) => nudgePanel('preview', dx, dy)"
    >
      <PreviewPanel
        :status="preview"
        @start="preview.state = 'starting'"
        @stop="preview.state = 'stopped'"
      />
    </HawkFloatingPanel>
  </hawk-view>
</template>
```

- [x] **Step 6: Build and validate UI**

Run:

```bash
bun test
bun run build
hawk2ui-cli validate
```

Expected: all tests pass, Vite build succeeds, and Hawk2UI validation succeeds.

- [x] **Step 7: Local checkpoint**

Run:

```bash
git add src/App.vue src/ui
git commit -m "feat: build editor workbench shell"
```

## Task 9: Dogfood Runtime Verification

**Files:**
- No required file changes unless verification finds a defect.

- [x] **Step 1: Run full local verification**

Run:

```bash
bun run verify
```

Expected: `bun test`, `bun run build`, and `hawk2ui-cli validate` all pass.

- [x] **Step 2: Start the local bridge**

Run:

```bash
bun run bridge
```

Expected: bridge prints `Hawk2UI Editor bridge listening on http://127.0.0.1:47321`.

- [x] **Step 3: Start the editor app**

In a second terminal, run:

```bash
hawk2ui-cli dev
```

Expected: Hawk2UI launches the editor app window or reports actionable runtime diagnostics.

- [x] **Step 4: Check the app window manually**

Expected visible state:

- Top bar displays `Hawk2UI Editor`.
- Project panel displays `Hawk2UI Editor`, `com.hawk2ui.editor`, and `Framework: vue`.
- Assistant panel displays Codex CLI as the active provider.
- Docs panel displays the GitHub source.
- Preview panel has Start and Stop buttons.

- [x] **Step 5: Record any framework follow-up**

If the app cannot call the bridge because runtime network/provider registration is missing, create `docs/superpowers/plans/2026-06-09-hawk2ui-editor-framework-followup.md` in this project with:

```markdown
# Hawk2UI Editor Framework Follow-Up

The editor UI and local bridge are implemented in `/home/shawn/workspace/hawk2ui-editor`.

Runtime blocker:

- The Hawk sealed runtime needs a supported way for this app to call the local editor bridge or a host-registered AI provider endpoint from `hawk:ai`.

Required framework work:

- Add or document host-side registration for `hawk:ai` provider endpoints during `hawk2ui-cli dev`.
- Add or document safe localhost network access for dev-only editor bridge calls.
- Preserve deny-by-default behavior for release builds.
```

- [x] **Step 6: Final local checkpoint**

Run:

```bash
git status --short
git add docs/superpowers/plans/2026-06-09-hawk2ui-editor-framework-followup.md 2>/dev/null || true
git commit -m "docs: record editor framework follow-up" || true
```

Expected: if no follow-up was needed, the commit command reports nothing to commit. Do not force a commit.

## Task 10: WebviewJS Code Editor Sidecar

**Files:**
- Modify: `package.json`
- Modify: `src/bridge/server.ts`
- Create: `src/bridge/webviewEditor.ts`
- Create: `src/bridge/webviewEditorProcess.ts`
- Create: `src/bridge/webviewEditor.test.ts`
- Create: `src/webview-editor/index.html`
- Create: `src/webview-editor/main.ts`
- Create: `src/webview-editor/editor.css`
- Modify: `src/ui/ProjectPanel.vue`
- Modify: `README.md`

Implementation note: the delivered sidecar keeps the same bridge/editor boundary as this task, but runs WebviewJS in a spawned process rather than inside the bridge. `Application.run()` blocks, and native webviews do not execute TypeScript files directly, so the implementation builds `src/webview-editor/main.ts` into `dist/webview-editor/main.js` and loads that browser bundle into the WebviewJS process.

- [x] **Step 1: Add example-only webview/editor dependencies**

Update `package.json` dependencies with:

```json
{
  "@codemirror/commands": "^6.10.3",
  "@codemirror/lang-javascript": "^6.2.5",
  "@codemirror/state": "^6.6.0",
  "@codemirror/view": "^6.43.1",
  "@hawk2ui/editor-webview": "^0.1.4"
}
```

Expected: these dependencies live only in `hawk2ui-editor`. Do not add them to the Hawk2UI framework repo. Start with the project-standard Bun workflow and record any WebviewJS install/runtime failure before choosing a fallback.

- [x] **Step 2: Document the sidecar boundary in README**

Add this section to `README.md`:

```markdown
## Code editor sidecar

The code editor window is an example-only WebviewJS sidecar. Hawk2UI renders the native workbench shell; WebviewJS hosts DOM-heavy editor widgets such as CodeMirror. This app uses the sidecar to demonstrate interop for developers who need a webview, but Hawk2UI does not distribute WebviewJS as framework functionality.
```

- [x] **Step 3: Add the WebviewJS sidecar controller**

Create `src/bridge/webviewEditor.ts`:

```ts
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

export interface EditorSidecarState {
  state: "closed" | "opening" | "open" | "failed";
  filePath: string | null;
  message: string;
}

let state: EditorSidecarState = {
  state: "closed",
  filePath: null,
  message: "Editor sidecar is closed.",
};

export function currentEditorSidecarState(): EditorSidecarState {
  return { ...state };
}

export async function openEditorSidecar(filePath: string): Promise<EditorSidecarState> {
  const resolved = resolve(filePath);
  if (!existsSync(resolved)) {
    state = { state: "failed", filePath: resolved, message: `File does not exist: ${resolved}` };
    return currentEditorSidecarState();
  }

  state = { state: "opening", filePath: resolved, message: "Opening WebviewJS editor sidecar." };
  const { Application } = await import("@hawk2ui/editor-webview");
  const html = readFileSync(resolve("src/webview-editor/index.html"), "utf8");
  const initialText = readFileSync(resolved, "utf8");

  const app = new Application();
  const window = app.createBrowserWindow({ title: `Hawk2UI Editor - ${resolved}` });
  const webview = window.createWebview({
    html,
    preload: `window.__HAWK_INITIAL_TEXT__ = ${JSON.stringify(initialText)};`,
  });

  webview.onIpcMessage((event: { body: Buffer }) => {
    const payload = JSON.parse(event.body.toString("utf8")) as { type: string; text?: string };
    if (payload.type === "save" && typeof payload.text === "string") {
      writeFileSync(resolved, payload.text);
    }
  });

  state = { state: "open", filePath: resolved, message: "Editor sidecar is open." };
  setTimeout(() => app.run(), 0);
  return currentEditorSidecarState();
}
```

- [x] **Step 4: Add sidecar state tests**

Create `src/bridge/webviewEditor.test.ts`:

```ts
import { describe, expect, test } from "bun:test";
import { currentEditorSidecarState } from "./webviewEditor";

describe("webview editor sidecar", () => {
  test("starts closed", () => {
    expect(currentEditorSidecarState()).toEqual({
      state: "closed",
      filePath: null,
      message: "Editor sidecar is closed.",
    });
  });
});
```

- [x] **Step 5: Add the webview HTML shell**

Create `src/webview-editor/index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Hawk2UI Code Editor</title>
    <link rel="stylesheet" href="./editor.css" />
  </head>
  <body>
    <main id="app">
      <header>
        <strong>Hawk2UI Code Editor</strong>
        <button id="save">Save</button>
      </header>
      <section id="editor"></section>
    </main>
    <script type="module" src="./main.ts"></script>
  </body>
</html>
```

- [x] **Step 6: Add the CodeMirror editor entry**

Create `src/webview-editor/main.ts`:

```ts
import { defaultKeymap, indentWithTab } from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import "./editor.css";

declare global {
  interface Window {
    __HAWK_INITIAL_TEXT__?: string;
    ipc?: { postMessage(message: string): void };
  }
}

const editorRoot = document.getElementById("editor");
if (!editorRoot) throw new Error("missing editor root");

const view = new EditorView({
  parent: editorRoot,
  state: EditorState.create({
    doc: window.__HAWK_INITIAL_TEXT__ ?? "",
    extensions: [javascript({ typescript: true }), keymap.of([indentWithTab, ...defaultKeymap])],
  }),
});

document.getElementById("save")?.addEventListener("click", () => {
  window.ipc?.postMessage(JSON.stringify({ type: "save", text: view.state.doc.toString() }));
});
```

- [x] **Step 7: Add webview-only editor styling**

Create `src/webview-editor/editor.css`:

```css
html,
body,
#app {
  height: 100%;
  margin: 0;
}

body {
  background: #111318;
  color: #f4f7fb;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
}

header {
  align-items: center;
  background: #1b2029;
  border-bottom: 1px solid #303846;
  display: flex;
  height: 44px;
  justify-content: space-between;
  padding: 0 12px;
}

button {
  background: #2d7ff9;
  border: 0;
  color: white;
  font-weight: 600;
  padding: 6px 12px;
}

#editor {
  height: calc(100% - 45px);
}

.cm-editor {
  height: 100%;
}
```

- [x] **Step 8: Add bridge routes for the sidecar**

Add routes to `src/bridge/server.ts`:

```ts
if (request.method === "GET" && url.pathname === "/editor/status") {
  return json(currentEditorSidecarState());
}

if (request.method === "POST" && url.pathname === "/editor/open") {
  const body = await request.json();
  return json(await openEditorSidecar(String(body.filePath)));
}
```

Import:

```ts
import { currentEditorSidecarState, openEditorSidecar } from "./webviewEditor";
```

- [x] **Step 9: Add a workbench affordance**

Add a button to `src/ui/ProjectPanel.vue`:

```vue
<hawk-button id="open-app-vue">Open src/App.vue in sidecar editor</hawk-button>
```

The first pass may display the affordance without wiring it through Hawk runtime networking. The bridge route and sidecar are the actual integration point.

- [x] **Step 10: Verify the sidecar task**

Run:

```bash
bun install
bun test src/bridge/webviewEditor.test.ts
bun run build
hawk2ui-cli validate
```

Expected: tests, build, and validation pass. If WebviewJS native install or runtime behavior fails on the current platform, record the exact failure and keep the sidecar task behind a feature flag until the fallback is chosen.

Verification note: `bun test`, the browser editor bundle, `bun run build`, and `hawk2ui-cli validate` pass. The sidecar now uses the published `@hawk2ui/editor-webview@0.1.4` package, whose supported native optional packages are published under the same version. The sidecar remains gated behind `HAWK2UI_EDITOR_WEBVIEW_SIDECAR=1`.

- [x] **Step 11: Local checkpoint**

Run:

```bash
git add package.json bun.lock README.md docs/superpowers/plans/2026-06-09-hawk2ui-editor-implementation.md src/bridge src/webview-editor src/ui/ProjectPanel.vue
git commit -m "feat: add webview code editor sidecar"
```

## Plan Self-Review

- Spec coverage: single-project workbench, `hawk.json`/`workspace.hawk` split, AI SDK provider facade, OpenAI-compatible NIM example, GitHub docs, separate preview window, and Vue dogfood app are covered.
- Public repo safety: all plan and implementation files are inside `/home/shawn/workspace/hawk2ui-editor`.
- Secret handling: provider profiles store `env:` references only; tests assert raw secret redaction.
- Runtime honesty: AI SDK and preview process execution are not placed in sealed frontend code; they run in a local Bun bridge and are called through explicit clients.
- Ark UI risk: compatibility is tested before depending on Ark as the active floating panel implementation; the Hawk-native fallback keeps the app buildable.
- Code editor realism: DOM-heavy code editing is handled by an example-only WebviewJS sidecar. Hawk2UI does not distribute WebviewJS or claim a Hawk-native code editor component.
- Verification: each module has Bun tests where useful; final checks run `bun test`, `bun run build`, and `hawk2ui-cli validate`.
