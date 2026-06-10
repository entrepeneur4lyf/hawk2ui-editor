import { describe, expect, test } from "bun:test";
import { normalizeThemePreference, resolveWorkbenchTheme, themeClassName } from "./workbenchTheme";

describe("workbench theme", () => {
  test("normalizes black defaults and legacy dark values", () => {
    expect(normalizeThemePreference(undefined)).toBe("black");
    expect(normalizeThemePreference("black")).toBe("black");
    expect(normalizeThemePreference("dark")).toBe("black");
    expect(normalizeThemePreference("light")).toBe("light");
    expect(normalizeThemePreference("system")).toBe("system");
    expect(normalizeThemePreference("purple")).toBe("black");
  });

  test("resolves system themes to a concrete shell theme", () => {
    expect(resolveWorkbenchTheme("system", "light")).toBe("light");
    expect(resolveWorkbenchTheme("system", "dark")).toBe("black");
    expect(resolveWorkbenchTheme("system", "black")).toBe("black");
    expect(resolveWorkbenchTheme("light")).toBe("light");
    expect(resolveWorkbenchTheme("dark")).toBe("black");
  });

  test("creates stable root classes for Hawk CSS", () => {
    expect(themeClassName("light")).toBe("theme-light");
    expect(themeClassName("dark")).toBe("theme-black");
    expect(themeClassName("system", "dark")).toBe("theme-black");
  });
});
