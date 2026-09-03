export interface Gift {
  id: string;
  name: string;
  iconUrl: string;
}

export interface Channel {
  id: string;
  title: string;
  playlist: string;
  default: boolean;
  // 出典情報など、実レスポンスにしか存在しない未確定フィールド用。
  [key: string]: unknown;
}

export interface IncomingComment {
  id?: string;
  text?: string;
  item?: {
    id?: string;
    name?: string;
    iconUrl?: string;
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
  };
}

export interface SendMessagePayload {
  text?: string;
  itemId?: string;
}
