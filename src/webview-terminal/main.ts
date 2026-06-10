import { WTerm } from "@wterm/dom";
import type { TerminalServerMessage } from "../bridge/terminal/protocol";

interface InitialTerminalState {
  projectRoot: string;
  terminalUrl: string;
  cols: number;
  rows: number;
  theme?: "black" | "light";
}

declare global {
  interface Window {
    __HAWK_TERMINAL_INITIAL__?: InitialTerminalState;
    ipc?: { postMessage(message: string): void };
  }
}

const initial = window.__HAWK_TERMINAL_INITIAL__ ?? {
  projectRoot: "",
  terminalUrl: "ws://127.0.0.1:47321/terminal",
  cols: 80,
  rows: 24,
};
const terminalRoot = document.getElementById("terminal");
const status = document.getElementById("status");
let socket: WebSocket | null = null;
let writingFromServer = false;

if (!terminalRoot) {
  throw new Error("missing terminal root");
}
document.body.classList.add(initial.theme === "light" ? "theme-light" : "theme-black");

const terminal = new WTerm(terminalRoot, {
  cols: initial.cols,
  rows: initial.rows,
  cursorBlink: true,
  onData(data) {
    if (writingFromServer) return;
    send({ type: "input", data });
  },
  onResize(cols, rows) {
    send({ type: "resize", cols, rows });
    post({ type: "terminalReady", root: initial.projectRoot, cols, rows });
  },
});

await terminal.init();
terminal.focus();
connect();

function connect(): void {
  socket = new WebSocket(initial.terminalUrl);
  updateStatus("Connecting");

  socket.addEventListener("open", () => {
    updateStatus("Connected");
    post({ type: "terminalReady", root: initial.projectRoot, cols: terminal.cols, rows: terminal.rows });
    send({ type: "resize", cols: terminal.cols, rows: terminal.rows });
  });

  socket.addEventListener("message", (event) => {
    handleServerMessage(JSON.parse(String(event.data)) as TerminalServerMessage);
  });

  socket.addEventListener("close", () => {
    updateStatus("Closed");
    writeTerminal("\r\n[terminal disconnected]\r\n");
  });

  socket.addEventListener("error", () => {
    updateStatus("Socket error");
    post({ type: "terminalError", root: initial.projectRoot, message: "Terminal WebSocket failed." });
  });
}

function handleServerMessage(message: TerminalServerMessage): void {
  if (message.type === "output") {
    writeTerminal(message.data);
  } else if (message.type === "started") {
    updateStatus(message.shell);
    terminal.resize(message.cols, message.rows);
    post({ type: "terminalReady", root: initial.projectRoot, cols: message.cols, rows: message.rows });
  } else if (message.type === "exit") {
    updateStatus("Exited");
    writeTerminal(`\r\n[terminal exited${message.exitCode === null ? "" : ` with code ${message.exitCode}`}]\r\n`);
  } else {
    updateStatus("Error");
    writeTerminal(`\r\n[terminal error] ${message.message}\r\n`);
    post({ type: "terminalError", root: initial.projectRoot, message: message.message });
  }
}

function send(message: { type: "input"; data: string } | { type: "resize"; cols: number; rows: number }): void {
  if (socket?.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify(message));
}

function writeTerminal(data: string): void {
  writingFromServer = true;
  try {
    terminal.write(data);
  } finally {
    writingFromServer = false;
  }
}

function updateStatus(value: string): void {
  if (status) {
    status.textContent = value;
  }
}

function post(message: Record<string, unknown>): void {
  window.ipc?.postMessage(JSON.stringify(message));
}
