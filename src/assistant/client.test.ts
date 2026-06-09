import { describe, expect, test } from "bun:test";
import { defaultWorkspaceDocument } from "../core/workspace";
import { sendAssistantPrompt } from "./client";

describe("assistant client", () => {
  test("posts prompts to the bridge stream endpoint", async () => {
    const workspace = defaultWorkspaceDocument("/tmp/project");
    const originalFetch = globalThis.fetch;
    const requests: Request[] = [];
    globalThis.fetch = async (input, init) => {
      const request = new Request(input, init);
      requests.push(request);
      return new Response("Queued", { status: 200 });
    };

    try {
      const text = await sendAssistantPrompt({
        bridgeBaseURL: "http://127.0.0.1:47321",
        projectRoot: workspace.project.root,
        profile: workspace.ai.profiles[0],
        prompt: "Inspect this project.",
      });

      expect(text).toBe("Queued");
      expect(requests[0].url).toBe("http://127.0.0.1:47321/assistant/stream");
      expect(await requests[0].json()).toEqual({
        prompt: "Inspect this project.",
        cwd: "/tmp/project",
        profile: workspace.ai.profiles[0],
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
