import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
import { EditorState } from "@codemirror/state";
import {
  EditorView,
  drawSelection,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
} from "@codemirror/view";
import { installLspClient, supportsLspLanguage } from "./lspClient";

interface InitialEditorState {
  path: string;
  projectRoot?: string;
  filePath: string;
  fileUri?: string;
  rootUri?: string;
  languageId?: string;
  lspUrl?: string;
  text: string;
}

declare global {
  interface Window {
    __HAWK_EDITOR_INITIAL__?: InitialEditorState;
    __hawkEditorSaved?: (savedAt?: string) => void;
    __hawkEditorError?: (message: string) => void;
    ipc?: { postMessage(message: string): void };
  }
}

const initial = window.__HAWK_EDITOR_INITIAL__ ?? { path: "untitled", filePath: "untitled", text: "" };
const editorRoot = document.getElementById("editor");
const status = document.getElementById("status");
const fileName = document.getElementById("file-name");
let dirty = false;
let lastPosition = "1:1";

if (!editorRoot) {
  throw new Error("missing editor root");
}

if (fileName) {
  fileName.textContent = initial.filePath;
}

const view = new EditorView({
  parent: editorRoot,
  state: EditorState.create({
    doc: initial.text,
    extensions: [
      lineNumbers(),
      highlightActiveLineGutter(),
      drawSelection(),
      highlightActiveLine(),
      history(),
      javascript({ typescript: true }),
      keymap.of([indentWithTab, ...defaultKeymap, ...historyKeymap]),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          dirty = true;
          updateStatus("Dirty");
          post({ type: "documentChanged", path: initial.path, dirty });
        }

        if (update.selectionSet || update.docChanged) {
          postSelection(update.state);
        }
      }),
    ],
  }),
});

if (initial.lspUrl && initial.fileUri && initial.rootUri && initial.languageId && supportsLspLanguage(initial.languageId)) {
  void installLspClient(
    view,
    {
      lspUrl: initial.lspUrl,
      fileUri: initial.fileUri,
      rootUri: initial.rootUri,
      languageId: initial.languageId,
    },
    (message) => {
      updateStatus("LSP unavailable");
      post({ type: "editorError", path: initial.path, message });
    },
  );
}

document.getElementById("save")?.addEventListener("click", save);
window.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
    event.preventDefault();
    save();
  }
});

window.__hawkEditorSaved = () => {
  dirty = false;
  updateStatus("Saved");
  post({ type: "documentChanged", path: initial.path, dirty });
};

window.__hawkEditorError = (message: string) => {
  updateStatus(message);
};

post({ type: "editorReady", path: initial.path, filePath: initial.filePath, line: 1, column: 1 });

function save(): void {
  updateStatus("Saving");
  window.ipc?.postMessage(JSON.stringify({ type: "save", text: view.state.doc.toString() }));
}

function updateStatus(value: string): void {
  if (status) {
    status.textContent = value;
  }
}

function post(message: Record<string, unknown>): void {
  window.ipc?.postMessage(JSON.stringify(message));
}

function postSelection(state: EditorState): void {
  const head = state.selection.main.head;
  const line = state.doc.lineAt(head);
  const column = head - line.from + 1;
  const position = `${line.number}:${column}`;
  if (position === lastPosition) return;

  lastPosition = position;
  post({ type: "selectionChanged", path: initial.path, line: line.number, column });
}
