import { describe, expect, test } from "bun:test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  LspFrameReader,
  diagnosticsFromMessage,
  encodeLspFrame,
  fileUriToProjectPath,
  pathToFileUri,
} from "./protocol";

describe("LSP protocol helpers", () => {
  test("converts confined project paths to file URIs and back", () => {
    const root = mkdtempSync(join(tmpdir(), "hawk2ui-editor-lsp-"));
    const uri = pathToFileUri(root, "src/App.vue");

    expect(uri).toStartWith("file://");
    expect(fileUriToProjectPath(root, uri)).toBe("src/App.vue");
    expect(() => pathToFileUri(root, "../outside.ts")).toThrow("project path escapes root");
  });

  test("encodes JSON-RPC messages with byte-accurate content length", () => {
    const frame = encodeLspFrame({ jsonrpc: "2.0", method: "initialized", params: { text: "λ" } });
    const [, body] = frame.split("\r\n\r\n");

    expect(frame).toStartWith(`Content-Length: ${new TextEncoder().encode(body).byteLength}\r\n\r\n`);
    expect(JSON.parse(body)).toEqual({ jsonrpc: "2.0", method: "initialized", params: { text: "λ" } });
  });

  test("parses complete messages from partial stdio chunks", () => {
    const reader = new LspFrameReader();
    const first = encodeLspFrame({ jsonrpc: "2.0", id: 1, result: true });
    const second = encodeLspFrame({ jsonrpc: "2.0", method: "window/logMessage", params: { message: "ready" } });

    expect(reader.push(first.slice(0, 12))).toEqual([]);
    expect(reader.push(first.slice(12) + second)).toEqual([
      { jsonrpc: "2.0", id: 1, result: true },
      { jsonrpc: "2.0", method: "window/logMessage", params: { message: "ready" } },
    ]);
  });

  test("keeps frame boundaries byte-correct when Unicode appears in a message body", () => {
    const reader = new LspFrameReader();
    const first = encodeLspFrame({ jsonrpc: "2.0", method: "window/logMessage", params: { message: "λ" } });
    const second = encodeLspFrame({ jsonrpc: "2.0", id: 2, result: true });

    expect(reader.push(first + second)).toEqual([
      { jsonrpc: "2.0", method: "window/logMessage", params: { message: "λ" } },
      { jsonrpc: "2.0", id: 2, result: true },
    ]);
  });

  test("extracts publishDiagnostics payloads", () => {
    const diagnostics = diagnosticsFromMessage({
      jsonrpc: "2.0",
      method: "textDocument/publishDiagnostics",
      params: {
        uri: "file:///project/src/App.ts",
        version: 3,
        diagnostics: [
          {
            range: {
              start: { line: 2, character: 4 },
              end: { line: 2, character: 9 },
            },
            severity: 1,
            source: "typescript",
            message: "Cannot find name.",
          },
        ],
      },
    });

    expect(diagnostics).toEqual({
      uri: "file:///project/src/App.ts",
      version: 3,
      diagnostics: [
        {
          range: {
            start: { line: 2, character: 4 },
            end: { line: 2, character: 9 },
          },
          severity: 1,
          source: "typescript",
          message: "Cannot find name.",
        },
      ],
    });

    expect(diagnosticsFromMessage({ jsonrpc: "2.0", method: "window/logMessage" })).toBeNull();
  });
});
