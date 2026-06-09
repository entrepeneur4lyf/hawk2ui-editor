import type { AssistantCapability, AssistantProfile } from "../core/workspace";

export interface ProviderBadge {
  label: string;
  value: string;
}

export function profileCan(profile: AssistantProfile, capability: AssistantCapability): boolean {
  return profile.capabilities.includes(capability);
}

export function providerBadges(profile: AssistantProfile): ProviderBadge[] {
  const badges: ProviderBadge[] = [{ label: "Model", value: profile.model }];
  if (profileCan(profile, "project-write")) badges.push({ label: "Project", value: "Can edit" });
  else badges.push({ label: "Project", value: "Chat only" });
  if (profileCan(profile, "subscription-auth")) badges.push({ label: "Auth", value: "Subscription" });
  if (profileCan(profile, "api-key-auth")) badges.push({ label: "Auth", value: "API key" });
  if (profile.adapter === "openai-compatible") badges.push({ label: "Endpoint", value: redactEndpoint(profile.baseURL) });
  return badges;
}

export function redactProfile(profile: AssistantProfile): AssistantProfile {
  if (profile.adapter !== "openai-compatible") return profile;
  return { ...profile, apiKey: redactSecretReference(profile.apiKey) as `env:${string}` };
}

export function redactSecretReference(value: string): string {
  if (value.startsWith("env:")) return value;
  return "[redacted]";
}

function redactEndpoint(value: string): string {
  const url = new URL(value);
  return `${url.origin}${url.pathname}`;
}
