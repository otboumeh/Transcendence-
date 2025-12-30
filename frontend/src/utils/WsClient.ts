// WebSocket Client with authentication, reconnection, and lifecycle management
import { WS_BASE_URL } from '../config.js';

export type WsMessageType = 'auth' | 'chat-friends' | 'chat-global' | 'game' | 'ping' | 'pong';

export interface WsMessage {
  type: WsMessageType;
  [key: string]: any;
}

export interface WsClientOptions {
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
  heartbeatInterval?: number;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Event) => void;
}

export class WsClient {
  private ws: WebSocket | null = null;
  private authenticated = false;
  private reconnectAttempts = 0;
  private heartbeatTimer: number | null = null;
  private reconnectTimer: number | null = null;
  private messageHandlers: Map<WsMessageType, ((data: any) => void)[]> = new Map();
  
  private token: string | null = null;
  private userId: string | null = null;
  
  private options: Required<WsClientOptions> = {
    autoReconnect: true,
    maxReconnectAttempts: 5,
    reconnectDelay: 2000,
    heartbeatInterval: 30000, // 30 seconds
    onConnected: () => {},
    onDisconnected: () => {},
    onError: () => {}
  };

  constructor(options?: WsClientOptions) {
    if (options) {
      this.options = { ...this.options, ...options };
    }
  }


  async connect(token: string, userId: string): Promise<void> {
    this.token = token;
    this.userId = userId;

    return new Promise((resolve, reject) => {
      try {
        if (this.ws) {
          this.ws.close();
        }

        this.ws = new WebSocket(WS_BASE_URL);
        
        this.ws.onopen = () => {
          this.reconnectAttempts = 0;
          
          this.sendRaw({
            type: 'auth',
            token: this.token,
            id: this.userId
          });
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as WsMessage;
            
            if (data.type === 'auth') {
              if (data.success || !data.error) {
                this.authenticated = true;
                this.startHeartbeat();
                this.options.onConnected();
                resolve();
              } else {
                console.error('❌ WebSocket authentication failed:', data.error);
                this.authenticated = false;
                reject(new Error(data.error || 'Authentication failed'));
                this.ws?.close();
              }
              return;
            }

            if (data.type === 'pong') {
              return;
            }

            this.dispatchMessage(data);
          } catch (err) {
            console.error('Error parsing WebSocket message:', err);
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          this.options.onError(error);
          reject(error);
        };

        this.ws.onclose = () => {
          this.authenticated = false;
          this.stopHeartbeat();
          this.options.onDisconnected();
          
          if (this.options.autoReconnect && this.reconnectAttempts < this.options.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };
      } catch (err) {
        console.error('Error creating WebSocket:', err);
        reject(err);
      }
    });
  }

  send(type: WsMessageType, data: any = {}): boolean {
    if (!this.authenticated) {
      console.warn('⚠️ Cannot send message: not authenticated');
      return false;
    }

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('⚠️ Cannot send message: WebSocket not open');
      return false;
    }

    this.sendRaw({ type, ...data });
    return true;
  }

  private sendRaw(data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }


  on(type: WsMessageType, handler: (data: any) => void): void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type)!.push(handler);
  }

  off(type: WsMessageType, handler: (data: any) => void): void {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private dispatchMessage(message: WsMessage): void {
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(message);
        } catch (err) {
          console.error(`Error in message handler for ${message.type}:`, err);
        }
      });
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatTimer = window.setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.sendRaw({ type: 'ping' });
      }
    }, this.options.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return;
    }

    this.reconnectAttempts++;
    const delay = this.options.reconnectDelay * this.reconnectAttempts;
    
    
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      
      if (this.token && this.userId) {
        this.connect(this.token, this.userId).catch(err => {
          console.error('Reconnection failed:', err);
        });
      }
    }, delay);
  }

 
  close(): void {
    this.options.autoReconnect = false; 
    this.stopHeartbeat();
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.authenticated = false;
    this.messageHandlers.clear();
  }

  isConnected(): boolean {
    return this.authenticated && this.ws?.readyState === WebSocket.OPEN;
  }


  getState(): 'connecting' | 'open' | 'closing' | 'closed' {
    if (!this.ws) return 'closed';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'open';
      case WebSocket.CLOSING: return 'closing';
      case WebSocket.CLOSED: return 'closed';
      default: return 'closed';
    }
  }
}
