import { Expand, MessageSquareText, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePreferenceStore } from "../../store/preferences";
import { DanmakuLayer } from "../danmaku/DanmakuLayer";
import { GiftOverlay } from "./GiftOverlay";
import { useHlsPlayer } from "./useHlsPlayer";

interface StreamPlayerProps {
  source: string;
}

export function StreamPlayer({ source }: StreamPlayerProps) {
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const muted = usePreferenceStore((state) => state.muted);
  const volume = usePreferenceStore((state) => state.volume);
  const danmakuEnabled = usePreferenceStore((state) => state.danmakuEnabled);
  const setMuted = usePreferenceStore((state) => state.setMuted);
  const setVolume = usePreferenceStore((state) => state.setVolume);
  const setDanmakuEnabled = usePreferenceStore((state) => state.setDanmakuEnabled);
  const { orientation, error } = useHlsPlayer(video, source);

  useEffect(() => {
    if (!video) return;
    video.muted = muted;
    video.volume = volume;
  }, [muted, video, volume]);

  useEffect(() => {
    if (!video || !source) return;

    video.play().catch(() => {
      // 音声付きの自動再生が拒否された場合も、映像だけは自動再生する。
      if (video.muted) return;
      video.muted = true;
      setMuted(true);
      video.play().catch(() => undefined);
    });
  }, [setMuted, source, video]);

  const togglePlay = () => {
    if (!video) return;
    if (video.paused) video.play().catch(() => undefined);
    else video.pause();
  };

  const toggleFullscreen = () => {
    if (!frameRef.current) return;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined);
    else frameRef.current.requestFullscreen().catch(() => undefined);
  };

  return (
    <section className={`player-frame ${orientation}`} ref={frameRef} aria-label="ライブ配信プレイヤー">
      <video
        ref={setVideo}
        className="stream-video"
        autoPlay
        playsInline
        muted={muted}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />

      <DanmakuLayer />
      <GiftOverlay />

      <div className="player-badges">
        <span className="live-badge">LIVE</span>
      </div>

      {error ? <div className="player-error">{error}</div> : null}

      <div className="player-controls">
        <button type="button" onClick={togglePlay} aria-label={playing ? "一時停止" : "再生"}>
          {playing ? <Pause size={21} /> : <Play size={21} />}
        </button>
        <div className="volume-control">
          <button
            type="button"
            onClick={() => setMuted(!muted)}
            aria-label={muted ? "ミュート解除" : "ミュート"}
          >
            {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <input
            className="volume-slider"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            aria-label={`音量 ${Math.round(volume * 100)}%`}
            onChange={(event) => setVolume(Number(event.currentTarget.value))}
          />
        </div>
        <span className="live-dot" />
        <span className="live-label">LIVE</span>
        <span className="control-spacer" />
        <button
          className={danmakuEnabled ? "active-control" : ""}
          type="button"
          onClick={() => setDanmakuEnabled(!danmakuEnabled)}
          aria-pressed={danmakuEnabled}
          aria-label="弾幕コメントを切り替え"
        >
          <MessageSquareText size={18} />
          <span>弾幕</span>
        </button>
        <button type="button" onClick={toggleFullscreen} aria-label="フルスクリーン">
          <Expand size={20} />
        </button>
      </div>
    </section>
  );
}
