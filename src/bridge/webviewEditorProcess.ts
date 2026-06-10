import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { Application, Theme, WebviewApplicationEvent } from "@hawk2ui/editor-webview";
import { writeProjectFile } from "./files";

interface EditorSidecarPayload {
  projectRoot: string;
  relativePath: string;
  filePath: string;
  initialText: string;
  scriptPath: string;
}

const payloadPath = process.argv[2];
if (!payloadPath) {
  throw new Error("webview editor payload path is required");
}

const payload = JSON.parse(readFileSync(payloadPath, "utf8")) as EditorSidecarPayload;
const css = readFileSync("src/webview-editor/editor.css", "utf8");
const app = new Application();
const window = app.createBrowserWindow({
  title: `Hawk2UI Editor - ${payload.filePath}`,
  width: 1040,
  height: 760,
  resizable: true,
});
const webview = window.createWebview({
  html: editorHtml(css, payload.scriptPath),
  preload: `window.__HAWK_EDITOR_INITIAL__ = ${JSON.stringify({
    filePath: payload.filePath,
    text: payload.initialText,
  })};`,
  theme: Theme.Dark,
  clipboard: true,
});

webview.onIpcMessage((event) => {
  const message = JSON.parse(event.body.toString("utf8")) as { type: string; text?: string };
  if (message.type === "save" && typeof message.text === "string") {
    void writeProjectFile(payload.projectRoot, payload.relativePath, message.text)
      .then(() => {
        webview.evaluateScript("window.__hawkEditorSaved && window.__hawkEditorSaved()");
      })
      .catch((error) => {
        const messageText = error instanceof Error ? error.message : "Save failed.";
        webview.evaluateScript(`window.__hawkEditorError && window.__hawkEditorError(${JSON.stringify(messageText)})`);
      });
  }
});

app.bind((event) => {
  if (event.event === WebviewApplicationEvent.WindowCloseRequested) {
    app.exit();
  }
});

app.run();

function editorHtml(cssText: string, scriptPath: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Hawk2UI Code Editor</title>
    <style>${cssText}</style>
  </head>
  <body>
    <main id="app">
      <header>
        <strong id="file-name">Hawk2UI Code Editor</strong>
        <span id="status">Clean</span>
        <button id="save">Save</button>
      </header>
      <section id="editor"></section>
    </main>
    <script type="module" src="${pathToFileURL(scriptPath).href}"></script>
  </body>
</html>`;
}
