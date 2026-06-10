import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Hawk workbench CSS theme foundation", () => {
  test("keeps shell colors class-scoped with named black theme surface tokens", () => {
    const source = readFileSync(join(import.meta.dir, "main.hawk.css"), "utf8");
    const rawBackgroundHexDeclarations = [...source.matchAll(/background-color:\s*#[0-9a-fA-F]+/g)].map(
      (match) => match[0],
    );
    const blackSurfaceTokens = [...source.matchAll(/background-color:\s*token\(color\.surface\.(?:black|chrome|panel|drawer|editor)\)/g)].map(
      (match) => match[0],
    );

    expect(source).toContain(".theme-black");
    expect(source).toContain(".theme-light");
    expect(source).toContain(".theme-light .panel");
    expect(rawBackgroundHexDeclarations).toEqual([]);
    expect(blackSurfaceTokens.length).toBeGreaterThanOrEqual(6);
  });
});
