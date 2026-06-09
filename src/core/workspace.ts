import { defaultWorkbenchPanels } from "./workbench";

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
    panels: defaultWorkbenchPanels(),
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
  const value = JSON.parse(source) as unknown;
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

function assertWorkspaceDocument(value: unknown): asserts value is WorkspaceDocument {
  if (!isRecord(value)) throw new Error("workspace must be an object");
  if (value.schemaVersion !== 1) throw new Error("workspace.schemaVersion must be 1");

  const project = requireRecord(value.project, "workspace.project");
  requireNonEmptyString(project.root, "workspace.project.root");

  const ai = requireRecord(value.ai, "workspace.ai");
  const activeProfileId = requireNonEmptyString(ai.activeProfile, "workspace.ai.activeProfile");
  if (!Array.isArray(ai.profiles) || ai.profiles.length === 0) {
    throw new Error("workspace.ai.profiles must contain at least one profile");
  }
  for (const profile of ai.profiles) validateProfile(profile);
  if (!ai.profiles.some((profile) => isRecord(profile) && profile.id === activeProfileId)) {
    throw new Error("workspace.ai.activeProfile is invalid");
  }

  const editor = requireRecord(value.editor, "workspace.editor");
  if (editor.theme !== "system" && editor.theme !== "light" && editor.theme !== "dark") {
    throw new Error("workspace.editor.theme is invalid");
  }
  requireNonEmptyString(editor.layout, "workspace.editor.layout");

  const panels = requireRecord(value.panels, "workspace.panels");
  for (const [name, panel] of Object.entries(panels)) validatePanel(name, panel);

  const docs = requireRecord(value.docs, "workspace.docs");
  const source = requireRecord(docs.source, "workspace.docs.source");
  if (source.type !== "github") throw new Error("workspace.docs.source.type must be github");
  requireNonEmptyString(source.owner, "workspace.docs.source.owner");
  requireNonEmptyString(source.repo, "workspace.docs.source.repo");
  requireNonEmptyString(source.ref, "workspace.docs.source.ref");
  if (!Array.isArray(source.paths) || !source.paths.every((path) => typeof path === "string" && path.trim() !== "")) {
    throw new Error("workspace.docs.source.paths must contain paths");
  }
  if (docs.lastRefresh !== null && typeof docs.lastRefresh !== "string") {
    throw new Error("workspace.docs.lastRefresh must be a string or null");
  }

  const preview = requireRecord(value.preview, "workspace.preview");
  requireNonEmptyString(preview.command, "workspace.preview.command");
  if (preview.mode !== "separate-window") throw new Error("workspace.preview.mode must be separate-window");
  if (typeof preview.autoStart !== "boolean") throw new Error("workspace.preview.autoStart must be a boolean");

  const bridge = requireRecord(value.bridge, "workspace.bridge");
  requireNonEmptyString(bridge.baseURL, "workspace.bridge.baseURL");
}

function validateProfile(profile: unknown): asserts profile is AssistantProfile {
  if (!isRecord(profile)) throw new Error("workspace.ai.profile must be an object");
  const id = requireNonEmptyString(profile.id, "workspace.ai.profile.id");
  requireNonEmptyString(profile.label, `workspace.ai.profile.label: ${id}`);
  requireNonEmptyString(profile.model, `workspace.ai.profile.model: ${id}`);
  validateCapabilities(profile.capabilities, id);

  if (profile.adapter === "codex-cli") {
    if (profile.kind !== "agent") throw new Error(`workspace.ai.profile.kind must be agent: ${id}`);
    if (!["untrusted", "on-failure", "on-request", "never"].includes(String(profile.approvalMode))) {
      throw new Error(`workspace.ai.profile.approvalMode is invalid: ${id}`);
    }
    if (!["read-only", "workspace-write", "danger-full-access"].includes(String(profile.sandboxMode))) {
      throw new Error(`workspace.ai.profile.sandboxMode is invalid: ${id}`);
    }
    return;
  }

  if (profile.adapter === "claude-code") {
    if (profile.kind !== "agent") throw new Error(`workspace.ai.profile.kind must be agent: ${id}`);
    if (!["default", "acceptEdits", "bypassPermissions", "plan"].includes(String(profile.permissionMode))) {
      throw new Error(`workspace.ai.profile.permissionMode is invalid: ${id}`);
    }
    return;
  }

  if (profile.adapter === "openai-compatible") {
    if (profile.kind !== "chat") throw new Error(`workspace.ai.profile.kind must be chat: ${id}`);
    const baseURL = requireNonEmptyString(profile.baseURL, `workspace.ai.profile.baseURL: ${id}`);
    if (!baseURL.startsWith("https://") && !baseURL.startsWith("http://")) {
      throw new Error(`workspace.ai.profile.baseURL must be absolute: ${id}`);
    }
    const apiKey = requireNonEmptyString(profile.apiKey, `workspace.ai.profile.apiKey: ${id}`);
    if (!apiKey.startsWith("env:")) {
      throw new Error(`workspace.ai.profile.apiKey must be an env reference: ${id}`);
    }
    return;
  }

  throw new Error(`workspace.ai.profile.adapter is invalid: ${id}`);
}

function validateCapabilities(value: unknown, profileId: string): asserts value is AssistantCapability[] {
  if (!Array.isArray(value) || !value.every((capability) => typeof capability === "string" && capability.trim() !== "")) {
    throw new Error(`workspace.ai.profile.capabilities must be strings: ${profileId}`);
  }
}

function validatePanel(name: string, panel: unknown): asserts panel is PanelState {
  if (!isRecord(panel)) throw new Error(`workspace.panels.${name} must be an object`);
  if (typeof panel.open !== "boolean") throw new Error(`workspace.panels.${name}.open must be a boolean`);
  if (!isFiniteNumber(panel.x) || !isFiniteNumber(panel.y)) throw new Error(`workspace.panels.${name}.position is invalid`);
  if (!isFiniteNumber(panel.width) || panel.width < 160) throw new Error(`workspace.panels.${name}.width is invalid`);
  if (!isFiniteNumber(panel.height) || panel.height < 120) throw new Error(`workspace.panels.${name}.height is invalid`);
}

function requireRecord(value: unknown, field: string): Record<string, unknown> {
  if (!isRecord(value)) throw new Error(`${field} is required`);
  return value;
}

function requireNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`${field} is required`);
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}
