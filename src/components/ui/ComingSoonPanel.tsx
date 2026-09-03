import { Card, Chip } from "@heroui/react";
import type { ReactNode } from "react";

interface ComingSoonPanelProps {
  title: string;
  note: string;
  children: ReactNode;
}

// ponytail: 配信一覧/フォロー/ギフトランキングAPIが無いため、実データの代わりに
// 誠実な「近日公開」表示にしている。API追加時はこのラッパーごと実データ表示に差し替える。
// (紫色の英語eyebrowはreferenceデザインに存在しないため付けない。)
export function ComingSoonPanel({ title, note, children }: ComingSoonPanelProps) {
  return (
    <Card className="coming-soon-panel" variant="transparent">
      <Card.Header className="coming-soon-panel-header">
        <div>
          <Card.Title>{title}</Card.Title>
        </div>
        <Chip variant="soft" color="accent" size="sm">
          近日公開
        </Chip>
      </Card.Header>
      <Card.Content className="coming-soon-panel-body">{children}</Card.Content>
      <Card.Footer>
        <Card.Description>{note}</Card.Description>
      </Card.Footer>
    </Card>
  );
}

const ROW_KEYS = ["row-1", "row-2", "row-3", "row-4", "row-5"] as const;

// ponytail: 3箇所(おすすめチャンネル/フォロー中/トップギフター)で同じ抽象行を使うための共通部品。
// 具体的な名前・数値は絶対に入れない(存在しないユーザーを捏造しないため)。
export function PlaceholderRows({ count = 3 }: { count?: number }) {
  return (
    <div className="placeholder-list">
      {ROW_KEYS.slice(0, count).map((key) => (
        <div className="placeholder-row" key={key}>
          <span className="placeholder-avatar" />
          <span className="placeholder-line" />
        </div>
      ))}
    </div>
  );
}
