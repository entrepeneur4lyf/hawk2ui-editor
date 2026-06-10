import { existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { resolveProjectPath } from "./files";
import type { ResolvedWorkbenchTheme } from "../theme/workbenchTheme";

export interface TerminalSidecarState {
  state: "closed" | "opening" | "open" | "failed";
  root: string | null;
  cols: number;
  rows: number;
  lastError: string | null;
  message: string;
}

export type TerminalSidecarMessage =
  | { type: "terminalReady"; root: string; cols?: number; rows?: number }
  | { type: "terminalError"; root?: string; message: string };

interface TerminalSidecarPayload {
  projectRoot: string;
  scriptPath: string;
  terminalUrl: string;
  cols: number;
  rows: number;
  theme: ResolvedWorkbenchTheme;
}

const terminalEventPrefix = "HAWK_TERMINAL_EVENT ";

let state: TerminalSidecarState = closedTerminalSidecarState();
let activeProcess: ReturnType<typeof Bun.spawn> | null = null;

export const webviewPackageName = "@hawk2ui/editor-webview";
export const terminalRendererPackageName = "@wterm/dom";

export function currentTerminalSidecarState(): TerminalSidecarState {
  return { ...state };
}

export function closeTerminalSidecar(): TerminalSidecarState {
  activeProcess?.kill();
  activeProcess = null;
  state = closedTerminalSidecarState();
  return currentTerminalSidecarState();
}

export function handleTerminalSidecarMessage(message: TerminalSidecarMessage): TerminalSidecarState {
  const root = message.root ?? state.root;

  if (message.type === "terminalReady") {
    state = {
      ...state,
      state: "open",
      root,
      cols: positiveInteger(message.cols, state.cols),
      rows: positiveInteger(message.rows, state.rows),
      lastError: null,
      message: "Terminal sidecar is ready.",
    };
  } else {
    state = {
      ...state,
      state: "failed",
      root,
      lastError: message.message,
      message: message.message,
    };
  }

  return currentTerminalSidecarState();
}

export async function openTerminalSidecar(
  projectRoot: string,
  theme: ResolvedWorkbenchTheme = "black",
): Promise<TerminalSidecarState> {
  const root = resolveProjectPath(projectRoot, ".");
  if (!existsSync(root)) {
    const message = `project root does not exist: ${root}`;
    state = failedTerminalSidecarState(null, message);
    return currentTerminalSidecarState();
  }

  if (!statSync(root).isDirectory()) {
    const message = `project root is not a directory: ${root}`;
    state = failedTerminalSidecarState(null, message);
    return currentTerminalSidecarState();
  }

  if (process.env.HAWK2UI_EDITOR_TERMINAL !== "1") {
    const message = "Terminal sidecar is disabled. Set HAWK2UI_EDITOR_TERMINAL=1 to enable the wterm WebviewJS example.";
    state = failedTerminalSidecarState(root, message);
    return currentTerminalSidecarState();
  }

  state = {
    ...defaultTerminalSidecarState(),
    state: "opening",
    root,
    message: "Opening wterm WebviewJS terminal sidecar.",
  };

  try {
    await verifyTerminalSidecarDependencies();
    const scriptPath = await buildWebviewTerminalBundle();
    const payloadPath = writeTerminalPayload({
      projectRoot: root,
      scriptPath,
      terminalUrl: `ws://127.0.0.1:${Number(process.env.HAWK2UI_EDITOR_BRIDGE_PORT ?? "47321")}/terminal?root=${encodeURIComponent(root)}`,
      cols: state.cols,
      rows: state.rows,
      theme,
    });

    activeProcess?.kill();
    activeProcess = Bun.spawn({
      cmd: [process.execPath, resolve("src/bridge/webviewTerminalProcess.ts"), payloadPath],
      stdout: "pipe",
      stderr: "pipe",
      env: process.env,
    });
    consumeTerminalProcessOutput(activeProcess.stdout);
    drainTerminalProcessOutput(activeProcess.stderr);

    activeProcess.exited.then((code) => {
      if (state.root === root && code !== 0) {
        const message = `Terminal sidecar exited with code ${code}.`;
        state = { ...state, state: "failed", root, lastError: message, message };
      } else if (state.root === root) {
        state = closedTerminalSidecarState();
      }
    });
  } catch (error) {
    state = failedTerminalSidecarState(
      root,
      error instanceof Error ? error.message : "Failed to open terminal sidecar.",
    );
  }

  return currentTerminalSidecarState();
}

async function verifyTerminalSidecarDependencies(): Promise<void> {
  try {
    await import("@hawk2ui/editor-webview");
    await import("@wterm/dom");
  } catch (error) {
    throw new Error(
      `Terminal sidecar dependencies are unavailable: ${error instanceof Error ? error.message : "unknown import failure"}`,
    );
  }
}

async function buildWebviewTerminalBundle(): Promise<string> {
  const outdir = resolve("dist/webview-terminal");
  const result = await Bun.build({
    entrypoints: [resolve("src/webview-terminal/main.ts")],
    outdir,
    target: "browser",
    format: "esm",
    sourcemap: "external",
    minify: false,
  });

  if (!result.success) {
    throw new Error(`Failed to build webview terminal bundle: ${result.logs.map((log) => log.message).join("; ")}`);
  }

  const scriptPath = resolve(outdir, "main.js");
  if (!existsSync(scriptPath)) {
    throw new Error(`Webview terminal bundle was not created: ${scriptPath}`);
  }

  return scriptPath;
}

function writeTerminalPayload(payload: TerminalSidecarPayload): string {
  const payloadPath = resolve(".hawk2ui-cache/webview-terminal/payload.json");
  mkdirSync(dirname(payloadPath), { recursive: true });
  writeFileSync(payloadPath, `${JSON.stringify(payload)}\n`);
  return payloadPath;
}

function consumeTerminalProcessOutput(stream: ReadableStream<Uint8Array> | null | undefined): void {
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
        handleTerminalProcessLine(line);
      }
    }

    buffer += decoder.decode();
    if (buffer) handleTerminalProcessLine(buffer);
  })().catch((error) => {
    handleTerminalSidecarMessage({
      type: "terminalError",
      message: error instanceof Error ? error.message : "Failed to read terminal sidecar output.",
    });
  });
}

function drainTerminalProcessOutput(stream: ReadableStream<Uint8Array> | null | undefined): void {
  if (!stream) return;
  void stream.pipeTo(new WritableStream({ write() {} })).catch(() => {});
}

function handleTerminalProcessLine(line: string): void {
  if (!line.startsWith(terminalEventPrefix)) return;

  try {
    const message = parseTerminalSidecarMessage(JSON.parse(line.slice(terminalEventPrefix.length)));
    if (message) handleTerminalSidecarMessage(message);
  } catch (error) {
    handleTerminalSidecarMessage({
      type: "terminalError",
      message: error instanceof Error ? error.message : "Invalid terminal sidecar event.",
    });
  }
}

function parseTerminalSidecarMessage(value: unknown): TerminalSidecarMessage | null {
  if (!isRecord(value) || typeof value.type !== "string") return null;

  if (value.type === "terminalReady" && typeof value.root === "string") {
    return {
      type: "terminalReady",
      root: value.root,
      cols: typeof value.cols === "number" ? value.cols : undefined,
      rows: typeof value.rows === "number" ? value.rows : undefined,
    };
  }

  if (value.type === "terminalError" && typeof value.message === "string") {
    return {
      type: "terminalError",
      root: typeof value.root === "string" ? value.root : undefined,
      message: value.message,
    };
  }

  return null;
}

function defaultTerminalSidecarState(): Omit<TerminalSidecarState, "state" | "root" | "message"> {
  return {
    cols: 80,
    rows: 24,
    lastError: null,
  };
}

function closedTerminalSidecarState(): TerminalSidecarState {
  return {
    ...defaultTerminalSidecarState(),
    state: "closed",
    root: null,
    message: "Terminal sidecar is closed.",
  };
}

function failedTerminalSidecarState(root: string | null, message: string): TerminalSidecarState {
  return {
    ...defaultTerminalSidecarState(),
    state: "failed",
    root,
    lastError: message,
    message,
  };
}

function positiveInteger(value: number | undefined, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(1, Math.floor(value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
