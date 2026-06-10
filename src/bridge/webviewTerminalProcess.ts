import { readFileSync } from "node:fs";
import { Application, Theme, WebviewApplicationEvent } from "@hawk2ui/editor-webview";

interface TerminalSidecarPayload {
  projectRoot: string;
  scriptPath: string;
  terminalUrl: string;
  cols: number;
  rows: number;
}

const payloadPath = process.argv[2];
if (!payloadPath) {
  throw new Error("webview terminal payload path is required");
}

const payload = JSON.parse(readFileSync(payloadPath, "utf8")) as TerminalSidecarPayload;
const wtermCss = readFileSync("node_modules/@wterm/dom/src/terminal.css", "utf8");
const css = `${wtermCss}\n${readFileSync("src/webview-terminal/terminal.css", "utf8")}`;
const script = readFileSync(payload.scriptPath, "utf8");
const app = new Application();
const window = app.createBrowserWindow({
  title: `Hawk2UI Terminal - ${payload.projectRoot}`,
  width: 1040,
  height: 680,
  resizable: true,
});
const webview = window.createWebview({
  html: terminalHtml(css, script),
  preload: `window.__HAWK_TERMINAL_INITIAL__ = ${JSON.stringify({
    projectRoot: payload.projectRoot,
    terminalUrl: payload.terminalUrl,
    cols: payload.cols,
    rows: payload.rows,
  })};`,
  theme: Theme.Dark,
  clipboard: true,
});

webview.onIpcMessage((event) => {
  const message = JSON.parse(event.body.toString("utf8")) as { type: string };
  if (message.type === "terminalReady" || message.type === "terminalError") {
    postToParent(message);
  }
});

app.bind((event) => {
  if (event.event === WebviewApplicationEvent.WindowCloseRequested) {
    app.exit();
  }
});

app.run();

function terminalHtml(cssText: string, scriptText: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Hawk2UI Terminal</title>
    <style>${cssText}</style>
  </head>
  <body>
    <main id="app">
      <header>
        <strong>Hawk2UI Terminal</strong>
        <span id="status">Starting</span>
      </header>
      <section id="terminal" class="theme-monokai"></section>
    </main>
    <script type="module">${escapeInlineScript(scriptText)}</script>
  </body>
</html>`;
}

function postToParent(message: Record<string, unknown>): void {
  console.log(`HAWK_TERMINAL_EVENT ${JSON.stringify(message)}`);
}

function escapeInlineScript(scriptText: string): string {
  return scriptText.replaceAll("</script", "<\\/script");
}
