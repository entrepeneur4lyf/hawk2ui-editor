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
    expect(workspace.editor.theme).toBe("black");
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
    expect(workspace.panels.project.mode).toBe("floating");
    expect(workspace.panels.project.pinned).toBe(false);
  });

  test("normalizes legacy and invalid editor theme values", () => {
    const workspace = defaultWorkspaceDocument("/tmp/project");

    expect(
      parseWorkspaceDocument(JSON.stringify({ ...workspace, editor: { ...workspace.editor, theme: "dark" } })).editor
        .theme,
    ).toBe("black");

    expect(
      parseWorkspaceDocument(JSON.stringify({ ...workspace, editor: { ...workspace.editor, theme: "purple" } }))
        .editor.theme,
    ).toBe("black");
  });

  test("normalizes old floating-only panel records", () => {
    const workspace = defaultWorkspaceDocument("/tmp/project");
    const parsed = parseWorkspaceDocument(
      JSON.stringify({
        ...workspace,
        panels: {
          ...workspace.panels,
          project: { open: true, x: 12, y: 24, width: 280, height: 320 },
        },
      }),
    );

    expect(parsed.panels.project).toMatchObject({
      open: true,
      mode: "floating",
      pinned: false,
      x: 12,
      y: 24,
      width: 280,
      height: 320,
    });
    expect(parsed.panels.project.dockEdge).toBeUndefined();
  });

  test("recovers invalid panel layout fields", () => {
    const workspace = defaultWorkspaceDocument("/tmp/project");
    const parsed = parseWorkspaceDocument(
      JSON.stringify({
        ...workspace,
        panels: {
          ...workspace.panels,
          docs: {
            open: false,
            mode: "side",
            dockEdge: "top",
            pinned: "yes",
            x: 40,
            y: 50,
            width: 12,
            height: 12,
          },
        },
      }),
    );

    expect(parsed.panels.docs).toMatchObject({
      open: false,
      mode: "floating",
      pinned: false,
      width: 160,
      height: 120,
    });
    expect(parsed.panels.docs.dockEdge).toBeUndefined();
  });

  test("creates a last floating rectangle for docked panels without one", () => {
    const workspace = defaultWorkspaceDocument("/tmp/project");
    const parsed = parseWorkspaceDocument(
      JSON.stringify({
        ...workspace,
        panels: {
          ...workspace.panels,
          assistant: {
            open: true,
            mode: "docked",
            dockEdge: "right",
            pinned: true,
            x: 72,
            y: 84,
            width: 360,
            height: 420,
          },
        },
      }),
    );

    expect(parsed.panels.assistant).toMatchObject({
      open: true,
      mode: "docked",
      dockEdge: "right",
      pinned: true,
      lastFloating: { x: 72, y: 84, width: 360, height: 420 },
    });
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
