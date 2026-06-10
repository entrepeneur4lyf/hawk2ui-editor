import { describe, expect, test } from "bun:test";
import { languageIdForPath, lspWebSocketUrl, supportsLspLanguage } from "./lspClient";

describe("webview LSP client helpers", () => {
  test("maps editor paths to language server identifiers", () => {
    expect(languageIdForPath("src/App.vue")).toBe("vue");
    expect(languageIdForPath("src/main.ts")).toBe("typescript");
    expect(languageIdForPath("src/widget.tsx")).toBe("typescriptreact");
    expect(languageIdForPath("src/main.js")).toBe("javascript");
    expect(languageIdForPath("src/widget.jsx")).toBe("javascriptreact");
    expect(languageIdForPath("hawk.json")).toBe("json");
    expect(languageIdForPath("README.md")).toBe("markdown");
  });

  test("builds bridge websocket URLs from the HTTP bridge base URL", () => {
    expect(lspWebSocketUrl("http://127.0.0.1:47321", "/tmp/project")).toBe(
      "ws://127.0.0.1:47321/lsp?root=%2Ftmp%2Fproject",
    );
    expect(lspWebSocketUrl("https://example.test/editor", "/tmp/project")).toBe(
      "wss://example.test/lsp?root=%2Ftmp%2Fproject",
    );
  });

  test("enables the first LSP slice only for JavaScript and TypeScript documents", () => {
    expect(supportsLspLanguage("typescript")).toBe(true);
    expect(supportsLspLanguage("typescriptreact")).toBe(true);
    expect(supportsLspLanguage("javascript")).toBe(true);
    expect(supportsLspLanguage("javascriptreact")).toBe(true);
    expect(supportsLspLanguage("vue")).toBe(false);
    expect(supportsLspLanguage("markdown")).toBe(false);
  });
});
