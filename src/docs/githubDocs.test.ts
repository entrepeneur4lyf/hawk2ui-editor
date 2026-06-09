import { describe, expect, test } from "bun:test";
import { docsPageURL } from "./githubDocs";

describe("GitHub docs", () => {
  test("builds raw GitHub markdown URLs", () => {
    expect(
      docsPageURL(
        {
          type: "github",
          owner: "entrepeneur4lyf",
          repo: "hawk2ui",
          ref: "main",
          paths: ["manual/README.md"],
        },
        "manual/README.md",
      ),
    ).toBe("https://raw.githubusercontent.com/entrepeneur4lyf/hawk2ui/main/manual/README.md");
  });
});
