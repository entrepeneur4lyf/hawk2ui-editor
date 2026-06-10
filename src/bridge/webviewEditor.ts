import { existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { readProjectFile, resolveProjectPath } from "./files";
import type { ResolvedWorkbenchTheme } from "../theme/workbenchTheme";

export interface EditorSidecarState {
  state: "closed" | "opening" | "open" | "failed";
  filePath: string | null;
  relativePath: string | null;
  dirty: boolean;
  line: number;
  column: number;
  lastSavedAt: string | null;
  lastError: string | null;
  message: string;
}

export type EditorSidecarMessage =
  | { type: "editorReady"; path: string; line?: number; column?: number }
  | { type: "documentChanged"; path: string; dirty: boolean }
  | { type: "selectionChanged"; path: string; line: number; column: number }
  | { type: "saveRequested"; path: string }
  | { type: "documentSaved"; path: string; savedAt?: string }
  | { type: "editorError"; path?: string; message: string };

export interface EditorSidecarPayload {
  projectRoot: string;
  relativePath: string;
  filePath: string;
  initialText: string;
  scriptPath: string;
  theme: ResolvedWorkbenchTheme;
}

export type EditorSidecarPayloadInput = Omit<EditorSidecarPayload, "theme"> & {
  theme?: ResolvedWorkbenchTheme;
};

export type EditorSidecarLogger = (message: string) => void;

const editorEventPrefix = "HAWK_EDITOR_EVENT ";

let state: EditorSidecarState = closedEditorSidecarState();

let activeProcess: ReturnType<typeof Bun.spawn> | null = null;

export const webviewPackageName = "@hawk2ui/editor-webview";

export function currentEditorSidecarState(): EditorSidecarState {
  return { ...state };
}

export function closeEditorSidecar(): EditorSidecarState {
  activeProcess?.kill();
  activeProcess = null;
  state = closedEditorSidecarState();
  return currentEditorSidecarState();
}

export function handleEditorSidecarMessage(message: EditorSidecarMessage): EditorSidecarState {
  const relativePath = message.path ?? state.relativePath;

  if (message.type === "editorReady") {
    state = {
      ...state,
      state: "open",
      relativePath,
      dirty: false,
      line: positiveInteger(message.line, 1),
      column: positiveInteger(message.column, 1),
      lastError: null,
      message: `Editor sidecar is ready: ${relativePath}`,
    };
  } else if (message.type === "documentChanged") {
    state = {
      ...state,
      state: state.state === "closed" ? "open" : state.state,
      relativePath,
      dirty: message.dirty,
      message: message.dirty ? `Unsaved changes in ${relativePath}.` : `No unsaved changes in ${relativePath}.`,
    };
  } else if (message.type === "selectionChanged") {
    state = {
      ...state,
      state: state.state === "closed" ? "open" : state.state,
      relativePath,
      line: positiveInteger(message.line, state.line),
      column: positiveInteger(message.column, state.column),
    };
  } else if (message.type === "saveRequested") {
    state = {
      ...state,
      state: state.state === "closed" ? "open" : state.state,
      relativePath,
      message: `Saving ${relativePath}.`,
    };
  } else if (message.type === "documentSaved") {
    state = {
      ...state,
      state: state.state === "closed" ? "open" : state.state,
      relativePath,
      dirty: false,
      lastSavedAt: message.savedAt ?? new Date().toISOString(),
      lastError: null,
      message: `Saved ${relativePath}.`,
    };
  } else {
    state = {
      ...state,
      state: state.state === "closed" ? "failed" : state.state,
      relativePath,
      lastError: message.message,
      message: message.message,
    };
  }

  return currentEditorSidecarState();
}

export function createEditorSidecarPayload(input: EditorSidecarPayloadInput): EditorSidecarPayload {
  return { ...input, theme: input.theme ?? "black" };
}

export async function openEditorSidecar(
  projectRoot: string,
  relativePath: string,
  theme: ResolvedWorkbenchTheme = "black",
  log: EditorSidecarLogger = () => {},
): Promise<EditorSidecarState> {
  let resolved: string;
  try {
    resolved = resolveProjectPath(projectRoot, relativePath);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid editor sidecar path.";
    log(`[editor] launch rejected: ${message}`);
    state = failedEditorSidecarState(null, null, message);
    return currentEditorSidecarState();
  }

  log(`[editor] launch requested: ${relativePath} (${resolved}) theme=${theme}`);
  if (process.env.HAWK2UI_EDITOR_WEBVIEW_SIDECAR === "0") {
    const message = "Editor sidecar is disabled by HAWK2UI_EDITOR_WEBVIEW_SIDECAR=0.";
    log("[editor] launch blocked: HAWK2UI_EDITOR_WEBVIEW_SIDECAR=0");
    state = failedEditorSidecarState(resolved, relativePath, message);
    return currentEditorSidecarState();
  }

  if (!existsSync(resolved)) {
    log(`[editor] launch failed: file does not exist: ${resolved}`);
    state = failedEditorSidecarState(resolved, relativePath, `File does not exist: ${resolved}`);
    return currentEditorSidecarState();
  }

  if (!statSync(resolved).isFile()) {
    log(`[editor] launch failed: path is not a file: ${resolved}`);
    state = failedEditorSidecarState(resolved, relativePath, `Path is not a file: ${resolved}`);
    return currentEditorSidecarState();
  }

  state = {
    ...defaultEditorSidecarState(),
    state: "opening",
    filePath: resolved,
    relativePath,
    message: "Opening WebviewJS editor sidecar.",
  };

  try {
    log(`[editor] verifying native webview binding: ${webviewPackageName}`);
    await verifyWebviewBinding();
    log("[editor] native webview binding loaded");
    const scriptPath = await buildWebviewEditorBundle();
    log(`[editor] webview bundle built: ${scriptPath}`);
    const file = await readProjectFile(projectRoot, relativePath);
    const payloadPath = writeEditorPayload(createEditorSidecarPayload({
      projectRoot,
      relativePath,
      filePath: resolved,
      initialText: file.content,
      scriptPath,
      theme,
    }));
    log(`[editor] launch payload written: ${payloadPath}`);

    if (activeProcess) {
      log("[editor] stopping previous editor sidecar process");
      activeProcess.kill();
    }
    activeProcess = Bun.spawn({
      cmd: [process.execPath, resolve("src/bridge/webviewEditorProcess.ts"), payloadPath],
      stdout: "pipe",
      stderr: "pipe",
      env: process.env,
    });
    log(`[editor] spawned sidecar process pid=${activeProcess.pid}`);
    consumeEditorProcessOutput(activeProcess.stdout, log);
    consumeEditorErrorOutput(activeProcess.stderr, log);

    activeProcess.exited.then((code) => {
      log(`[editor] sidecar process exited code=${code}`);
      if (state.filePath === resolved && code !== 0) {
        state = {
          ...state,
          state: "failed",
          filePath: resolved,
          relativePath,
          lastError: `Editor sidecar exited with code ${code}.`,
          message: `Editor sidecar exited with code ${code}.`,
        };
      } else if (state.filePath === resolved) {
        state = closedEditorSidecarState();
      }
    });

    state = {
      ...defaultEditorSidecarState(),
      state: "open",
      filePath: resolved,
      relativePath,
      message: "Editor sidecar is open.",
    };
  } catch (error) {
    log(`[editor] launch failed: ${error instanceof Error ? error.message : "unknown error"}`);
    state = failedEditorSidecarState(
      resolved,
      relativePath,
      error instanceof Error ? error.message : "Failed to open editor sidecar.",
    );
  }

  return currentEditorSidecarState();
}

async function verifyWebviewBinding(): Promise<void> {
  try {
    await import("@hawk2ui/editor-webview");
  } catch (error) {
    throw new Error(
      `Hawk2UI editor webview native binding is unavailable: ${
        error instanceof Error ? error.message : "unknown import failure"
      }`,
    );
  }
}

async function buildWebviewEditorBundle(): Promise<string> {
  const outdir = resolve("dist/webview-editor");
  const result = await Bun.build({
    entrypoints: [resolve("src/webview-editor/main.ts")],
    outdir,
    target: "browser",
    format: "esm",
    sourcemap: "external",
    minify: false,
  });

  if (!result.success) {
    throw new Error(`Failed to build webview editor bundle: ${result.logs.map((log) => log.message).join("; ")}`);
  }

  const scriptPath = resolve(outdir, "main.js");
  if (!existsSync(scriptPath)) {
    throw new Error(`Webview editor bundle was not created: ${scriptPath}`);
  }

  return scriptPath;
}

function writeEditorPayload(payload: EditorSidecarPayload): string {
  const payloadPath = resolve(".hawk2ui-cache/webview-editor/payload.json");
  mkdirSync(dirname(payloadPath), { recursive: true });
  writeFileSync(payloadPath, `${JSON.stringify(payload)}\n`);
  return payloadPath;
}

function defaultEditorSidecarState(): Omit<EditorSidecarState, "state" | "filePath" | "relativePath" | "message"> {
  return {
    dirty: false,
    line: 1,
    column: 1,
    lastSavedAt: null,
    lastError: null,
  };
}

function closedEditorSidecarState(): EditorSidecarState {
  return {
    ...defaultEditorSidecarState(),
    state: "closed",
    filePath: null,
    relativePath: null,
    message: "Editor sidecar is closed.",
  };
}

function failedEditorSidecarState(filePath: string | null, relativePath: string | null, message: string): EditorSidecarState {
  return {
    ...defaultEditorSidecarState(),
    state: "failed",
    filePath,
    relativePath,
    lastError: message,
    message,
  };
}

function consumeEditorProcessOutput(stream: ReadableStream<Uint8Array> | null | undefined, log: EditorSidecarLogger): void {
  if (!stream) return;

  void (async () => {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      buffer += decoder.decode(chunk.value, { stream: true });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        handleEditorProcessLine(line, log);
      }
    }

    buffer += decoder.decode();
    if (buffer) handleEditorProcessLine(buffer, log);
  })().catch((error) => {
    const next = handleEditorSidecarMessage({
      type: "editorError",
      message: error instanceof Error ? error.message : "Failed to read editor sidecar output.",
    });
    log(`[editor] sidecar output read failed: ${next.message}`);
  });
}

function consumeEditorErrorOutput(stream: ReadableStream<Uint8Array> | null | undefined, log: EditorSidecarLogger): void {
  if (!stream) return;
  void (async () => {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      buffer += decoder.decode(chunk.value, { stream: true });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (line.trim()) log(`[editor:stderr] ${line}`);
      }
    }

    buffer += decoder.decode();
    if (buffer.trim()) log(`[editor:stderr] ${buffer}`);
  })().catch((error) => {
    log(`[editor] sidecar stderr read failed: ${error instanceof Error ? error.message : "unknown error"}`);
  });
}

function handleEditorProcessLine(line: string, log: EditorSidecarLogger): void {
  if (!line.startsWith(editorEventPrefix)) {
    if (line.trim()) log(`[editor:stdout] ${line}`);
    return;
  }

  try {
    const message = parseEditorSidecarMessage(JSON.parse(line.slice(editorEventPrefix.length)));
    if (message) {
      const next = handleEditorSidecarMessage(message);
      log(`[editor] sidecar event ${message.type}: ${next.message}`);
    }
  } catch (error) {
    const next = handleEditorSidecarMessage({
      type: "editorError",
      message: error instanceof Error ? error.message : "Invalid editor sidecar event.",
    });
    log(`[editor] invalid sidecar event: ${next.message}`);
  }
}

function parseEditorSidecarMessage(value: unknown): EditorSidecarMessage | null {
  if (!isRecord(value) || typeof value.type !== "string") return null;

  if (value.type === "editorReady" && typeof value.path === "string") {
    return {
      type: "editorReady",
      path: value.path,
      line: typeof value.line === "number" ? value.line : undefined,
      column: typeof value.column === "number" ? value.column : undefined,
    };
  }

  if (value.type === "documentChanged" && typeof value.path === "string" && typeof value.dirty === "boolean") {
    return { type: "documentChanged", path: value.path, dirty: value.dirty };
  }

  if (
    value.type === "selectionChanged" &&
    typeof value.path === "string" &&
    typeof value.line === "number" &&
    typeof value.column === "number"
  ) {
    return { type: "selectionChanged", path: value.path, line: value.line, column: value.column };
  }

  if (value.type === "saveRequested" && typeof value.path === "string") {
    return { type: "saveRequested", path: value.path };
  }

  if (value.type === "documentSaved" && typeof value.path === "string") {
    return {
      type: "documentSaved",
      path: value.path,
      savedAt: typeof value.savedAt === "string" ? value.savedAt : undefined,
    };
  }

  if (value.type === "editorError" && typeof value.message === "string") {
    return {
      type: "editorError",
      path: typeof value.path === "string" ? value.path : undefined,
      message: value.message,
    };
  }

  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function positiveInteger(value: number | undefined, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(1, Math.floor(value));
}
