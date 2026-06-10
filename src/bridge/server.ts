import { fetchDocsPage } from "./docs";
import { listProjectTree, readProjectFile, writeProjectFile } from "./files";
import { currentPreviewStatus, startPreview, stopPreview } from "./preview";
import { streamAssistantText } from "./assistant";
import { closeEditorSidecar, currentEditorSidecarState, openEditorSidecar } from "./webviewEditor";
import { closeTerminalSidecar, currentTerminalSidecarState, openTerminalSidecar } from "./webviewTerminal";
import { connectLspClient, currentLspStatus, disconnectLspClient, receiveLspClientMessage } from "./lsp/manager";
import type { JsonRpcMessage } from "./lsp/protocol";
import {
  connectTerminalClient,
  currentTerminalStatus,
  disconnectTerminalClient,
  receiveTerminalClientMessage,
} from "./terminal/manager";
import { parseTerminalClientMessage, serializeTerminalServerMessage, type TerminalServerMessage } from "./terminal/protocol";

const port = Number(process.env.HAWK2UI_EDITOR_BRIDGE_PORT ?? "47321");

type BridgeSocketData =
  | {
      kind: "lsp";
      root: string;
      client: { send(message: JsonRpcMessage): void };
    }
  | {
      kind: "terminal";
      root: string;
      client: { send(message: TerminalServerMessage): void };
    };

export function createBridgeServer() {
  return Bun.serve<BridgeSocketData>({
    port,
    fetch(request, server) {
      const url = new URL(request.url);
      if (url.pathname === "/lsp" && request.headers.get("upgrade")?.toLowerCase() === "websocket") {
        const root = url.searchParams.get("root") ?? process.cwd();
        const client = { send() {} };
        if (server.upgrade(request, { data: { kind: "lsp", root, client } })) return;
        return json({ error: "websocket upgrade failed" }, 400);
      }
      if (url.pathname === "/terminal" && request.headers.get("upgrade")?.toLowerCase() === "websocket") {
        const root = url.searchParams.get("root") ?? process.cwd();
        const client = { send() {} };
        if (server.upgrade(request, { data: { kind: "terminal", root, client } })) return;
        return json({ error: "websocket upgrade failed" }, 400);
      }
      return handleBridgeRequest(request);
    },
    websocket: {
      open(socket) {
        if (socket.data.kind === "lsp") {
          socket.data.client = {
            send(message: JsonRpcMessage) {
              socket.send(JSON.stringify(message));
            },
          };
          connectLspClient(socket.data.root, socket.data.client);
          return;
        }

        socket.data.client = {
          send(message: TerminalServerMessage) {
            socket.send(serializeTerminalServerMessage(message));
          },
        };
        connectTerminalClient(socket.data.root, socket.data.client);
      },
      message(socket, message) {
        if (typeof message !== "string") return;
        if (socket.data.kind === "lsp") {
          receiveLspClientMessage(socket.data.root, JSON.parse(message) as JsonRpcMessage);
          return;
        }

        try {
          receiveTerminalClientMessage(socket.data.root, parseTerminalClientMessage(message));
        } catch (error) {
          socket.send(
            serializeTerminalServerMessage({
              type: "error",
              message: error instanceof Error ? error.message : "Invalid terminal message.",
            }),
          );
        }
      },
      close(socket) {
        if (socket.data.kind === "lsp") {
          disconnectLspClient(socket.data.root, socket.data.client);
          return;
        }
        disconnectTerminalClient(socket.data.root, socket.data.client);
      },
    },
  });
}

export async function handleBridgeRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);

  try {
    if (request.method === "GET" && url.pathname === "/health") {
      return json({ ok: true });
    }

    if (request.method === "GET" && url.pathname === "/project/tree") {
      const root = requiredSearchParam(url, "root");
      return json({ root, entries: await listProjectTree(root) });
    }

    if (request.method === "GET" && url.pathname === "/files/read") {
      return json(await readProjectFile(requiredSearchParam(url, "root"), requiredSearchParam(url, "path")));
    }

    if (request.method === "POST" && url.pathname === "/files/write") {
      const body = await request.json();
      return json(await writeProjectFile(String(body.root), String(body.path), String(body.content)));
    }

    if (request.method === "POST" && url.pathname === "/docs/page") {
      const body = await request.json();
      const page = await fetchDocsPage(body.source, body.path);
      return json(page);
    }

    if (request.method === "GET" && url.pathname === "/preview/status") {
      return json(currentPreviewStatus());
    }

    if (request.method === "POST" && url.pathname === "/preview/start") {
      const body = await request.json();
      return json(startPreview(String(body.cwd)));
    }

    if (request.method === "POST" && url.pathname === "/preview/stop") {
      return json(stopPreview());
    }

    if (request.method === "GET" && url.pathname === "/editor/status") {
      return json(currentEditorSidecarState());
    }

    if (request.method === "GET" && url.pathname === "/lsp/status") {
      return json(currentLspStatus(requiredSearchParam(url, "root")));
    }

    if (request.method === "GET" && url.pathname === "/terminal/status") {
      return json(currentTerminalStatus(requiredSearchParam(url, "root")));
    }

    if (request.method === "GET" && url.pathname === "/terminal/window/status") {
      return json(currentTerminalSidecarState());
    }

    if (request.method === "POST" && url.pathname === "/terminal/open") {
      const body = await request.json();
      return json(await openTerminalSidecar(String(body.root)));
    }

    if (request.method === "POST" && url.pathname === "/terminal/close") {
      return json(closeTerminalSidecar());
    }

    if (request.method === "POST" && url.pathname === "/editor/open") {
      const body = await request.json();
      if (body.root && body.path) {
        return json(await openEditorSidecar(String(body.root), String(body.path)));
      }
      return json(await openEditorSidecar(process.cwd(), String(body.filePath)));
    }

    if (request.method === "POST" && url.pathname === "/editor/close") {
      return json(closeEditorSidecar());
    }

    if (request.method === "POST" && url.pathname === "/assistant/stream") {
      const body = await request.json();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const text of streamAssistantText(body)) {
              controller.enqueue(new TextEncoder().encode(text));
            }
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        },
      });
      return new Response(stream, { headers: { "content-type": "text/plain; charset=utf-8" } });
    }

    return json({ error: "not found" }, 404);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "bridge request failed" }, 500);
  }
}

function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function requiredSearchParam(url: URL, name: string): string {
  const value = url.searchParams.get(name);
  if (!value) throw new Error(`missing query parameter: ${name}`);
  return value;
}

if (import.meta.main) {
  createBridgeServer();
  console.log(`Hawk2UI Editor bridge listening on http://127.0.0.1:${port}`);
}
