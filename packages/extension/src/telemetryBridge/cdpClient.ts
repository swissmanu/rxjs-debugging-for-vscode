import WebSocket from 'ws';
import { IDisposable } from '../util/types';

export const ICDPClientAddress = Symbol('ICDPClientAddress');
export interface ICDPClientAddress {
  host: string;
  port: number;

  /**
   * TODO Make required once https://github.com/microsoft/vscode-js-debug/issues/987 is released
   */
  path?: string;
}

interface IFulfillRequest {
  resolve: (result: unknown) => void;
  reject: (e: Error) => void;
}

type Method = string;
type SubscriptionCallback = (data: Record<string, unknown>) => void;
type MessageId = number;

interface IProtocolCommand {
  id?: number;
  method: string;
  params: Record<string, unknown>;
  sessionId?: string;
}

interface IProtocolError {
  id: number;
  method?: string;
  error: { code: number; message: string };
  sessionId?: string;
}

interface IProtocolSuccess {
  id: number;
  result: Record<string, unknown>;
  sessionId?: string;
}

type ProtocolMessage = IProtocolCommand | ProtocolResponse;
type ProtocolResponse = IProtocolError | IProtocolSuccess;

export interface ICDPClient extends IDisposable {
  connect(): Promise<void>;
  request(domain: string, method: string, params?: Record<string, unknown>): Promise<unknown>;
  subscribe(domain: string, event: string, callback: SubscriptionCallback): Promise<unknown>;
}

/**
 * A client for the shared CDP connection of js-debug.
 *
 * @see https://github.com/microsoft/vscode-js-debug/blob/main/CDP_SHARE.md
 */
export default class CDPClient implements ICDPClient {
  private webSocket?: WebSocket;

  private lastMessageId = 0;
  private pendingRequests: Map<MessageId, IFulfillRequest> = new Map();
  private subscriptions: Map<Method, SubscriptionCallback[]> = new Map();

  constructor(private readonly host: string, private readonly port: number, private readonly path: string) {}

  connect(): Promise<void> {
    if (!this.webSocket) {
      return new Promise((resolve) => {
        const webSocket = new WebSocket(`ws://${this.host}:${this.port}${this.path}`);

        webSocket.on('message', (d) => {
          const message = d.toString();
          onMessage(message, {
            Response: (response) => {
              const pendingRequest = this.pendingRequests.get(response.id);

              if (!pendingRequest) {
                return;
              }

              this.pendingRequests.delete(response.id);
              if ('error' in response) {
                pendingRequest.reject(new Error(JSON.stringify(response.error)));
              } else if ('result' in response) {
                pendingRequest.resolve(response.result);
              }
            },
            Event: (event) => {
              const callbacks = this.subscriptions.get(event.method) || [];
              for (const callback of callbacks) {
                callback(event.params);
              }
            },
          });
        });

        webSocket.on('open', async () => {
          this.webSocket = webSocket;
          resolve();
        });
      });
    }

    return Promise.resolve();
  }

  request(domain: string, method: string, params?: Record<string, unknown>): Promise<unknown> {
    return this.send(`${domain}.${method}`, params);
  }

  async subscribe(domain: string, event: string, callback: SubscriptionCallback): Promise<unknown> {
    const domainAndEvent = `${domain}.${event}`;

    if (this.subscriptions.has(domainAndEvent)) {
      this.subscriptions.get(domainAndEvent)?.push(callback);
    } else {
      this.subscriptions.set(domainAndEvent, [callback]);
    }

    return this.request('JsDebug', 'subscribe', { events: [domainAndEvent] });
  }

  dispose(): void {
    if (this.webSocket) {
      this.webSocket.close();
      this.webSocket = undefined;
    }
  }

  private async send(method: string, params?: Record<string, unknown>): Promise<unknown> {
    if (!this.webSocket) {
      throw new Error('WebSocket not initialized.');
    }

    const messageId = ++this.lastMessageId;

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(messageId, {
        resolve,
        reject,
      });

      const message = {
        id: messageId,
        method,
        params,
      };
      const json = JSON.stringify(message);

      this.webSocket?.send(json);
    });
  }
}

function onMessage<T>(
  message: string,
  handlers: {
    Response(r: ProtocolResponse): T;
    Event(e: IProtocolCommand): T;
  }
): T {
  const json = JSON.parse(message);
  const response = json as ProtocolMessage;

  if (response.id === undefined) {
    return handlers.Event(response as IProtocolCommand);
  }

  return handlers.Response(response as ProtocolResponse);
}
