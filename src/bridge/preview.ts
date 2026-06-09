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
  child.on("error", (error) => {
    pushOutput(error.message);
    status = { ...status, state: "failed" };
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
