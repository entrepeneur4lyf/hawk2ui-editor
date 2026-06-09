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
