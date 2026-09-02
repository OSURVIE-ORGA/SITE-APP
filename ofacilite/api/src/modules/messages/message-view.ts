import type { Message } from './message.entity';

export interface MessageView {
  id: string;
  fromAdmin: boolean;
  body: string;
  createdAt: string;
  readAt: string | null;
}

export interface ThreadView {
  userId: string;
  userName: string;
  lastMessage: string;
  lastAt: string;
  lastFromAdmin: boolean;
  unread: number;
}

export function toMessageView(m: Message): MessageView {
  return {
    id: m.id,
    fromAdmin: m.fromAdmin,
    body: m.body,
    createdAt: m.createdAt.toISOString(),
    readAt: m.readAt ? m.readAt.toISOString() : null,
  };
}
