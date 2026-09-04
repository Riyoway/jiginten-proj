import { buttonVariants } from "@heroui/styles";
import { Link } from "@tanstack/react-router";
import { Home } from "lucide-react";

export function NotFoundPage() {
  return (
    <div className="not-found-page">
      <section className="not-found-content" aria-labelledby="not-found-title">
        <span className="not-found-code" aria-hidden="true">
          404
        </span>
        <div className="not-found-copy">
          <h1 id="not-found-title">ページが見つかりません</h1>
          <p>URLが変更されたか、削除された可能性があります。ホームから配信を探してください。</p>
          <Link className={buttonVariants({ variant: "primary" })} to="/">
            <Home size={17} />
            ホームへ戻る
          </Link>
        </div>
      </section>
    </div>
  );
}
