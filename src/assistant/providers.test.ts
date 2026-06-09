import { describe, expect, test } from "bun:test";
import { defaultWorkspaceDocument } from "../core/workspace";
import { profileCan, providerBadges, redactProfile, redactSecretReference } from "./providers";

describe("assistant providers", () => {
  test("marks codex as project-write capable", () => {
    const workspace = defaultWorkspaceDocument("/tmp/project");
    const codex = workspace.ai.profiles.find((profile) => profile.id === "codex-cli");

    expect(codex).toBeDefined();
    expect(profileCan(codex!, "project-write")).toBe(true);
    expect(providerBadges(codex!).some((badge) => badge.value === "Can edit")).toBe(true);
  });

  test("marks nim as chat-only and keeps env secret references", () => {
    const workspace = defaultWorkspaceDocument("/tmp/project");
    const nim = workspace.ai.profiles.find((profile) => profile.id === "nim-kimi");

    expect(nim).toBeDefined();
    expect(profileCan(nim!, "project-write")).toBe(false);
    expect(providerBadges(nim!).some((badge) => badge.value === "Chat only")).toBe(true);
    expect(redactProfile(nim!)).toEqual(nim);
  });

  test("redacts raw secret values", () => {
    expect(redactSecretReference("sk-test")).toBe("[redacted]");
    expect(redactSecretReference("env:OPENAI_API_KEY")).toBe("env:OPENAI_API_KEY");
  });
});
