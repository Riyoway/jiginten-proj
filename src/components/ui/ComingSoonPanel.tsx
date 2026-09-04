import { Card, Chip } from "@heroui/react";
import type { ReactNode } from "react";

interface ComingSoonPanelProps {
  title: string;
  note: string;
  children: ReactNode;
}

// ponytail: データ源が無いセクション用。API追加時はこのラッパーごと実データ表示に差し替える。
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

const ROW_KEYS = ["row-1", "row-2", "row-3"] as const;

// ponytail: 具体的な名前・数値は絶対に入れない(存在しないユーザーを捏造しないため)。
export function PlaceholderRows() {
  return (
    <div className="placeholder-list">
      {ROW_KEYS.map((key) => (
        <div className="placeholder-row" key={key}>
          <span className="placeholder-avatar" />
          <span className="placeholder-line" />
        </div>
      ))}
    </div>
  );
}
