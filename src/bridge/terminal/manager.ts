import { resolve } from "node:path";
import { resolveProjectPath } from "../files";
import { TerminalBridgeSession, type TerminalClientConnection, type TerminalStatus } from "./session";
import type { TerminalClientMessage } from "./protocol";

const sessions = new Map<string, TerminalBridgeSession>();

export function currentTerminalStatus(root: string): TerminalStatus {
  return sessionForRoot(root).status();
}

export function connectTerminalClient(root: string, client: TerminalClientConnection): TerminalStatus {
  return sessionForRoot(root).connect(client);
}

export function disconnectTerminalClient(root: string, client: TerminalClientConnection): TerminalStatus {
  return sessionForRoot(root).disconnect(client);
}

export function receiveTerminalClientMessage(root: string, message: TerminalClientMessage): TerminalStatus {
  return sessionForRoot(root).receiveFromClient(message);
}

export function stopAllTerminalSessions(): void {
  for (const session of sessions.values()) {
    session.stop();
  }
  sessions.clear();
}

function sessionForRoot(root: string): TerminalBridgeSession {
  const normalizedRoot = normalizeRoot(root);
  const existing = sessions.get(normalizedRoot);
  if (existing) return existing;

  const session = new TerminalBridgeSession(normalizedRoot);
  sessions.set(normalizedRoot, session);
  return session;
}

function normalizeRoot(root: string): string {
  resolveProjectPath(root, ".");
  return resolve(root);
}
