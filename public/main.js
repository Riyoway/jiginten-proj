const STREAM_URL = "https://intern-hls-server.tomaton.workers.dev/stream.m3u8";
const videoArea = document.getElementById("video-area");
const video = document.getElementById("live-video");

if (video) {
  if (typeof Hls !== "undefined" && Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(STREAM_URL);
    hls.attachMedia(video);
    hls.on(Hls.Events.ERROR, (_event, data) => {
      console.error("HLS playback error:", data);
    });
  } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = STREAM_URL; // Safari / iOS のネイティブHLS
  } else {
    console.error("HLS is not supported in this browser.");
  }

  video.play().catch(() => {
    // 自動再生がブロックされた場合は無視(再生ボタンで開始できる)
  });
}

// 再生バーのボタンを実際の動画操作に配線
const playBtn = videoArea.querySelector(".play-btn");
const muteBtn = videoArea.querySelector(".mute-btn");
const fullscreenBtn = videoArea.querySelector(".fullscreen-btn");

playBtn?.addEventListener("click", () => {
  video.paused ? video.play() : video.pause();
});

muteBtn?.addEventListener("click", () => {
  video.muted = !video.muted;
});

fullscreenBtn?.addEventListener("click", () => {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    videoArea.requestFullscreen(); // video要素単体ではなくoverlay込みの領域を全画面化
  }
});
