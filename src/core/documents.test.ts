import { describe, expect, test } from "bun:test";
import {
  activeDocument,
  createDocumentState,
  markDocumentSaved,
  openDocsDocument,
  openFileDocument,
  selectDocument,
  updateDocumentContent,
} from "./documents";

describe("editor documents", () => {
  test("opens project files as writable tabs", () => {
    const state = openFileDocument(createDocumentState(), "src/App.vue", "<template />");

    expect(state.activeDocumentId).toBe("file:src/App.vue");
    expect(state.documents).toEqual([
      {
        id: "file:src/App.vue",
        title: "App.vue",
        path: "src/App.vue",
        language: "vue",
        dirty: false,
        readOnly: false,
        kind: "file",
        content: "<template />",
      },
    ]);
  });

  test("opens docs as read-only markdown tabs", () => {
    const state = openDocsDocument(createDocumentState(), "manual/README.md", "# Manual");

    expect(state.activeDocumentId).toBe("doc:manual/README.md");
    expect(state.documents[0].readOnly).toBe(true);
    expect(state.documents[0].language).toBe("markdown");
  });

  test("marks writable tabs dirty and clears dirty state after save", () => {
    const opened = openFileDocument(createDocumentState(), "src/core/project.ts", "export const a = 1;");
    const changed = updateDocumentContent(opened, "file:src/core/project.ts", "export const a = 2;");

    expect(changed.documents[0].dirty).toBe(true);
    expect(changed.documents[0].content).toBe("export const a = 2;");

    const saved = markDocumentSaved(changed, "file:src/core/project.ts");
    expect(saved.documents[0].dirty).toBe(false);
  });

  test("does not edit read-only docs", () => {
    const opened = openDocsDocument(createDocumentState(), "manual/README.md", "# Manual");

    expect(() => updateDocumentContent(opened, "doc:manual/README.md", "# Changed")).toThrow("read-only");
  });

  test("selects open documents without overwriting dirty content", () => {
    const opened = openFileDocument(createDocumentState(), "src/App.vue", "initial");
    const changed = updateDocumentContent(opened, "file:src/App.vue", "dirty");
    const reopened = openFileDocument(changed, "src/App.vue", "fresh from disk");

    expect(activeDocument(reopened).content).toBe("dirty");
    expect(activeDocument(selectDocument(reopened, "file:src/App.vue")).path).toBe("src/App.vue");
  });

  test("refreshes clean open documents from disk content", () => {
    const opened = openFileDocument(createDocumentState(), "src/App.vue", "initial");
    const reopened = openFileDocument(opened, "src/App.vue", "fresh from disk");

    expect(activeDocument(reopened).content).toBe("fresh from disk");
  });
});
