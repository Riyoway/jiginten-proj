import type { Gift } from "./contracts";
import { endpoints } from "./endpoints";

export async function getGifts(signal?: AbortSignal): Promise<Gift[]> {
  const response = await fetch(endpoints.gifts, { signal });
  if (!response.ok) {
    throw new Error(`Gift request failed with ${response.status}`);
  }

  const body = (await response.json()) as { items?: Gift[] };
  return body.items ?? [];
}
