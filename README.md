# Hawk2UI Editor

Local dogfood app for building a Hawk2UI single-project editor. The desktop runtime mounts an interactive Hawk Vue workbench shell, while DOM-heavy editor features live in optional webview sidecars.

## Commands

- `bun install`
- `bun test`
- `bun run build`
- `hawk2ui-cli validate`
- `bun run bridge`
- `bun run dev`

`workspace.hawk` is local-only and ignored by git. Store API keys in environment variables such as `OPENAI_API_KEY` or `NIM_API_KEY`, not in project files.

## Code editor sidecar

The code editor window is an example-only webview sidecar. Hawk2UI renders the interactive workbench shell; `@hawk2ui/editor-webview` hosts DOM-heavy editor widgets such as CodeMirror. This app uses the sidecar to demonstrate interop for developers who need a webview, but the sidecar package remains an optional editor-app dependency rather than core Hawk2UI framework functionality.

Start the full editor with the bridge and default editor sidecar:

```bash
bun run dev
```

The dev main process starts the Bun bridge, launches the `src/App.vue` CodeMirror sidecar automatically, then starts `hawk2ui-cli dev`. Start only the bridge for backend checks with:

```bash
bun run bridge
```

The bridge main process owns sidecar startup in both modes. Override the initial file with `HAWK2UI_EDITOR_INITIAL_FILE=path/to/file`, or suppress automatic startup with `HAWK2UI_EDITOR_WEBVIEW_SIDECAR=0`. Manual `POST /editor/open` remains available with `{ root, path }`; the sidecar reads and saves through the root-confined file helpers. Use `POST /editor/close` to stop the active sidecar during local verification.

The published package provides native optional packages for the supported desktop targets. Verify the local install with:

```bash
bun -e "const webview = await import('@hawk2ui/editor-webview'); console.log(webview.getWebviewVersion())"
```

## LSP bridge

CodeMirror uses `@codemirror/lsp-client` inside the sidecar. The language server runs in the Bun bridge, not in the Hawk frontend or the webview. Browser JSON-RPC messages go through `ws://127.0.0.1:$HAWK2UI_EDITOR_BRIDGE_PORT/lsp?root=...`; the bridge translates them to `typescript-language-server --stdio` frames and mirrors diagnostics to `GET /lsp/status?root=...`.

The first LSP slice is enabled for JavaScript and TypeScript files. Vue SFC support should use a future Volar-backed server path.

Verify the installed language server:

```bash
bunx typescript-language-server --version
```
