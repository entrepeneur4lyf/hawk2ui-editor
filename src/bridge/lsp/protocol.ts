import { relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolveProjectPath } from "../files";

export interface JsonRpcMessage {
  jsonrpc: "2.0";
  id?: string | number | null;
  method?: string;
  params?: unknown;
  result?: unknown;
  error?: unknown;
}

export interface LspPosition {
  line: number;
  character: number;
}

export interface LspRange {
  start: LspPosition;
  end: LspPosition;
}

export interface LspDiagnostic {
  range: LspRange;
  severity?: number;
  code?: string | number;
  source?: string;
  message: string;
}

export interface PublishDiagnosticsPayload {
  uri: string;
  version?: number;
  diagnostics: LspDiagnostic[];
}

export function pathToFileUri(projectRoot: string, relativePath: string): string {
  return pathToFileURL(resolveProjectPath(projectRoot, relativePath)).href;
}

export function fileUriToProjectPath(projectRoot: string, uri: string): string {
  const rootPath = resolve(projectRoot);
  const filePath = fileURLToPath(uri);
  if (filePath !== rootPath && !filePath.startsWith(`${rootPath}${sep}`)) {
    throw new Error(`file URI escapes project root: ${uri}`);
  }
  return relative(rootPath, filePath).split(sep).join("/");
}

export function encodeLspFrame(message: JsonRpcMessage | Record<string, unknown>): string {
  const body = JSON.stringify(message);
  const length = new TextEncoder().encode(body).byteLength;
  return `Content-Length: ${length}\r\n\r\n${body}`;
}

export class LspFrameReader {
  private buffer = new Uint8Array();
  private readonly decoder = new TextDecoder();
  private readonly encoder = new TextEncoder();

  push(chunk: string | Uint8Array): JsonRpcMessage[] {
    this.buffer = concatBytes(this.buffer, typeof chunk === "string" ? this.encoder.encode(chunk) : chunk);
    const messages: JsonRpcMessage[] = [];

    while (true) {
      const headerEnd = headerDelimiterIndex(this.buffer);
      if (headerEnd === -1) break;

      const header = this.decoder.decode(this.buffer.slice(0, headerEnd));
      const length = contentLength(header);
      if (length === null) {
        throw new Error("LSP frame is missing Content-Length header.");
      }

      const bodyStart = headerEnd + 4;
      const bodyEnd = bodyStart + length;
      if (this.buffer.byteLength < bodyEnd) break;

      const body = this.decoder.decode(this.buffer.slice(bodyStart, bodyEnd));
      messages.push(JSON.parse(body) as JsonRpcMessage);
      this.buffer = this.buffer.slice(bodyEnd);
    }

    return messages;
  }
}

export function diagnosticsFromMessage(message: unknown): PublishDiagnosticsPayload | null {
  if (!isRecord(message) || message.method !== "textDocument/publishDiagnostics" || !isRecord(message.params)) {
    return null;
  }

  const params = message.params;
  if (typeof params.uri !== "string" || !Array.isArray(params.diagnostics)) return null;

  return {
    uri: params.uri,
    version: typeof params.version === "number" ? params.version : undefined,
    diagnostics: params.diagnostics.filter(isDiagnostic),
  };
}

function contentLength(header: string): number | null {
  for (const line of header.split("\r\n")) {
    const [name, value] = line.split(":");
    if (name?.toLowerCase() === "content-length") {
      const length = Number(value?.trim());
      return Number.isFinite(length) && length >= 0 ? length : null;
    }
  }
  return null;
}

function concatBytes(left: Uint8Array, right: Uint8Array): Uint8Array {
  const combined = new Uint8Array(left.byteLength + right.byteLength);
  combined.set(left, 0);
  combined.set(right, left.byteLength);
  return combined;
}

function headerDelimiterIndex(buffer: Uint8Array): number {
  for (let index = 0; index <= buffer.byteLength - 4; index += 1) {
    if (buffer[index] === 13 && buffer[index + 1] === 10 && buffer[index + 2] === 13 && buffer[index + 3] === 10) {
      return index;
    }
  }
  return -1;
}

function isDiagnostic(value: unknown): value is LspDiagnostic {
  if (!isRecord(value) || !isRange(value.range) || typeof value.message !== "string") return false;
  return (
    (value.severity === undefined || typeof value.severity === "number") &&
    (value.code === undefined || typeof value.code === "string" || typeof value.code === "number") &&
    (value.source === undefined || typeof value.source === "string")
  );
}

function isRange(value: unknown): value is LspRange {
  return isRecord(value) && isPosition(value.start) && isPosition(value.end);
}

function isPosition(value: unknown): value is LspPosition {
  return isRecord(value) && typeof value.line === "number" && typeof value.character === "number";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
