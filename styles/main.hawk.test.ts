import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Hawk workbench CSS theme foundation", () => {
  test("keeps shell colors class-scoped and avoids unsupported raw background hex values", () => {
    const source = readFileSync(join(import.meta.dir, "main.hawk.css"), "utf8");
    const rawBackgroundHexDeclarations = [...source.matchAll(/background-color:\s*#[0-9a-fA-F]+/g)].map(
      (match) => match[0],
    );

    expect(source).toContain(".theme-black");
    expect(source).toContain(".theme-light");
    expect(source).toContain(".theme-light .panel");
    expect(source).toContain("background-color: token(color.surface)");
    expect(rawBackgroundHexDeclarations).toEqual([]);
  });
});
