import { describe, expect, test } from "bun:test";
import {
  clampTerminalSize,
  parseTerminalClientMessage,
  serializeTerminalServerMessage,
} from "./protocol";

describe("terminal protocol", () => {
  test("parses input messages", () => {
    expect(parseTerminalClientMessage(JSON.stringify({ type: "input", data: "echo hello\r" }))).toEqual({
      type: "input",
      data: "echo hello\r",
    });
  });

  test("parses resize messages with safe bounds", () => {
    expect(parseTerminalClientMessage(JSON.stringify({ type: "resize", cols: 120, rows: 40 }))).toEqual({
      type: "resize",
      cols: 120,
      rows: 40,
    });
    expect(clampTerminalSize(0, 999)).toEqual({ cols: 1, rows: 200 });
  });

  test("parses kill messages", () => {
    expect(parseTerminalClientMessage(JSON.stringify({ type: "kill" }))).toEqual({ type: "kill" });
  });

  test("rejects invalid client messages", () => {
    expect(() => parseTerminalClientMessage("{}")).toThrow("Invalid terminal client message.");
    expect(() => parseTerminalClientMessage(JSON.stringify({ type: "input", data: 1 }))).toThrow(
      "Invalid terminal client message.",
    );
    expect(() => parseTerminalClientMessage("not json")).toThrow("Invalid terminal client message.");
  });

  test("serializes server messages", () => {
    expect(serializeTerminalServerMessage({ type: "output", data: "hello" })).toBe(
      JSON.stringify({ type: "output", data: "hello" }),
    );
    expect(
      serializeTerminalServerMessage({
        type: "started",
        shell: "/bin/bash",
        cwd: "/tmp/project",
        cols: 80,
        rows: 24,
      }),
    ).toBe(JSON.stringify({ type: "started", shell: "/bin/bash", cwd: "/tmp/project", cols: 80, rows: 24 }));
  });
});
