import { ChatRequest } from '../../api';

export interface ChatContentEvent {
  type: 'content';
  delta: string;
}

export type ChatStreamEvent = ChatContentEvent;

export interface ChatStreamRequest extends ChatRequest {
  /**
   * Permette al componente di interrompere la richiesta,
   * ad esempio quando l'utente cambia pagina o chiude la chat.
   */
  signal: AbortSignal;
}

export type ChatRole = 'user' | 'assistant';

export type ChatMessageStatus = 'complete' | 'streaming' | 'error';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  time: string;
  status: ChatMessageStatus;
}

export interface ChatConversation {
  id: string;
  messages: ChatMessage[];
}

export interface ChatApiMessage {
  id?: unknown;
  role?: unknown;
  content?: unknown;
  time?: unknown;
}

export interface ChatApiResponse {
  id?: unknown;
  messages?: unknown;
}
