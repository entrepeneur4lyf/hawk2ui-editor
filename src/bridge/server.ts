import { fetchDocsPage } from "./docs";
import { currentPreviewStatus, startPreview, stopPreview } from "./preview";
import { streamAssistantText } from "./assistant";
import { currentEditorSidecarState, openEditorSidecar } from "./webviewEditor";

const port = Number(process.env.HAWK2UI_EDITOR_BRIDGE_PORT ?? "47321");

export function createBridgeServer() {
  return Bun.serve({
    port,
    async fetch(request) {
      const url = new URL(request.url);

      try {
        if (request.method === "GET" && url.pathname === "/health") {
          return json({ ok: true });
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

        if (request.method === "POST" && url.pathname === "/editor/open") {
          const body = await request.json();
          return json(await openEditorSidecar(String(body.filePath)));
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
    },
  });
}

function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json" },
  });
}

if (import.meta.main) {
  createBridgeServer();
  console.log(`Hawk2UI Editor bridge listening on http://127.0.0.1:${port}`);
}
