import type { Channel } from "./contracts";
import { endpoints } from "./endpoints";

// ponytail: channels.json の実JSON全体(配列直下か{channels:[...]}か)はDocs/HLS-SERVER.mdでも
// 未確定と明記されているため、両方の形を受け付けて決め打ちを避ける。
export async function fetchChannels(signal?: AbortSignal): Promise<Channel[]> {
  const response = await fetch(endpoints.channels, { signal });
  if (!response.ok) {
    throw new Error(`Channels request failed with ${response.status}`);
  }

  const body = (await response.json()) as Channel[] | { channels?: Channel[] };
  return Array.isArray(body) ? body : (body.channels ?? []);
}

// playlistが相対URLの場合にも対応する。
export function resolvePlaylistUrl(playlist: string): string {
  return new URL(playlist, endpoints.channels).href;
}

// 選択順: URL指定のchannel id → default:true → 先頭
export function resolveSelectedChannel(channels: Channel[], requestedId?: string): Channel | null {
  const requested = requestedId ? channels.find((channel) => channel.id === requestedId) : undefined;
  return requested ?? channels.find((channel) => channel.default) ?? channels[0] ?? null;
}
