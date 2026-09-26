export interface ChatBoundingRegion {
  page_number: number;
  rects_in: number[][];
}

export interface ChatCitation {
  document_id: string;
  filename: string;
  page_number: number;
  text_quote: string;
  bounding_regions: ChatBoundingRegion[];
}

export interface ChatApiConversation {
  id: string;
  user_id: string;
  created_at: string;
  query: string;
  response: string;
  citations?: ChatCitation[];
}

export interface ChatApiResponse {
  id: string;
  user_id: string;
  created_at: string;
  query: string;
  response: string;
  citations?: ChatCitation[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  time: string;
  status: 'complete' | 'streaming' | 'error';
  citations?: ChatCitation[];
}

export interface ChatConversation {
  id: string;
  messages: ChatMessage[];
}

export interface ChatHistoryItem {
  id: string;
  title: string;
  preview: string;
  createdAt: string;
}

export interface ChatStreamRequest {
  query: string;
  history: {
    role: 'user' | 'assistant';
    content: string;
  }[];
  signal?: AbortSignal;
}

export type ChatStreamEvent =
  | {
      type: 'content';
      delta: string;
    }
  | {
      type: 'citations';
      references: ChatCitation[];
    }
  | {
      type: 'error';
      message: string;
    };
