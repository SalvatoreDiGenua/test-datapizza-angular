import { inject, Service } from '@angular/core';

import { Configuration } from '../../../api';
import {
  ChatCitation,
  ChatStreamEvent,
  ChatStreamRequest,
} from '../../models/chat';

@Service()
export class ChatStreamService {
  private readonly configuration = inject(Configuration);

  async *streamChat(
    request: ChatStreamRequest,
  ): AsyncGenerator<ChatStreamEvent> {
    const response = await fetch(`${this.configuration.basePath}/api/chat/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/x-ndjson',
      },
      credentials: 'include',
      body: JSON.stringify({
        query: request.query,
        history: request.history,
      }),
      signal: request.signal,
    });

    if (!response.ok) {
      throw new Error(`Chat request failed with status ${response.status}`);
    }

    if (!response.body) {
      throw new Error('Chat response does not contain a readable body.');
    }

    for await (const line of readNdjsonLines(response.body)) {
      const event = parseChatStreamEvent(line);

      if (!event) {
        continue;
      }

      yield event;
    }
  }
}

async function* readNdjsonLines(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();

  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, {
        stream: true,
      });

      const lines = buffer.split('\n');

      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();

        if (trimmed) {
          yield trimmed;
        }
      }
    }

    buffer += decoder.decode();

    const lastLine = buffer.trim();

    if (lastLine) {
      yield lastLine;
    }
  } finally {
    reader.releaseLock();
  }
}

function parseChatStreamEvent(line: string): ChatStreamEvent | null {
  let value: unknown;

  try {
    value = JSON.parse(line);
  } catch {
    return null;
  }

  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;

  switch (record['type']) {
    case 'content':
      return parseContentEvent(record);

    case 'citations':
      return parseCitationsEvent(record);

    case 'error':
      return parseErrorEvent(record);

    default:
      return null;
  }
}

function parseContentEvent(
  record: Record<string, unknown>,
): ChatStreamEvent | null {
  const delta = record['delta'];

  if (typeof delta !== 'string') {
    return null;
  }

  return {
    type: 'content',
    delta,
  };
}

function parseCitationsEvent(
  record: Record<string, unknown>,
): ChatStreamEvent | null {
  const references = record['references'];

  if (!Array.isArray(references)) {
    return null;
  }

  const citations = references.filter(isChatCitation);

  return {
    type: 'citations',
    references: citations,
  };
}

function parseErrorEvent(
  record: Record<string, unknown>,
): ChatStreamEvent | null {
  const message = record['message'];

  if (typeof message !== 'string') {
    return null;
  }

  return {
    type: 'error',
    message,
  };
}

function isChatCitation(value: unknown): value is ChatCitation {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const citation = value as Record<string, unknown>;

  return (
    typeof citation['document_id'] === 'string' &&
    typeof citation['filename'] === 'string' &&
    typeof citation['page_number'] === 'number' &&
    typeof citation['text_quote'] === 'string' &&
    Array.isArray(citation['bounding_regions'])
  );
}
