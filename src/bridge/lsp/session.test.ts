import { describe, expect, test } from "bun:test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LspBridgeSession } from "./session";
import { LspFrameReader, encodeLspFrame, pathToFileUri } from "./protocol";

describe("LSP bridge session", () => {
  test("starts a TypeScript language server process and proxies client messages to stdio", () => {
    const root = mkdtempSync(join(tmpdir(), "hawk2ui-editor-lsp-"));
    const fake = fakeLanguageServerProcess();
    const session = new LspBridgeSession(root, () => fake.process);

    session.connect({ send: () => {} });
    session.receiveFromClient({ jsonrpc: "2.0", id: 1, method: "initialize", params: { rootUri: pathToFileUri(root, ".") } });

    expect(session.status()).toMatchObject({
      state: "running",
      root,
      server: "typescript",
      lastError: null,
    });
    expect(fake.stdinMessages()).toEqual([
      { jsonrpc: "2.0", id: 1, method: "initialize", params: { rootUri: pathToFileUri(root, ".") } },
    ]);
  });

  test("broadcasts language server messages and mirrors publishDiagnostics state", async () => {
    const root = mkdtempSync(join(tmpdir(), "hawk2ui-editor-lsp-"));
    const fake = fakeLanguageServerProcess();
    const sent: unknown[] = [];
    const session = new LspBridgeSession(root, () => fake.process);
    const uri = pathToFileUri(root, "src/App.ts");

    session.connect({ send: (message) => sent.push(message) });
    fake.emit(
      encodeLspFrame({
        jsonrpc: "2.0",
        method: "textDocument/publishDiagnostics",
        params: {
          uri,
          version: 2,
          diagnostics: [
            {
              range: { start: { line: 1, character: 0 }, end: { line: 1, character: 5 } },
              severity: 1,
              source: "typescript",
              message: "Example diagnostic.",
            },
          ],
        },
      }),
    );
    await Promise.resolve();

    expect(sent).toEqual([
      {
        jsonrpc: "2.0",
        method: "textDocument/publishDiagnostics",
        params: {
          uri,
          version: 2,
          diagnostics: [
            {
              range: { start: { line: 1, character: 0 }, end: { line: 1, character: 5 } },
              severity: 1,
              source: "typescript",
              message: "Example diagnostic.",
            },
          ],
        },
      },
    ]);
    expect(session.status().diagnostics[uri]).toHaveLength(1);
    expect(session.status().diagnosticCount).toBe(1);
  });

  test("marks the session failed when the language server exits non-zero", async () => {
    const root = mkdtempSync(join(tmpdir(), "hawk2ui-editor-lsp-"));
    const fake = fakeLanguageServerProcess();
    const session = new LspBridgeSession(root, () => fake.process);

    session.connect({ send: () => {} });
    fake.exit(1);
    await Promise.resolve();

    expect(session.status()).toMatchObject({
      state: "failed",
      lastError: "TypeScript language server exited with code 1.",
    });
  });

  test("stops the language server when the last client disconnects", () => {
    const root = mkdtempSync(join(tmpdir(), "hawk2ui-editor-lsp-"));
    const fake = fakeLanguageServerProcess();
    const session = new LspBridgeSession(root, () => fake.process);
    const client = { send: () => {} };

    session.connect(client);
    session.disconnect(client);

    expect(fake.killed).toBe(true);
    expect(session.status().state).toBe("stopped");
  });
});

function fakeLanguageServerProcess() {
  const stdin = "";
  const frameReader = new LspFrameReader();
  let stdinBuffer = stdin;
  let exitProcess: (code: number) => void = () => {};
  let emit = (_frame: string) => {};
  let killed = false;
  const stdout = new ReadableStream<Uint8Array>({
    start(controller) {
      emit = (frame: string) => controller.enqueue(new TextEncoder().encode(frame));
    },
  });

  return {
    process: {
      stdin: {
        write(frame: string) {
          stdinBuffer += frame;
        },
      },
      stdout,
      stderr: null,
      exited: new Promise<number>((resolve) => {
        exitProcess = resolve;
      }),
      kill() {
        killed = true;
        exitProcess(0);
      },
    },
    emit(frame: string) {
      emit(frame);
    },
    exit(code: number) {
      exitProcess(code);
    },
    stdinMessages() {
      return frameReader.push(stdinBuffer);
    },
    get killed() {
      return killed;
    },
  };
}
