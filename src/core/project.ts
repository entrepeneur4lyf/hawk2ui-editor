export interface HawkProjectSummary {
  root: string;
  packageId: string;
  name: string;
  version: string;
  framework: string;
  targets: string[];
  entry: string;
}

interface HawkManifestShape {
  package?: { id?: string; name?: string; version?: string };
  app?: { entry?: string; framework?: string };
  targets?: Record<string, unknown[]>;
}

export function summarizeHawkManifest(root: string, source: string): HawkProjectSummary {
  const manifest = JSON.parse(source) as HawkManifestShape;
  const packageId = requireString(manifest.package?.id, "package.id");
  const name = requireString(manifest.package?.name, "package.name");
  const version = requireString(manifest.package?.version, "package.version");
  const entry = requireString(manifest.app?.entry, "app.entry");
  const framework = manifest.app?.framework ?? "native";
  const targets = Object.entries(manifest.targets ?? {})
    .filter(([, value]) => Array.isArray(value) && value.length > 0)
    .map(([key]) => key);

  if (targets.length === 0) throw new Error("manifest.targets must contain at least one target");

  return { root, packageId, name, version, framework, targets, entry };
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`manifest.${field} is required`);
  return value;
}
