import { describe, expect, test } from "bun:test";
import { previewStatusLabel } from "./previewClient";

describe("preview client", () => {
  test("formats stopped and running labels", () => {
    expect(previewStatusLabel({ state: "stopped", command: "hawk2ui-cli dev", cwd: "/tmp/app", output: [] })).toBe(
      "Stopped",
    );
    expect(previewStatusLabel({ state: "running", command: "hawk2ui-cli dev", cwd: "/tmp/app", output: [] })).toBe(
      "Running: hawk2ui-cli dev",
    );
  });
});
