export const ENDPOINT_ENV_KEYS = {
  channels: "VITE_CHANNELS_URL",
  comments: "VITE_COMMENTS_URL",
  messages: "VITE_MESSAGES_URL",
  gifts: "VITE_GIFTS_URL",
} as const;

type EndpointName = keyof typeof ENDPOINT_ENV_KEYS;

export function resolveEndpoints(env: Record<string, string | undefined>): Record<EndpointName, string> {
  const resolved = {} as Record<EndpointName, string>;

  for (const [name, key] of Object.entries(ENDPOINT_ENV_KEYS) as [EndpointName, string][]) {
    const value = env[key]?.trim();
    if (!value) throw new Error(`${key} is required`);

    let protocol: string;
    try {
      protocol = new URL(value).protocol;
    } catch {
      throw new Error(`${key} must be an absolute HTTP(S) URL`);
    }
    if (protocol !== "http:" && protocol !== "https:") {
      throw new Error(`${key} must be an absolute HTTP(S) URL`);
    }

    resolved[name] = value;
  }

  return resolved;
}
