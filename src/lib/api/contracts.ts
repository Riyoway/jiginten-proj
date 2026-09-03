export interface Gift {
  id: string;
  name: string;
  iconUrl: string;
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
