import { StateEffect, type Extension } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import { LSPClient, languageServerExtensions, type Transport } from "@codemirror/lsp-client";

export interface WebviewLspConfig {
  lspUrl: string;
  fileUri: string;
  rootUri: string;
  languageId: string;
}

export function languageIdForPath(path: string): string {
  const lowerPath = path.toLowerCase();
  if (lowerPath.endsWith(".vue")) return "vue";
  if (lowerPath.endsWith(".tsx")) return "typescriptreact";
  if (lowerPath.endsWith(".ts")) return "typescript";
  if (lowerPath.endsWith(".jsx")) return "javascriptreact";
  if (lowerPath.endsWith(".js")) return "javascript";
  if (lowerPath.endsWith(".json")) return "json";
  if (lowerPath.endsWith(".md") || lowerPath.endsWith(".markdown")) return "markdown";
  if (lowerPath.endsWith(".css")) return "css";
  return "plaintext";
}

export function supportsLspLanguage(languageId: string): boolean {
  return (
    languageId === "typescript" ||
    languageId === "typescriptreact" ||
    languageId === "javascript" ||
    languageId === "javascriptreact"
  );
}

export function lspWebSocketUrl(baseURL: string, projectRoot: string): string {
  const url = new URL(baseURL);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = "/lsp";
  url.search = "";
  url.searchParams.set("root", projectRoot);
  return url.href;
}

export async function installLspClient(
  view: EditorView,
  config: WebviewLspConfig,
  onError: (message: string) => void,
): Promise<LSPClient> {
  const transport = await createWebSocketTransport(config.lspUrl);
  const client = new LSPClient({
    rootUri: config.rootUri,
    extensions: languageServerExtensions(),
    sanitizeHTML,
  }).connect(transport);

  const extension: Extension = client.plugin(config.fileUri, config.languageId);
  view.dispatch({ effects: StateEffect.appendConfig.of(extension) });
  client.initializing.catch((error) => {
    onError(error instanceof Error ? error.message : "LSP initialization failed.");
  });

  return client;
}

export function createWebSocketTransport(uri: string): Promise<Transport> {
  const handlers: Array<(value: string) => void> = [];
  const socket = new WebSocket(uri);

  socket.onmessage = (event) => {
    for (const handler of handlers) {
      handler(String(event.data));
    }
  };

  return new Promise((resolve, reject) => {
    socket.onerror = () => reject(new Error(`LSP WebSocket failed: ${uri}`));
    socket.onopen = () => {
      resolve({
        send(message: string) {
          socket.send(message);
        },
        subscribe(handler: (value: string) => void) {
          handlers.push(handler);
        },
        unsubscribe(handler: (value: string) => void) {
          const index = handlers.indexOf(handler);
          if (index !== -1) handlers.splice(index, 1);
        },
      });
    };
  });
}

function sanitizeHTML(html: string): string {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, "");
}
