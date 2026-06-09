import { streamText } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { claudeCode } from "ai-sdk-provider-claude-code";
import { codexExec } from "ai-sdk-provider-codex-cli";
import type { AssistantProfile } from "../core/workspace";

export interface AssistantRequest {
  prompt: string;
  cwd: string;
  profile: AssistantProfile;
}

export async function* streamAssistantText(request: AssistantRequest): AsyncIterable<string> {
  const result = streamText({
    model: modelForProfile(request.profile, request.cwd),
    prompt: request.prompt,
  });

  for await (const text of result.textStream) {
    yield text;
  }
}

function modelForProfile(profile: AssistantProfile, cwd: string) {
  if (profile.adapter === "codex-cli") {
    return codexExec(profile.model, {
      allowNpx: true,
      skipGitRepoCheck: true,
      approvalMode: profile.approvalMode,
      sandboxMode: profile.sandboxMode,
      cwd,
    });
  }

  if (profile.adapter === "claude-code") {
    return claudeCode(profile.model, {
      cwd,
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
