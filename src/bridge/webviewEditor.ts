import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

export interface EditorSidecarState {
  state: "closed" | "opening" | "open" | "failed";
  filePath: string | null;
  message: string;
}

interface EditorSidecarPayload {
  filePath: string;
  initialText: string;
  scriptPath: string;
}

let state: EditorSidecarState = {
  state: "closed",
  filePath: null,
  message: "Editor sidecar is closed.",
};

let activeProcess: ReturnType<typeof Bun.spawn> | null = null;

export function currentEditorSidecarState(): EditorSidecarState {
  return { ...state };
}

export async function openEditorSidecar(filePath: string): Promise<EditorSidecarState> {
  const resolved = resolve(filePath);
  if (process.env.HAWK2UI_EDITOR_WEBVIEW_SIDECAR !== "1") {
    state = {
      state: "failed",
      filePath: resolved,
      message: "Editor sidecar is disabled. Set HAWK2UI_EDITOR_WEBVIEW_SIDECAR=1 to enable the WebviewJS example.",
    };
    return currentEditorSidecarState();
  }

  if (!existsSync(resolved)) {
    state = { state: "failed", filePath: resolved, message: `File does not exist: ${resolved}` };
    return currentEditorSidecarState();
  }

  if (!statSync(resolved).isFile()) {
    state = { state: "failed", filePath: resolved, message: `Path is not a file: ${resolved}` };
    return currentEditorSidecarState();
  }

  state = { state: "opening", filePath: resolved, message: "Opening WebviewJS editor sidecar." };

  try {
    await verifyWebviewBinding();
    const scriptPath = await buildWebviewEditorBundle();
    const payloadPath = writeEditorPayload({
      filePath: resolved,
      initialText: readFileSync(resolved, "utf8"),
      scriptPath,
    });

    activeProcess?.kill();
    activeProcess = Bun.spawn({
      cmd: [process.execPath, resolve("src/bridge/webviewEditorProcess.ts"), payloadPath],
      stdout: "pipe",
      stderr: "pipe",
      env: process.env,
    });

    activeProcess.exited.then((code) => {
      if (state.filePath === resolved && code !== 0) {
        state = { state: "failed", filePath: resolved, message: `Editor sidecar exited with code ${code}.` };
      } else if (state.filePath === resolved) {
        state = { state: "closed", filePath: null, message: "Editor sidecar is closed." };
      }
    });

    state = { state: "open", filePath: resolved, message: "Editor sidecar is open." };
  } catch (error) {
    state = {
      state: "failed",
      filePath: resolved,
      message: error instanceof Error ? error.message : "Failed to open editor sidecar.",
    };
  }

  return currentEditorSidecarState();
}

async function verifyWebviewBinding(): Promise<void> {
  try {
    await import("@webviewjs/webview");
  } catch (error) {
    throw new Error(
      `WebviewJS native binding is unavailable: ${error instanceof Error ? error.message : "unknown import failure"}`,
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
