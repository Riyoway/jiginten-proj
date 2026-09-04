import { useEffect } from "react";
import { openCommentStream } from "../../lib/api/comments";
import { useCommentStore } from "../../store/comments";

export function useCommentStream() {
  const push = useCommentStore((state) => state.push);

  useEffect(() => openCommentStream({ onMessage: push }), [push]);
}
