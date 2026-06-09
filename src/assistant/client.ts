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
