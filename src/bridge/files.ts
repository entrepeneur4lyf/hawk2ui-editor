import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";

export type ProjectTreeEntryType = "file" | "directory";

export interface ProjectTreeEntry {
  name: string;
  path: string;
  type: ProjectTreeEntryType;
  children?: ProjectTreeEntry[];
}

export interface ProjectFile {
  path: string;
  content: string;
}

const ignoredDirectoryNames = new Set([
  ".git",
  ".hawk2ui-cache",
  ".vite",
  "bridge-cache",
  "coverage",
  "dist",
  "node_modules",
  "references",
]);

export function resolveProjectPath(root: string, relativePath: string): string {
  if (!relativePath || relativePath.startsWith("/") || relativePath.startsWith("\\")) {
    throw new Error(`project path must be relative: ${relativePath}`);
  }

  const rootPath = resolve(root);
  const targetPath = resolve(rootPath, relativePath);
  if (targetPath !== rootPath && !targetPath.startsWith(`${rootPath}${sep}`)) {
    throw new Error(`project path escapes root: ${relativePath}`);
  }
  return targetPath;
}

export async function listProjectTree(root: string, maxDepth = 2): Promise<ProjectTreeEntry[]> {
  resolveProjectPath(root, ".");
  return listChildren(root, "", maxDepth);
}

export async function readProjectFile(root: string, path: string): Promise<ProjectFile> {
  const filePath = resolveProjectPath(root, path);
  return { path, content: await readFile(filePath, "utf8") };
}

export async function writeProjectFile(root: string, path: string, content: string): Promise<ProjectFile> {
  const filePath = resolveProjectPath(root, path);
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, content);
  return { path, content };
}

async function listChildren(root: string, relativeDir: string, depthRemaining: number): Promise<ProjectTreeEntry[]> {
  const absoluteDir = resolveProjectPath(root, relativeDir || ".");
  const directoryEntries = await readdir(absoluteDir, { withFileTypes: true });
  const entries: ProjectTreeEntry[] = [];

  for (const entry of directoryEntries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name.startsWith(".") || ignoredDirectoryNames.has(entry.name)) continue;
    const relativePath = relativeDir ? `${relativeDir}/${entry.name}` : entry.name;
    const absolutePath = resolveProjectPath(root, relativePath);

    if (entry.isDirectory()) {
      const treeEntry: ProjectTreeEntry = { name: entry.name, path: relativePath, type: "directory" };
      if (depthRemaining > 1) treeEntry.children = await listChildren(root, relativePath, depthRemaining - 1);
      entries.push(treeEntry);
      continue;
    }

    if (entry.isFile() || (await stat(absolutePath)).isFile()) {
      entries.push({ name: entry.name, path: relativePath, type: "file" });
    }
  }

  return entries;
}
