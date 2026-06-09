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

interface InitialEditorState {
  filePath: string;
  text: string;
}

declare global {
  interface Window {
    __HAWK_EDITOR_INITIAL__?: InitialEditorState;
    __hawkEditorSaved?: () => void;
    ipc?: { postMessage(message: string): void };
  }
}

const initial = window.__HAWK_EDITOR_INITIAL__ ?? { filePath: "untitled", text: "" };
const editorRoot = document.getElementById("editor");
const status = document.getElementById("status");
const fileName = document.getElementById("file-name");
let dirty = false;

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
        }
      }),
    ],
  }),
});

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
};

post({ type: "editorReady", filePath: initial.filePath });

function save(): void {
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
