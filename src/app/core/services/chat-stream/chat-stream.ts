import { Service, inject } from '@angular/core';
import { Configuration } from '../../../api';
import { ChatStreamEvent, ChatStreamRequest } from '../../models/chat';

@Service()
export class ChatStreamService {
  private readonly configuration = inject(Configuration);

  /**
   * Avvia una richiesta di chat e restituisce gli eventi
   * man mano che arrivano dal backend.
   */
  async *streamChat(
    request: ChatStreamRequest,
  ): AsyncGenerator<ChatStreamEvent> {
    const response = await fetch(`${this.configuration.basePath}/api/chat/`, {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/x-ndjson',
      },
      body: JSON.stringify({
        query: request.query,
        history: request.history,
      }),
      credentials: 'include',
      signal: request.signal,
    });

    /**
     * Un HTTP status diverso da 2xx non è uno stream valido.
     */
    if (!response.ok) {
      throw new Error(`Chat request failed with status ${response.status}`);
    }

    /**
     * Senza body non possiamo leggere lo stream.
     */
    if (!response.body) {
      throw new Error('Chat response does not contain a readable body.');
    }

    /**
     * response.body è uno stream di Uint8Array.
     *
     * readNdjsonLines() si occupa di trasformarlo in:
     *
     * {"type":"content","delta":"t"}
     * {"type":"content","delta":"h"}
     * {"type":"content","delta":"e"}
     *
     * una riga alla volta.
     */
    for await (const line of readNdjsonLines(response.body)) {
      const event = parseChatStreamEvent(line);

      /**
       * Se la riga non rispetta il contratto previsto,
       * la ignoriamo.
       *
       * In questo modo il componente riceve solamente
       * eventi validi.
       */
      if (!event) {
        continue;
      }

      yield event;
    }
  }
}

/**
 * Legge uno stream NDJSON una riga alla volta.
 *
 * IMPORTANTE:
 *
 * Non possiamo assumere che:
 *
 *   reader.read()
 *
 * restituisca esattamente una riga JSON.
 *
 * Potrebbe arrivare:
 *
 *   {"type":"content","del
 *
 * e nella lettura successiva:
 *
 *   ta":"t"}\n
 *
 * Oppure potrebbero arrivare 10 righe insieme.
 *
 * Per questo manteniamo un buffer.
 */
async function* readNdjsonLines(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<string> {
  const reader = body.getReader();

  /**
   * TextDecoder converte i byte ricevuti
   * in testo UTF-8.
   */
  const decoder = new TextDecoder();

  /**
   * Contiene la parte di testo che non è ancora
   * terminata da "\n".
   */
  let buffer = '';

  try {
    for (;;) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      /**
       * { stream: true } è importante perché un carattere
       * UTF-8 potrebbe essere diviso tra due chunk.
       */
      buffer += decoder.decode(value, {
        stream: true,
      });

      /**
       * Dividiamo per newline.
       *
       * L'ultima parte potrebbe essere incompleta:
       *
       * buffer:
       *
       * line 1\n
       * line 2\n
       * {"type":"cont
       *
       * split('\n') produrrà:
       *
       * [
       *   'line 1',
       *   'line 2',
       *   '{"type":"cont'
       * ]
       *
       * L'ultima parte viene conservata nel buffer.
       */
      const lines = buffer.split('\n');

      buffer = lines.pop() ?? '';

      /**
       * Tutte le righe complete possono essere
       * restituite al chiamante.
       */
      for (const line of lines) {
        const trimmed = line.trim();

        if (trimmed) {
          yield trimmed;
        }
      }
    }

    /**
     * Flush finale del TextDecoder.
     *
     * Serve per gestire eventuali byte UTF-8 rimasti
     * nell'ultimo chunk.
     */
    buffer += decoder.decode();

    /**
     * Potrebbe essere rimasta una riga senza "\n"
     * finale.
     */
    const lastLine = buffer.trim();

    if (lastLine) {
      yield lastLine;
    }
  } finally {
    /**
     * Rilasciamo il reader anche in caso di errore
     * o AbortController.
     */
    reader.releaseLock();
  }
}

/**
 * Trasforma una riga NDJSON in un evento tipizzato.
 *
 * Input:
 *
 * {"type":"content","delta":"t"}
 *
 * Output:
 *
 * {
 *   type: 'content',
 *   delta: 't'
 * }
 */
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

  if (record['type'] === 'content' && typeof record['delta'] === 'string') {
    return {
      type: 'content',
      delta: record['delta'],
    };
  }

  /**
   * Qualsiasi altro evento, per ora, viene ignorato.
   */
  return null;
}
