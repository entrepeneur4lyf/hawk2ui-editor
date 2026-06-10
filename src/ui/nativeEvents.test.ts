import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const supportedNativeEventDirectives = new Set([
  "click",
  "pointerdown",
  "pointerup",
  "pointermove",
  "pointerdrag",
  "pointerenter",
  "pointerleave",
  "wheel",
  "keydown",
  "keyup",
  "textinput",
  "focus",
  "blur",
  "input",
  "change",
  "resize",
]);

describe("Hawk Vue native events", () => {
  test("uses event directive names supported by the Hawk Vue adapter", () => {
    const unsupported = vueFiles(join(import.meta.dir, "..")).flatMap((file) => {
      const source = readFileSync(file, "utf8");
      return [...source.matchAll(/<hawk-[\s\S]*?>/g)]
        .flatMap((tag) => [...tag[0].matchAll(/@([A-Za-z0-9_-]+)=/g)].map((match) => match[1]))
        .filter((eventName) => !supportedNativeEventDirectives.has(eventName))
        .map((eventName) => `${file.replace(`${process.cwd()}/`, "")}: @${eventName}`);
    });

    expect(unsupported).toEqual([]);
  });

  test("keeps floating panel chrome controls fixed size", () => {
    const source = readFileSync(join(import.meta.dir, "HawkFloatingPanel.vue"), "utf8");
    const fluidButtons = [...source.matchAll(/<hawk-button[\s\S]*?>/g)]
      .map((match) => match[0])
      .filter((tag) => !/[\s:]width=/.test(tag) || !/[\s:]height=/.test(tag));

    expect(fluidButtons).toEqual([]);
  });
});

function vueFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) return vueFiles(path);
    return path.endsWith(".vue") ? [path] : [];
  });
}
