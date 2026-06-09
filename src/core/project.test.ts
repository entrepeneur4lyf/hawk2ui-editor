import { describe, expect, test } from "bun:test";
import { summarizeHawkManifest } from "./project";

describe("project summary", () => {
  test("summarizes a desktop Vue manifest", () => {
    const summary = summarizeHawkManifest(
      "/workspace/app",
      JSON.stringify({
        package: { id: "com.example.app", name: "Example", version: "0.1.0" },
        app: { entry: "src/main.ts", framework: "vue" },
        targets: { desktop: [{ name: "main" }] },
      }),
    );

    expect(summary).toEqual({
      root: "/workspace/app",
      packageId: "com.example.app",
      name: "Example",
      version: "0.1.0",
      framework: "vue",
      targets: ["desktop"],
      entry: "src/main.ts",
    });
  });

  test("rejects manifests without targets", () => {
    expect(() =>
      summarizeHawkManifest(
        "/workspace/app",
        JSON.stringify({
          package: { id: "com.example.app", name: "Example", version: "0.1.0" },
          app: { entry: "src/main.ts", framework: "vue" },
          targets: {},
        }),
      ),
    ).toThrow("manifest.targets");
  });
});
