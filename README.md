# Hawk2UI Editor

Local dogfood app for building a Hawk2UI single-project editor with Vue.

## Commands

- `bun install`
- `bun test`
- `bun run build`
- `hawk2ui-cli validate`
- `bun run bridge`
- `hawk2ui-cli dev`

`workspace.hawk` is local-only and ignored by git. Store API keys in environment variables such as `OPENAI_API_KEY` or `NIM_API_KEY`, not in project files.

## Code editor sidecar

The code editor window is an example-only WebviewJS sidecar. Hawk2UI renders the native workbench shell; WebviewJS hosts DOM-heavy editor widgets such as CodeMirror. This app uses the sidecar to demonstrate interop for developers who need a webview, but Hawk2UI does not distribute WebviewJS as framework functionality.

Enable the sidecar explicitly when testing it:

```bash
HAWK2UI_EDITOR_WEBVIEW_SIDECAR=1 bun run bridge
```

On the current Linux x64 test environment, `@webviewjs/webview@0.1.4` installs but its optional Linux native package is missing from npm, so the bridge reports a clear sidecar failure instead of launching an empty window.

When testing the Hawk2UI-specific WebviewJS fork locally, use the generated Linux x64 tarball as a disposable install artifact. Do not commit a `/tmp` dependency into `package.json` or `bun.lock`.

```bash
bun install
mv node_modules/@webviewjs/webview node_modules/@webviewjs/webview.registry
mkdir -p node_modules/@webviewjs/webview
tar -xzf /tmp/hawk2ui-webview-linux-x64.tgz -C node_modules/@webviewjs/webview --strip-components=1
HAWK2UI_EDITOR_WEBVIEW_SIDECAR=1 bun run bridge
```

The bridge opens the sidecar through `POST /editor/open` with `{ root, path }`, reads the initial file through the root-confined file helpers, and saves through the same file boundary. Use `POST /editor/close` to stop the active sidecar during local verification.
