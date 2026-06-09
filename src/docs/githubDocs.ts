export interface DocsSource {
  type: "github";
  owner: string;
  repo: string;
  ref: string;
  paths: string[];
}

export interface DocsPageRequest {
  bridgeBaseURL: string;
  source: DocsSource;
  path: string;
}

export function docsPageURL(source: DocsSource, path: string): string {
  return `https://raw.githubusercontent.com/${source.owner}/${source.repo}/${source.ref}/${path}`;
}

export async function loadDocsPage(request: DocsPageRequest): Promise<string> {
  const response = await fetch(`${request.bridgeBaseURL}/docs/page`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ source: request.source, path: request.path }),
  });
  if (!response.ok) throw new Error(`docs request failed: ${response.status}`);
  const page = (await response.json()) as { markdown: string };
  return page.markdown;
}
