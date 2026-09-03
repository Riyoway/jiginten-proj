import type { IncomingComment } from "./contracts";
import { endpoints } from "./endpoints";

export function openCommentStream(options: {
  onMessage: (comment: IncomingComment) => void;
  onError?: (error: Event) => void;
}) {
  const source = new EventSource(endpoints.comments);

  source.addEventListener("message", (event) => {
    try {
      options.onMessage(JSON.parse(event.data) as IncomingComment);
    } catch (error) {
      console.error("Failed to parse comment payload", error, event.data);
    }
  });

  source.addEventListener("error", (event) => {
    options.onError?.(event);
  });

  return () => source.close();
}
