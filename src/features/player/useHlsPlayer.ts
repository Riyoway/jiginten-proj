import Hls from "hls.js";
import { useEffect, useState } from "react";

export type StreamOrientation = "portrait" | "landscape" | "unknown";

export function useHlsPlayer(video: HTMLVideoElement | null, source: string) {
  const [orientation, setOrientation] = useState<StreamOrientation>("unknown");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!video) return;
    setError(null); // ponytail: チャンネル切り替え時に前のチャンネルのエラー表示が残らないように

    const detectOrientation = () => {
      if (!video.videoWidth || !video.videoHeight) return;
      setOrientation(video.videoHeight > video.videoWidth ? "portrait" : "landscape");
    };

    video.addEventListener("loadedmetadata", detectOrientation);

    let hls: Hls | null = null;
    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30,
      });
      hls.loadSource(source);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_event, data) => {
        console.error("HLS playback error", data);
        if (data.fatal) setError(data.details);
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = source;
    } else {
      setError("This browser does not support HLS playback.");
    }

    return () => {
      video.removeEventListener("loadedmetadata", detectOrientation);
      hls?.destroy();
    };
  }, [source, video]);

  return { orientation, error };
}
