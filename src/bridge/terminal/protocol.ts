export interface TerminalInputMessage {
  type: "input";
  data: string;
}

export interface TerminalResizeMessage {
  type: "resize";
  cols: number;
  rows: number;
}

export interface TerminalKillMessage {
  type: "kill";
}

export type TerminalClientMessage = TerminalInputMessage | TerminalResizeMessage | TerminalKillMessage;

export interface TerminalOutputMessage {
  type: "output";
  data: string;
}

export interface TerminalStartedMessage {
  type: "started";
  shell: string;
  cwd: string;
  cols: number;
  rows: number;
}

export interface TerminalExitMessage {
  type: "exit";
  exitCode: number | null;
}

export interface TerminalErrorMessage {
  type: "error";
  message: string;
}

export type TerminalServerMessage =
  | TerminalOutputMessage
  | TerminalStartedMessage
  | TerminalExitMessage
  | TerminalErrorMessage;

export function parseTerminalClientMessage(value: string): TerminalClientMessage {
  try {
    const message = JSON.parse(value) as unknown;
    if (!isRecord(message) || typeof message.type !== "string") throw new Error();

    if (message.type === "input" && typeof message.data === "string") {
      return { type: "input", data: message.data };
    }

    if (message.type === "resize" && typeof message.cols === "number" && typeof message.rows === "number") {
      return { type: "resize", ...clampTerminalSize(message.cols, message.rows) };
    }

    if (message.type === "kill") {
      return { type: "kill" };
    }
  } catch {
    throw new Error("Invalid terminal client message.");
  }

  throw new Error("Invalid terminal client message.");
}

export function serializeTerminalServerMessage(message: TerminalServerMessage): string {
  return JSON.stringify(message);
}

export function clampTerminalSize(cols: number, rows: number): { cols: number; rows: number } {
  return {
    cols: clampInteger(cols, 1, 500),
    rows: clampInteger(rows, 1, 200),
  };
}

function clampInteger(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.floor(value)));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
