// Docs/ITEMS-API.md の Item そのもの。
export interface Gift {
  id: string;
  name: string;
  iconUrl: string;
  cost: number;
  group: string;
  // アニメーションを持たないギフトは null。cost からアニメーションの有無を推測しないこと。
  animationUrl: string | null;
}

export interface Channel {
  id: string;
  title: string;
  category: string;
  playlist: string;
  default: boolean;
  // 出典情報など、実レスポンスにしか存在しない未確定フィールド用。
  [key: string]: unknown;
}

// SSEのpayload。実測では item に /items と同じ6フィールドが入ってくるが、
// 受信側では欠けていても壊れないよう全て optional のままにしておく。
export interface IncomingComment {
  id?: string;
  text?: string;
  item?: {
    id?: string;
    name?: string;
    iconUrl?: string;
    cost?: number;
    group?: string;
    animationUrl?: string | null;
  };
}

export interface ChatMessage {
  key: string;
  id?: string;
  text: string;
  receivedAt: number;
  gift?: {
    id?: string;
    name: string;
    iconUrl: string;
    cost?: number;
    animationUrl?: string | null;
  };
}

export interface SendMessagePayload {
  text?: string;
  itemId?: string;
}
