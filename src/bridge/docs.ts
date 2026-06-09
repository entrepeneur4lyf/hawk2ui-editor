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
