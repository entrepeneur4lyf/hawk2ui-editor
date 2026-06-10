export interface NativeNodeProps {
  backgroundColor?: string;
  color?: string;
  fontSize?: number;
  height?: number;
  padding?: number;
  gap?: number;
}

export interface NativeNode {
  id: string;
  type: "view" | "text";
  text?: string;
  props?: NativeNodeProps;
  children?: NativeNode[];
}

const palette = {
  root: "#090a10",
  chrome: "#151722",
  panel: "#10131b",
  panelAlt: "#0d1118",
  line: "#222636",
  text: "#e5e7eb",
  muted: "#9ca3af",
  accent: "#5aa7ff",
  green: "#5ee096",
};

export function mount(): NativeNode {
  return view("editor-root", { backgroundColor: palette.root, padding: 18, gap: 8 }, [
    text("window-title", "Hawk2UI Editor", {
      color: palette.text,
      fontSize: 22,
      height: 32,
    }),
    text("command-bar", "File  Edit  Selection  View  Go  Run  Terminal  Help    Explorer  Search  Chat  Docs  Settings", {
      backgroundColor: palette.chrome,
      color: palette.muted,
      fontSize: 14,
      height: 34,
    }),
    view("editor-workspace", { backgroundColor: palette.panel, height: 470, padding: 14, gap: 8 }, [
      text("editor-tabs", "App.vue    README.md    hawk.json", {
        backgroundColor: palette.line,
        color: palette.text,
        fontSize: 14,
        height: 30,
      }),
      text("editor-path", "src/App.vue  >  workbench shell", {
        color: palette.muted,
        fontSize: 13,
        height: 26,
      }),
      text("editor-line-1", "1  <hawk-view class=\"workbench-shell\">", {
        color: "#c4b5fd",
        fontSize: 16,
        height: 28,
      }),
      text("editor-line-2", "2    <CommandBar @open-panel=\"showFloatingPanel\" />", {
        color: "#93c5fd",
        fontSize: 16,
        height: 28,
      }),
      text("editor-line-3", "3    <EditorWorkspace :documents=\"documents\" />", {
        color: "#fbbf24",
        fontSize: 16,
        height: 28,
      }),
      text("editor-line-4", "4    <BottomDrawer active=\"terminal\" />", {
        color: "#5eead4",
        fontSize: 16,
        height: 28,
      }),
      text("editor-line-5", "5    <StatusBar tone=\"ready\" />", {
        color: "#86efac",
        fontSize: 16,
        height: 28,
      }),
      text("editor-line-6", "6  </hawk-view>", {
        color: "#c4b5fd",
        fontSize: 16,
        height: 28,
      }),
    ]),
    view("bottom-drawer", { backgroundColor: palette.panelAlt, height: 132, padding: 12, gap: 6 }, [
      text("drawer-tabs", "Terminal | Logs | Debug | Problems", {
        color: palette.text,
        fontSize: 14,
        height: 26,
      }),
      text("drawer-body-1", "$ bun run dev", {
        color: palette.green,
        fontSize: 15,
        height: 26,
      }),
      text("drawer-body-2", "desktop runtime attached; native workbench entry mounted", {
        color: palette.muted,
        fontSize: 14,
        height: 26,
      }),
    ]),
    text("status-bar", "Ready  |  project: hawk2ui-editor  |  bridge: local  |  LSP: planned  |  terminal: planned  |  preview: stopped", {
      backgroundColor: "#11395f",
      color: palette.text,
      fontSize: 13,
      height: 28,
    }),
  ]);
}

function view(id: string, props: NativeNodeProps, children: NativeNode[]): NativeNode {
  return { id, type: "view", props, children };
}

function text(id: string, value: string, props: NativeNodeProps): NativeNode {
  return { id, type: "text", text: value, props };
}
