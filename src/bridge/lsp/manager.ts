import { resolve } from "node:path";
import { resolveProjectPath } from "../files";
import { LspBridgeSession, type LspClientConnection, type LspStatus } from "./session";
import type { JsonRpcMessage } from "./protocol";

const sessions = new Map<string, LspBridgeSession>();

export function currentLspStatus(root: string): LspStatus {
  return sessionForRoot(root).status();
}

export function connectLspClient(root: string, client: LspClientConnection): LspStatus {
  return sessionForRoot(root).connect(client);
}

export function disconnectLspClient(root: string, client: LspClientConnection): LspStatus {
  return sessionForRoot(root).disconnect(client);
}

export function receiveLspClientMessage(root: string, message: JsonRpcMessage): LspStatus {
  return sessionForRoot(root).receiveFromClient(message);
}

export function stopAllLspSessions(): void {
  for (const session of sessions.values()) {
    session.stop();
  }
  sessions.clear();
}

function sessionForRoot(root: string): LspBridgeSession {
  const normalizedRoot = normalizeRoot(root);
  const existing = sessions.get(normalizedRoot);
  if (existing) return existing;

  const session = new LspBridgeSession(normalizedRoot);
  sessions.set(normalizedRoot, session);
  return session;
}

function normalizeRoot(root: string): string {
  resolveProjectPath(root, ".");
  return resolve(root);
}
