import Hls from "hls.js";
import { useEffect, useRef, useState } from "react";
import { resolvePlaylistUrl } from "../../lib/api/channels";
import type { Channel } from "../../lib/api/contracts";

const STORAGE_PREFIX = "streamly-thumbnail:";
const MAX_CAPTURE_WIDTH = 640;
const CAPTURE_TIMEOUT_MS = 12_000;

interface StreamThumbnailProps {
  channel: Pick<Channel, "id" | "playlist">;
  className?: string;
}

export function getStreamThumbnailStorageKey(channelId: string) {
  return `${STORAGE_PREFIX}${channelId}`;
}

function readCachedThumbnail(channelId: string) {
  try {
    return localStorage.getItem(getStreamThumbnailStorageKey(channelId));
  } catch {
    return null;
  }
}

function cacheThumbnail(channelId: string, thumbnail: string) {
  try {
    localStorage.setItem(getStreamThumbnailStorageKey(channelId), thumbnail);
  } catch {
    // localStorageが使えない端末でも、取得できたフレームはその場で表示する。
  }
}

function startFrameCapture(source: string, onCapture: (thumbnail: string) => void) {
  const video = document.createElement("video");
  video.className = "stream-thumbnail-capture";
  video.autoplay = true;
  video.muted = true;
  video.playsInline = true;
  video.crossOrigin = "anonymous";
  video.preload = "auto";
  video.setAttribute("aria-hidden", "true");
  document.body.append(video);

  let hls: Hls | null = null;
  let stopped = false;
  let timeoutId: number | undefined;

  const stop = () => {
    if (stopped) return;
    stopped = true;
    if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    video.removeEventListener("loadeddata", capture);
    video.removeEventListener("canplay", capture);
    video.removeEventListener("playing", capture);
    video.removeEventListener("timeupdate", capture);
    hls?.off(Hls.Events.FRAG_BUFFERED, capture);
    hls?.off(Hls.Events.ERROR, handleHlsError);
    hls?.destroy();
    video.pause();
    video.removeAttribute("src");
    video.remove();
  };

  const capture = () => {
    if (stopped || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
    if (!video.videoWidth || !video.videoHeight) return;

    const width = Math.min(video.videoWidth, MAX_CAPTURE_WIDTH);
    const height = Math.max(1, Math.round((video.videoHeight / video.videoWidth) * width));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    try {
      const context = canvas.getContext("2d");
      if (!context) return;
      context.drawImage(video, 0, 0, width, height);
      const thumbnail = canvas.toDataURL("image/jpeg", 0.78);
      if (thumbnail === "data:,") return;
      onCapture(thumbnail);
      stop();
    } catch {
      // CORSやcanvas非対応時はnoimageのままにして、ストリーム再生を妨げない。
      stop();
    }
  };

  const handleHlsError = (_event: string, data: { fatal?: boolean }) => {
    if (data.fatal) stop();
  };

  video.addEventListener("loadeddata", capture);
  video.addEventListener("canplay", capture);
  video.addEventListener("playing", capture);
  video.addEventListener("timeupdate", capture);

  if (Hls.isSupported()) {
    hls = new Hls({
      enableWorker: true,
      lowLatencyMode: true,
      backBufferLength: 30,
    });
    hls.on(Hls.Events.FRAG_BUFFERED, capture);
    hls.on(Hls.Events.ERROR, handleHlsError);
    hls.loadSource(source);
    hls.attachMedia(video);
  } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = source;
    video.load();
  } else {
    stop();
    return stop;
  }

  timeoutId = window.setTimeout(stop, CAPTURE_TIMEOUT_MS);
  video.play().catch(() => undefined);
  return stop;
}

function useStreamThumbnail(channelId: string, source: string) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const [thumbnail, setThumbnail] = useState(() => readCachedThumbnail(channelId));

  useEffect(() => {
    const cached = readCachedThumbnail(channelId);
    if (cached) {
      setThumbnail(cached);
      return;
    }

    let stopCapture: (() => void) | undefined;
    let started = false;
    let observer: IntersectionObserver | undefined;

    const capture = () => {
      if (started) return;
      started = true;
      stopCapture = startFrameCapture(source, (capturedThumbnail) => {
        cacheThumbnail(channelId, capturedThumbnail);
        setThumbnail(capturedThumbnail);
      });
    };

    if (typeof IntersectionObserver === "undefined" || !containerRef.current) {
      capture();
    } else {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting) {
            observer?.disconnect();
            capture();
          }
        },
        { rootMargin: "240px" },
      );
      observer.observe(containerRef.current);
    }

    return () => {
      observer?.disconnect();
      stopCapture?.();
    };
  }, [channelId, source]);

  return { containerRef, thumbnail };
}

export function StreamThumbnail({ channel, className }: StreamThumbnailProps) {
  const source = resolvePlaylistUrl(channel.playlist);
  const { containerRef, thumbnail } = useStreamThumbnail(channel.id, source);

  return (
    <span ref={containerRef} className={className ? `stream-thumbnail ${className}` : "stream-thumbnail"}>
      <img className="stream-thumbnail-image" src={thumbnail ?? "/noimage.jpg"} alt="" loading="lazy" />
    </span>
  );
}
