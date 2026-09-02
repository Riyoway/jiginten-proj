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

// ---- ライブコメント(SSE受信) ----
const COMMENTS_URL = "https://intern-comment-server.intern-comment-server.deno.net/events";
const commentList = document.querySelector(".comment-list");
const MAX_COMMENTS = 300; // ponytail: 配信中にDOMが際限なく増えないようにする簡易上限。溢れたら要調整

if (commentList) {
  const seenIds = new Set(); // 再接続時にサーバーから同じコメントが再配信された場合の重複排除

  const commentSource = new EventSource(COMMENTS_URL); // 1回だけ接続。再接続はEventSourceが自動で行う

  commentSource.addEventListener("message", (event) => {
    let payload;
    try {
      payload = JSON.parse(event.data);
    } catch (err) {
      console.error("コメントのJSON解析に失敗:", err, event.data);
      return;
    }

    if (payload.id) {
      if (seenIds.has(payload.id)) return;
      seenIds.add(payload.id);
    }

    const li = document.createElement("li");
    li.dataset.commentId = payload.id ?? "";

    if (payload.item) {
      const icon = document.createElement("img");
      icon.src = payload.item.iconUrl;
      icon.alt = payload.item.name ?? "";
      icon.className = "comment-item-icon";
      icon.onerror = () => icon.remove(); // アイコンが読み込めなくても文字だけは表示する
      li.append(icon, payload.item.name ?? "");
    } else {
      li.textContent = payload.text ?? "";
    }

    commentList.appendChild(li);

    while (commentList.children.length > MAX_COMMENTS) {
      const oldest = commentList.firstChild;
      if (oldest.dataset.commentId) seenIds.delete(oldest.dataset.commentId);
      oldest.remove();
    }

    commentList.scrollTop = commentList.scrollHeight;
  });

  commentSource.onerror = (err) => {
    console.error("コメントSSE接続エラー:", err); // EventSourceが自動で再接続する
  };
}

// 送信フォームはページ遷移だけ防止(実送信先は未確定のため今回は対象外)
const commentForm = document.querySelector(".comment-form");
commentForm?.addEventListener("submit", (e) => {
  e.preventDefault();
});
