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

  test("defaults to floating panels for the workbench shell", () => {
    const workspace = defaultWorkspaceDocument("/tmp/project");

    expect(Object.keys(workspace.panels).sort()).toEqual([
      "assistant",
      "chatSettings",
      "docs",
      "editorSettings",
      "project",
    ]);
    expect(workspace.panels.project.open).toBe(true);
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
