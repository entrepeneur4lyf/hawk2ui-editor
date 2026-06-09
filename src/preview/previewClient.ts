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
