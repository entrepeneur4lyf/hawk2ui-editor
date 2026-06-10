import { clampTerminalSize, type TerminalClientMessage, type TerminalServerMessage } from "./protocol";

export type TerminalSessionState = "stopped" | "starting" | "running" | "exited" | "failed";

export interface TerminalStatus {
  state: TerminalSessionState;
  root: string;
  shell: string;
  cwd: string;
  cols: number;
  rows: number;
  exitCode: number | null;
  message: string;
  lastError: string | null;
  startedAt: string | null;
}

export interface TerminalClientConnection {
  send(message: TerminalServerMessage): void;
}

export interface TerminalProcess {
  readonly shell: string;
  readonly exited: Promise<number | null>;
  start(options: { onOutput(data: string): void }): void;
  write(data: string): void;
  resize(cols: number, rows: number): void;
  close(): void;
}

export interface TerminalProcessOptions {
  shell: string;
  cols: number;
  rows: number;
}

export type TerminalProcessFactory = (root: string, options: TerminalProcessOptions) => TerminalProcess;

export class TerminalBridgeSession {
  private readonly clients = new Set<TerminalClientConnection>();
  private process: TerminalProcess | null = null;
  private state: TerminalSessionState = "stopped";
  private shell = defaultShell();
  private cwd: string;
  private cols = 80;
  private rows = 24;
  private exitCode: number | null = null;
  private message = "Terminal session is stopped.";
  private lastError: string | null = null;
  private startedAt: string | null = null;

  constructor(
    private readonly root: string,
    private readonly processFactory: TerminalProcessFactory = createBunTerminalProcess,
  ) {
    this.cwd = root;
  }

  connect(client: TerminalClientConnection): TerminalStatus {
    this.clients.add(client);
    this.start();
    if (this.state === "running") client.send(this.startedMessage());
    return this.status();
  }

  disconnect(client: TerminalClientConnection): TerminalStatus {
    this.clients.delete(client);
    if (this.clients.size === 0) {
      this.stop();
    }
    return this.status();
  }

  receiveFromClient(message: TerminalClientMessage): TerminalStatus {
    this.start();
    if (!this.process) return this.status();

    if (message.type === "input") {
      this.process.write(message.data);
    } else if (message.type === "resize") {
      const size = clampTerminalSize(message.cols, message.rows);
      this.cols = size.cols;
      this.rows = size.rows;
      this.process.resize(size.cols, size.rows);
    } else if (message.type === "kill") {
      this.stop();
    }

    return this.status();
  }

  stop(): TerminalStatus {
    this.process?.close();
    this.process = null;
    this.clients.clear();
    this.state = "stopped";
    this.message = "Terminal session is stopped.";
    return this.status();
  }

  status(): TerminalStatus {
    return {
      state: this.state,
      root: this.root,
      shell: this.shell,
      cwd: this.cwd,
      cols: this.cols,
      rows: this.rows,
      exitCode: this.exitCode,
      message: this.message,
      lastError: this.lastError,
      startedAt: this.startedAt,
    };
  }

  private start(): void {
    if (this.process || this.state === "running" || this.state === "starting") return;

    this.state = "starting";
    this.message = "Starting terminal session.";
    this.lastError = null;
    this.exitCode = null;
    this.startedAt = new Date().toISOString();

    try {
      const process = this.processFactory(this.root, { shell: this.shell, cols: this.cols, rows: this.rows });
      this.process = process;
      this.shell = process.shell;
      process.start({ onOutput: (data) => this.broadcast({ type: "output", data }) });
      this.state = "running";
      this.message = "Terminal session is running.";
      process.exited
        .then((exitCode) => {
          if (this.process !== process) return;
          this.process = null;
          this.exitCode = exitCode;
          this.state = "exited";
          this.message = exitCode === null ? "Terminal exited." : `Terminal exited with code ${exitCode}.`;
          this.broadcast({ type: "exit", exitCode });
        })
        .catch((error) => {
          if (this.process !== process) return;
          this.process = null;
          this.state = "failed";
          this.lastError = error instanceof Error ? error.message : "Terminal session failed.";
          this.message = this.lastError;
          this.broadcast({ type: "error", message: this.lastError });
        });
    } catch (error) {
      this.process = null;
      this.state = "failed";
      this.lastError = error instanceof Error ? error.message : "Failed to start terminal session.";
      this.message = this.lastError;
      this.broadcast({ type: "error", message: this.lastError });
    }
  }

  private broadcast(message: TerminalServerMessage): void {
    for (const client of this.clients) {
      client.send(message);
    }
  }

  private startedMessage(): TerminalServerMessage {
    return { type: "started", shell: this.shell, cwd: this.cwd, cols: this.cols, rows: this.rows };
  }
}

export function createBunTerminalProcess(root: string, options: TerminalProcessOptions): TerminalProcess {
  return new BunTerminalProcess(root, options);
}

class BunTerminalProcess implements TerminalProcess {
  readonly shell: string;
  readonly exited: Promise<number | null>;
  private subprocess: BunTerminalSubprocess | null = null;
  private terminal: BunTerminalHandle | null = null;
  private onOutput: ((data: string) => void) | null = null;

  constructor(
    private readonly cwd: string,
    options: TerminalProcessOptions,
  ) {
    this.shell = options.shell;
    this.exited = new Promise((resolve, reject) => {
      try {
        const subprocess = Bun.spawn(commandForShell(options.shell), {
          cwd,
          env: process.env,
          terminal: {
            cols: options.cols,
            rows: options.rows,
            data: (_terminal: BunTerminalHandle, data: string | Uint8Array) => {
              this.onOutput?.(typeof data === "string" ? data : new TextDecoder().decode(data));
            },
          },
        }) as unknown as BunTerminalSubprocess;

        this.subprocess = subprocess;
        this.terminal = subprocess.terminal;
        subprocess.exited.then(resolve).catch(reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  start(options: { onOutput(data: string): void }): void {
    this.onOutput = options.onOutput;
  }

  write(data: string): void {
    this.terminal?.write(data);
  }

  resize(cols: number, rows: number): void {
    this.terminal?.resize(cols, rows);
  }

  close(): void {
    this.terminal?.close();
    this.subprocess?.kill();
    this.terminal = null;
    this.subprocess = null;
  }
}

interface BunTerminalHandle {
  write(data: string): void;
  resize(cols: number, rows: number): void;
  close(): void;
}

interface BunTerminalSubprocess {
  terminal: BunTerminalHandle;
  exited: Promise<number | null>;
  kill(): void;
}

function defaultShell(): string {
  if (process.platform === "win32") return process.env.COMSPEC ?? "cmd.exe";
  return process.env.SHELL ?? "/bin/bash";
}

function commandForShell(shell: string): string[] {
  if (process.platform === "win32") return [shell];
  return [shell, "-i"];
}
