import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// ponytail: vitest.config.tsでtest.globalsを有効にしていないため、Testing Libraryの
// 自動cleanup(グローバルafterEach検知に依存)が効かない。複数のrender()を呼ぶ
// コンポーネントテストがDOMをリークしないよう、ここで明示的に登録する。
afterEach(() => {
  cleanup();
});

// ponytail: jsdomにはEventSourceが無く、WatchPage(ChatPanel経由でopenCommentStreamが
// new EventSource()する)をrenderするテストが全滅する。実際のSSEは検証しないテストなので、
// 接続を確立しない最小限のstubで十分。
class StubEventSource {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSED = 2;

  constructor(public url: string) {}
  addEventListener() {}
  removeEventListener() {}
  close() {}
  dispatchEvent() {
    return true;
  }
}

if (typeof globalThis.EventSource === "undefined") {
  // biome-ignore lint/suspicious/noExplicitAny: 最小限のstubなので型はゆるく合わせるだけ
  globalThis.EventSource = StubEventSource as any;
}

// ponytail: jsdomはElement.scrollToを実装していない。ChatPanelの自動スクロールが
// 呼ぶだけで、スクロール位置自体をテストするわけではないのでno-opで十分。
if (!Element.prototype.scrollTo) {
  Element.prototype.scrollTo = () => {};
}

// ponytail: jsdomのHTMLMediaElement.playはPromiseを返さない(undefined)ため、
// StreamPlayerの`.catch()`チェーンが例外になる。実再生はどうせ検証しないのでresolve固定。
HTMLMediaElement.prototype.play = () => Promise.resolve();
HTMLMediaElement.prototype.pause = () => {};
