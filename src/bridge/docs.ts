import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export interface GitHubDocsSource {
  owner: string;
  repo: string;
  ref: string;
  paths: string[];
}

export interface DocsPage {
  path: string;
  markdown: string;
  fetchedAt: string;
}

export async function fetchDocsPage(
  source: GitHubDocsSource,
  path: string,
  cacheRoot = "bridge-cache/docs",
): Promise<DocsPage> {
  validateDocsSource(source);
  validateDocsPath(path);
  if (!source.paths.includes(path)) {
    throw new Error(`docs path is not configured: ${path}`);
  }

  const cachePath = join(cacheRoot, source.owner, source.repo, source.ref, path);
  const url = `https://raw.githubusercontent.com/${source.owner}/${source.repo}/${source.ref}/${path}`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
    const markdown = await response.text();
    const page = { path, markdown, fetchedAt: new Date().toISOString() };
    await mkdir(dirname(cachePath), { recursive: true });
    await writeFile(cachePath, JSON.stringify(page, null, 2));
    return page;
  } catch (error) {
    const cached = await readFile(cachePath, "utf8").catch(() => "");
    if (cached) return JSON.parse(cached) as DocsPage;
    throw error;
  }
}

function validateDocsSource(source: GitHubDocsSource): void {
  validatePathSegment(source.owner, "docs source owner");
  validatePathSegment(source.repo, "docs source repo");
  validatePathSegment(source.ref, "docs source ref");
  for (const configuredPath of source.paths) validateDocsPath(configuredPath);
}

function validateDocsPath(path: string): void {
  if (path.startsWith("/") || path.split("/").some((segment) => segment === "..")) {
    throw new Error(`docs path must be relative and stay inside the docs cache: ${path}`);
  }
}

function validatePathSegment(value: string, field: string): void {
  if (!value || value.includes("/") || value === "." || value === "..") {
    throw new Error(`${field} is invalid`);
  }
}
