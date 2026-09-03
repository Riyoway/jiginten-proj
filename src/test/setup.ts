import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// ponytail: vitest.config.tsでtest.globalsを有効にしていないため、Testing Libraryの
// 自動cleanup(グローバルafterEach検知に依存)が効かない。複数のrender()を呼ぶ
// コンポーネントテストがDOMをリークしないよう、ここで明示的に登録する。
afterEach(() => {
  cleanup();
});
