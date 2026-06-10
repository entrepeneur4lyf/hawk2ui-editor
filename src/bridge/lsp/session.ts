import { resolve } from "node:path";
import { diagnosticsFromMessage, encodeLspFrame, type JsonRpcMessage, type LspDiagnostic, LspFrameReader } from "./protocol";

export type LspSessionState = "stopped" | "starting" | "running" | "failed";
export type LspServerName = "typescript";

export interface LspStatus {
  state: LspSessionState;
  root: string;
  server: LspServerName;
  message: string;
  diagnostics: Record<string, LspDiagnostic[]>;
  diagnosticCount: number;
  lastError: string | null;
  startedAt: string | null;
}

export interface LspClientConnection {
  send(message: JsonRpcMessage): void;
}

export interface LspChildProcess {
  stdin: { write(frame: string): void };
  stdout: ReadableStream<Uint8Array> | null;
  stderr?: ReadableStream<Uint8Array> | null;
  exited: Promise<number>;
  kill(): void;
}

export type LspProcessFactory = (root: string) => LspChildProcess;

export class LspBridgeSession {
  private readonly clients = new Set<LspClientConnection>();
  private readonly diagnostics = new Map<string, LspDiagnostic[]>();
  private process: LspChildProcess | null = null;
  private state: LspSessionState = "stopped";
  private message = "LSP session is stopped.";
  private lastError: string | null = null;
  private startedAt: string | null = null;

  constructor(
    private readonly root: string,
    private readonly processFactory: LspProcessFactory = spawnTypescriptLanguageServer,
  ) {}

  connect(client: LspClientConnection): LspStatus {
    this.clients.add(client);
    this.start();
    return this.status();
  }

  disconnect(client: LspClientConnection): LspStatus {
    this.clients.delete(client);
    if (this.clients.size === 0) {
      this.stop();
    }
    return this.status();
  }

  receiveFromClient(message: JsonRpcMessage): LspStatus {
    this.start();
    this.process?.stdin.write(encodeLspFrame(message));
    return this.status();
  }

  stop(): LspStatus {
    this.process?.kill();
    this.process = null;
    this.clients.clear();
    this.state = "stopped";
    this.message = "LSP session is stopped.";
    return this.status();
  }

  status(): LspStatus {
    const diagnostics = Object.fromEntries(this.diagnostics.entries());
    return {
      state: this.state,
      root: this.root,
      server: "typescript",
      message: this.message,
      diagnostics,
      diagnosticCount: Object.values(diagnostics).reduce((count, entries) => count + entries.length, 0),
      lastError: this.lastError,
      startedAt: this.startedAt,
    };
  }

  private start(): void {
    if (this.process) return;

    this.state = "starting";
    this.message = "Starting TypeScript language server.";
    this.lastError = null;
    this.startedAt = new Date().toISOString();
    this.process = this.processFactory(this.root);
    this.state = "running";
    this.message = "TypeScript language server is running.";

    this.consumeStdout(this.process.stdout);
    this.drainStderr(this.process.stderr);
    this.process.exited.then((code) => {
      if (this.process && code !== 0) {
        this.state = "failed";
        this.lastError = `TypeScript language server exited with code ${code}.`;
        this.message = this.lastError;
      } else if (this.process) {
        this.state = "stopped";
        this.message = "TypeScript language server stopped.";
      }
      this.process = null;
    });
  }

  private consumeStdout(stream: ReadableStream<Uint8Array> | null): void {
    if (!stream) return;

    const reader = new LspFrameReader();
    void (async () => {
      const streamReader = stream.getReader();
      while (true) {
        const chunk = await streamReader.read();
        if (chunk.done) break;
        for (const message of reader.push(chunk.value)) {
          this.receiveFromServer(message);
        }
      }
    })().catch((error) => {
      this.state = "failed";
      this.lastError = error instanceof Error ? error.message : "Failed to read language server output.";
      this.message = this.lastError;
    });
  }

  private drainStderr(stream: ReadableStream<Uint8Array> | null | undefined): void {
    if (!stream) return;
    void stream.pipeTo(new WritableStream({ write() {} })).catch(() => {});
  }

  private receiveFromServer(message: JsonRpcMessage): void {
    const diagnostics = diagnosticsFromMessage(message);
    if (diagnostics) {
      this.diagnostics.set(diagnostics.uri, diagnostics.diagnostics);
    }

    for (const client of this.clients) {
      client.send(message);
    }
  }
}

export function spawnTypescriptLanguageServer(root: string): LspChildProcess {
  return Bun.spawn({
    cmd: [resolve("node_modules/.bin/typescript-language-server"), "--stdio"],
    cwd: root,
    env: process.env,
    stdin: "pipe",
    stdout: "pipe",
    stderr: "pipe",
  }) as unknown as LspChildProcess;
}
