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

// アイコン画像要素を作る(コメント欄・アイテム一覧の両方で使う共通処理)
function createIconImg(iconUrl, name) {
  const icon = document.createElement("img");
  icon.src = iconUrl;
  icon.alt = name ?? "";
  icon.className = "comment-item-icon";
  return icon;
}

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
      const icon = createIconImg(payload.item.iconUrl, payload.item.name);
      icon.onerror = () => icon.remove(); // アイコンが読み込めなくても文字だけは表示する
      li.append(icon, payload.item.name ?? "");
      if (payload.text) li.append(` ${payload.text}`); // アイテム+コメント同時送信時は両方表示
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

// ---- コメント送信 ----
const SEND_URL = "https://intern-comment-server.intern-comment-server.deno.net/messages";
const MAX_COMMENT_LENGTH = 200;
const commentForm = document.querySelector(".comment-form");
const commentInput = document.querySelector(".comment-input");
const sendBtn = document.querySelector(".send-btn");
const sendError = document.querySelector(".send-error");
let isSending = false;
let selectedItemId = null;

// 選択中のアイテムを解除する(送信成功時・アイテム再クリック時の両方で使う)
function clearItemSelection() {
  document.querySelector(".item-shortcut.is-selected")?.classList.remove("is-selected");
  selectedItemId = null;
}

// text/itemIdのどちらか(または両方)を送信する汎用送信関数
async function sendMessage() {
  if (isSending) return;

  const text = commentInput.value.trim();
  if (text.length > MAX_COMMENT_LENGTH) return;
  if (!text && !selectedItemId) return; // どちらも無ければ送信しない

  const payload = {};
  if (text) payload.text = text;
  if (selectedItemId) payload.itemId = selectedItemId;

  isSending = true;
  sendBtn.disabled = true;
  sendError.hidden = true; // 前回のエラー表示をクリア

  try {
    const res = await fetch(SEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`送信失敗: ${res.status}`);
    commentInput.value = ""; // 表示は上のSSE受信リスナー任せ(ここではDOMに追加しない)
    resizeCommentInput();
    clearItemSelection();
  } catch (err) {
    console.error("コメント送信エラー:", err); // 失敗時は入力内容・アイテム選択を残す
    sendError.hidden = false;
  } finally {
    isSending = false;
    sendBtn.disabled = false;
  }
}

commentForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  sendMessage();
});

commentInput?.addEventListener("keydown", (e) => {
  // Shift+Enterは改行(デフォルト動作に任せる)、Enter単体は送信
  // isComposing: 日本語IMEの変換確定Enterで誤送信しないためのガード
  if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
    e.preventDefault();
    sendMessage();
  }
});

// 入力行数に合わせてtextareaの高さを自動調整(CSSのmax-heightで上限〜5行に抑える)
function resizeCommentInput() {
  commentInput.style.height = "auto";
  commentInput.style.height = `${commentInput.scrollHeight}px`;
}

commentInput?.addEventListener("input", resizeCommentInput);

// ---- アイテム一覧 ----
const ITEMS_URL = "https://intern-comment-server.intern-comment-server.deno.net/items";
const itemShortcuts = document.querySelector(".item-shortcuts");
const itemToggleBtn = document.querySelector(".gift-btn");
let itemsLoaded = false;

// アイテム一覧を初めて開いた時だけ取得する
async function loadItems() {
  if (itemsLoaded || !itemShortcuts) return;

  try {
    const res = await fetch(ITEMS_URL);
    if (!res.ok) throw new Error(`アイテム取得失敗: ${res.status}`);

    const { items } = await res.json();

    items.forEach((item) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "item-shortcut";
      btn.dataset.itemId = item.id;
      btn.setAttribute("aria-pressed", "false");
      btn.append(createIconImg(item.iconUrl, item.name), item.name);

      btn.addEventListener("click", () => {
        const wasSelected = btn.classList.contains("is-selected");
        clearItemSelection();

        if (!wasSelected) {
          btn.classList.add("is-selected");
          btn.setAttribute("aria-pressed", "true");
          selectedItemId = item.id;
        } else {
          btn.setAttribute("aria-pressed", "false");
        }
      });

      itemShortcuts.appendChild(btn);
    });

    itemsLoaded = true;
  } catch (err) {
    console.error("アイテム一覧の取得に失敗:", err);
  }
}

itemToggleBtn?.addEventListener("click", async () => {
  if (!itemShortcuts) return;

  itemShortcuts.hidden = !itemShortcuts.hidden;
  const isOpen = !itemShortcuts.hidden;

  itemToggleBtn.setAttribute("aria-expanded", String(isOpen));

  if (isOpen) {
    await loadItems();
  }
});
