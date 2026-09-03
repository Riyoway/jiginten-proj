import type { SendMessagePayload } from "./contracts";
import { endpoints } from "./endpoints";

export async function sendMessage(payload: SendMessagePayload) {
  const response = await fetch(endpoints.messages, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Message request failed with ${response.status}`);
  }
}
