import { describe, expect, test } from "bun:test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { TerminalBridgeSession, type TerminalProcess } from "./session";
import type { TerminalServerMessage } from "./protocol";

describe("terminal bridge session", () => {
  test("starts a terminal session and sends started metadata", () => {
    const root = mkdtempSync(join(tmpdir(), "hawk2ui-editor-terminal-"));
    const fake = new FakeTerminalProcess();
    const session = new TerminalBridgeSession(root, () => fake);
    const client = new FakeTerminalClient();

    const status = session.connect(client);

    expect(status).toMatchObject({ state: "running", root, shell: "/bin/bash", cwd: root, cols: 80, rows: 24 });
    expect(client.messages).toContainEqual({ type: "started", shell: "/bin/bash", cwd: root, cols: 80, rows: 24 });
  });

  test("forwards input, resize, output, and exit", async () => {
    const root = mkdtempSync(join(tmpdir(), "hawk2ui-editor-terminal-"));
    const fake = new FakeTerminalProcess();
    const session = new TerminalBridgeSession(root, () => fake);
    const client = new FakeTerminalClient();

    session.connect(client);
    session.receiveFromClient({ type: "input", data: "echo hello\r" });
    session.receiveFromClient({ type: "resize", cols: 120, rows: 40 });
    fake.emitOutput("hello\r\n");
    fake.exit(0);
    await fake.exited;

    expect(fake.writes).toEqual(["echo hello\r"]);
    expect(fake.sizes).toEqual([{ cols: 120, rows: 40 }]);
    expect(client.messages).toContainEqual({ type: "output", data: "hello\r\n" });
    expect(client.messages).toContainEqual({ type: "exit", exitCode: 0 });
    expect(session.status()).toMatchObject({ state: "exited", exitCode: 0, message: "Terminal exited with code 0." });
  });

  test("clamps resize messages and closes when the final client disconnects", () => {
    const root = mkdtempSync(join(tmpdir(), "hawk2ui-editor-terminal-"));
    const fake = new FakeTerminalProcess();
    const session = new TerminalBridgeSession(root, () => fake);
    const first = new FakeTerminalClient();
    const second = new FakeTerminalClient();

    session.connect(first);
    session.connect(second);
    session.receiveFromClient({ type: "resize", cols: 0, rows: 999 });
    session.disconnect(first);
    expect(fake.closed).toBe(false);

    session.disconnect(second);

    expect(fake.sizes).toEqual([{ cols: 1, rows: 200 }]);
    expect(fake.closed).toBe(true);
    expect(session.status()).toMatchObject({ state: "stopped", message: "Terminal session is stopped." });
  });
});

class FakeTerminalClient {
  readonly messages: TerminalServerMessage[] = [];

  send(message: TerminalServerMessage): void {
    this.messages.push(message);
  }
}

class FakeTerminalProcess implements TerminalProcess {
  readonly shell = "/bin/bash";
  readonly cwd: string;
  readonly writes: string[] = [];
  readonly sizes: Array<{ cols: number; rows: number }> = [];
  closed = false;
  private onOutput: ((data: string) => void) | null = null;
  private resolveExit!: (exitCode: number | null) => void;
  readonly exited = new Promise<number | null>((resolve) => {
    this.resolveExit = resolve;
  });

  constructor(cwd = process.cwd()) {
    this.cwd = cwd;
  }

  start(options: { onOutput(data: string): void }): void {
    this.onOutput = options.onOutput;
  }

  write(data: string): void {
    this.writes.push(data);
  }

  resize(cols: number, rows: number): void {
    this.sizes.push({ cols, rows });
  }

  close(): void {
    this.closed = true;
  }

  emitOutput(data: string): void {
    this.onOutput?.(data);
  }

  exit(exitCode: number | null): void {
    this.resolveExit(exitCode);
  }
}
