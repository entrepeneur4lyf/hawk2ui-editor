export type DocumentKind = "file" | "doc" | "settings";
export type DocumentLanguage = "vue" | "markdown" | "typescript" | "json" | "css" | "text";

export interface EditorDocument {
  id: string;
  title: string;
  path: string;
  language: DocumentLanguage;
  dirty: boolean;
  readOnly: boolean;
  kind: DocumentKind;
  content: string;
}

export interface DocumentState {
  documents: EditorDocument[];
  activeDocumentId: string | null;
}

export function createDocumentState(documents: EditorDocument[] = [], activeDocumentId: string | null = null): DocumentState {
  return { documents, activeDocumentId };
}

export function openFileDocument(state: DocumentState, path: string, content: string): DocumentState {
  return openDocument(state, {
    id: documentId("file", path),
    title: titleForPath(path),
    path,
    language: languageForPath(path),
    dirty: false,
    readOnly: false,
    kind: "file",
    content,
  });
}

export function openDocsDocument(state: DocumentState, path: string, content: string): DocumentState {
  return openDocument(state, {
    id: documentId("doc", path),
    title: titleForPath(path),
    path,
    language: languageForPath(path),
    dirty: false,
    readOnly: true,
    kind: "doc",
    content,
  });
}

export function updateDocumentContent(state: DocumentState, id: string, content: string): DocumentState {
  let found = false;
  const documents = state.documents.map((document) => {
    if (document.id !== id) return document;
    found = true;
    if (document.readOnly) throw new Error(`document is read-only: ${id}`);
    return { ...document, content, dirty: document.content !== content };
  });
  if (!found) throw new Error(`document is not open: ${id}`);
  return { ...state, documents };
}

export function markDocumentSaved(state: DocumentState, id: string): DocumentState {
  return {
    ...state,
    documents: state.documents.map((document) => {
      return document.id === id ? { ...document, dirty: false } : document;
    }),
  };
}

export function selectDocument(state: DocumentState, id: string): DocumentState {
  if (!state.documents.some((document) => document.id === id)) {
    throw new Error(`document is not open: ${id}`);
  }
  return { ...state, activeDocumentId: id };
}

export function activeDocument(state: DocumentState): EditorDocument {
  const document = state.documents.find((candidate) => candidate.id === state.activeDocumentId);
  if (!document) throw new Error(`active document is missing: ${state.activeDocumentId}`);
  return document;
}

export function documentId(kind: DocumentKind, path: string): string {
  return `${kind}:${path}`;
}

export function languageForPath(path: string): DocumentLanguage {
  if (path.endsWith(".vue")) return "vue";
  if (path.endsWith(".md") || path.endsWith(".markdown")) return "markdown";
  if (path.endsWith(".ts") || path.endsWith(".tsx") || path.endsWith(".js") || path.endsWith(".jsx")) return "typescript";
  if (path.endsWith(".json") || path.endsWith(".hawk")) return "json";
  if (path.endsWith(".css")) return "css";
  return "text";
}

function openDocument(state: DocumentState, document: EditorDocument): DocumentState {
  const existing = state.documents.some((candidate) => candidate.id === document.id);
  return {
    documents: existing
      ? state.documents.map((candidate) => {
          if (candidate.id !== document.id) return candidate;
          return candidate.dirty ? candidate : document;
        })
      : [...state.documents, document],
    activeDocumentId: document.id,
  };
}

function titleForPath(path: string): string {
  const segments = path.split("/").filter(Boolean);
  return segments[segments.length - 1] || path;
}
