import { describe, expect, test } from "bun:test";
import { currentPreviewStatus, stopPreview } from "./preview";

describe("bridge preview state", () => {
  test("starts stopped", () => {
    stopPreview();
    expect(currentPreviewStatus().state).toBe("stopped");
  });
});
