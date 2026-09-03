import { useEffect, useState } from "react";
import type { Gift } from "../../lib/api/contracts";
import { getGifts } from "../../lib/api/gifts";

export function useGiftCatalog(open: boolean) {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || loaded) return;
    const controller = new AbortController();

    getGifts(controller.signal)
      .then((items) => {
        setGifts(items);
        setLoaded(true);
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setError("ギフト一覧を取得できませんでした");
      });

    return () => controller.abort();
  }, [loaded, open]);

  return { gifts, loaded, error };
}
