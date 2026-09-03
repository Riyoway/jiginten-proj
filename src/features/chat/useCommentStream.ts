import { useEffect, useState } from "react";
import { openCommentStream } from "../../lib/api/comments";
import { useCommentStore } from "../../store/comments";

export function useCommentStream() {
  const push = useCommentStore((state) => state.push);
  const [connected, setConnected] = useState(true);

  useEffect(() => {
    return openCommentStream({
      onMessage: (comment) => {
        setConnected(true);
        push(comment);
      },
      onError: () => setConnected(false),
    });
  }, [push]);

  return { connected };
}
