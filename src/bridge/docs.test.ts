import { describe, expect, test } from "bun:test";
import { fetchDocsPage } from "./docs";

describe("bridge docs fetching", () => {
  test("rejects configured paths that escape the docs cache", async () => {
    await expect(
      fetchDocsPage(
        {
          owner: "entrepeneur4lyf",
          repo: "hawk2ui",
          ref: "main",
          paths: ["../secret.md"],
        },
        "../secret.md",
      ),
    ).rejects.toThrow("docs path must be relative");
  });
});
