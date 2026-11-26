import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { ChatMessageItem } from './chat.service';
import { tokenStorage } from './storage';

export type WsConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'offline';

const API_V1_URL = process.env.EXPO_PUBLIC_API_V1_URL || 'http://localhost:8080/api/v1';

export function resolveWebSocketUrl(): string {
  const explicit = process.env.EXPO_PUBLIC_WS_URL?.trim();
  if (explicit) {
    const ws = explicit.replace(/^http:/i, 'ws:').replace(/^https:/i, 'wss:').replace(/\/+$/, '');
    return ws.endsWith('/websocket') ? ws : `${ws}/websocket`;
  }
  const base = API_V1_URL.replace(/\/api(\/v\d+)?\/?$/i, '').replace(/\/+$/, '');
  const wsBase = base.replace(/^http:/i, 'ws:').replace(/^https:/i, 'wss:');
  return `${wsBase}/ws/websocket`;
}

function getHostHeader(wsUrl: string): string {
  const m = wsUrl.match(/^wss?:\/\/([^/:]+)/i);
  return m?.[1] || 'localhost';
}

interface StompFrame {
  command: string;
  headers: Record<string, string>;
  body: string;
}

function buildFrame(
  command: string,
  headers: Record<string, string> = {},
  body = ''
): string {
  const headerLines = Object.entries(headers).map(([k, v]) => `${k}:${v}`);
  const headerBlock = headerLines.length > 0 ? `${headerLines.join('\n')}\n` : '';
  return `${command}\n${headerBlock}\n${body}\0`;
}

function parseFrame(raw: string): StompFrame | null {
  const cleaned = raw.replace(/\r\n/g, '\n');
  if (!cleaned.trim()) return null;

  const sepIdx = cleaned.indexOf('\n\n');
  const headerSection = sepIdx >= 0 ? cleaned.slice(0, sepIdx) : cleaned;
  const body = sepIdx >= 0 ? cleaned.slice(sepIdx + 2) : '';

  const lines = headerSection.split('\n');
  const command = lines.shift()?.trim();
  if (!command) return null;

  const headers: Record<string, string> = {};
  for (const line of lines) {
    const colon = line.indexOf(':');
    if (colon > 0) {
      headers[line.slice(0, colon).trim()] = line.slice(colon + 1);
    }
  }
  return { command, headers, body };
}

interface UseChatWebSocketOptions {
  roomId?: string | null;
  patientId?: string | null;
  onMessage?: (msg: ChatMessageItem) => void;
  onPatientUpdate?: (msg: ChatMessageItem) => void;
  onReconnect?: () => void;
}

/**
 * Kết nối STOMP WebSocket bền vững theo patientId và SUBSCRIBE/UNSUBSCRIBE phòng chat tức thì (0 polling).
 */
export function useChatWebSocket({
  roomId,
  patientId,
  onMessage,
  onPatientUpdate,
  onReconnect,
}: UseChatWebSocketOptions): { status: WsConnectionStatus } {
  const [status, setStatus] = useState<WsConnectionStatus>('connecting');
  const callbacksRef = useRef({ onMessage, onPatientUpdate, onReconnect });
  const roomIdRef = useRef<string | null>(roomId ?? null);

  // Hàm quản lý subscription phòng chat động trên kết nối đang mở
  const syncRoomSubRef = useRef<((nextRoomId: string | null) => void) | null>(null);

  useEffect(() => {
    callbacksRef.current = { onMessage, onPatientUpdate, onReconnect };
  }, [onMessage, onPatientUpdate, onReconnect]);

  useEffect(() => {
    roomIdRef.current = roomId ?? null;
    syncRoomSubRef.current?.(roomId ?? null);
  }, [roomId]);

  useEffect(() => {
    if (!patientId && !roomIdRef.current) {
      setStatus('offline');
      return;
    }

    const wsUrl = resolveWebSocketUrl();
    const hostHeader = getHostHeader(wsUrl);
    let disposed = false;
    let ws: WebSocket | null = null;
    let stompConnected = false;
    let hasConnectedOnce = false;
    let buffer = '';
    let subCounter = 0;
    let retryAttempt = 0;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

    let activeRoomSub: { id: string; roomId: string } | null = null;

    const clearTimers = () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
      }
    };

    const sendRaw = (frame: string) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(frame);
      }
    };

    const subscribeTopic = (destination: string): string => {
      const id = `sub-${subCounter++}`;
      sendRaw(buildFrame('SUBSCRIBE', { id, destination, ack: 'auto' }));
      return id;
    };

    const syncRoomSubscription = (nextRoomId: string | null) => {
      if (!stompConnected) return;
      if (activeRoomSub?.roomId === nextRoomId) return;

      if (activeRoomSub) {
        sendRaw(buildFrame('UNSUBSCRIBE', { id: activeRoomSub.id }));
        activeRoomSub = null;
      }
      if (nextRoomId) {
        const id = subscribeTopic(`/topic/chat/${nextRoomId}`);
        activeRoomSub = { id, roomId: nextRoomId };
      }
    };
    syncRoomSubRef.current = syncRoomSubscription;

    const connect = async () => {
      if (disposed) return;
      clearTimers();
      setStatus(hasConnectedOnce ? 'reconnecting' : 'connecting');

      const token = await tokenStorage.getAccessToken().catch(() => null);
      if (disposed) return;

      buffer = '';
      stompConnected = false;
      activeRoomSub = null;

      try {
        ws = new WebSocket(wsUrl);
      } catch {
        scheduleReconnect();
        return;
      }

      ws.onopen = () => {
        const headers: Record<string, string> = {
          'accept-version': '1.2,1.1,1.0',
          host: hostHeader,
          'heart-beat': '10000,10000',
        };
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
        sendRaw(buildFrame('CONNECT', headers));
      };

      ws.onmessage = (event) => {
        if (typeof event.data !== 'string') return;
        buffer += event.data;

        let nullIdx = buffer.indexOf('\0');
        while (nullIdx !== -1) {
          const rawFrame = buffer.slice(0, nullIdx);
          buffer = buffer.slice(nullIdx + 1);
          const frame = parseFrame(rawFrame);

          if (frame?.command === 'CONNECTED') {
            const wasReconnect = hasConnectedOnce;
            hasConnectedOnce = true;
            stompConnected = true;
            retryAttempt = 0;
            setStatus('connected');

            if (patientId) subscribeTopic(`/topic/patient/${patientId}/chat`);
            syncRoomSubscription(roomIdRef.current);

            heartbeatTimer = setInterval(() => {
              sendRaw('\n');
            }, 10000);

            if (wasReconnect) {
              callbacksRef.current.onReconnect?.();
            }
          } else if (frame?.command === 'MESSAGE') {
            const dest = frame.headers.destination || '';
            try {
              const payload = JSON.parse(frame.body) as ChatMessageItem;
              const currentRoom = roomIdRef.current;
              if (currentRoom && dest === `/topic/chat/${currentRoom}`) {
                callbacksRef.current.onMessage?.(payload);
              } else if (patientId && dest === `/topic/patient/${patientId}/chat`) {
                callbacksRef.current.onPatientUpdate?.(payload);
              }
            } catch {
              // ignore non-JSON body
            }
          } else if (frame?.command === 'ERROR') {
            setStatus('reconnecting');
          }

          nullIdx = buffer.indexOf('\0');
        }

        if (buffer && !buffer.trim()) {
          buffer = '';
        }
      };

      ws.onerror = () => {
        // onclose handles reconnect
      };

      ws.onclose = () => {
        clearTimers();
        stompConnected = false;
        activeRoomSub = null;
        if (!disposed) {
          scheduleReconnect();
        }
      };
    };

    const scheduleReconnect = () => {
      if (disposed || reconnectTimer) return;
      setStatus(hasConnectedOnce ? 'reconnecting' : 'connecting');
      const delay = Math.min(5000, 800 * Math.pow(2, retryAttempt));
      retryAttempt = Math.min(retryAttempt + 1, 3);
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        connect();
      }, delay);
    };

    const appStateSub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active' && !disposed && !stompConnected && !reconnectTimer) {
        retryAttempt = 0;
        connect();
      }
    });

    connect();

    return () => {
      disposed = true;
      syncRoomSubRef.current = null;
      appStateSub.remove();
      clearTimers();
      if (ws) {
        try {
          if (stompConnected && ws.readyState === WebSocket.OPEN) {
            ws.send(buildFrame('DISCONNECT'));
          }
          ws.close();
        } catch {
          // ignore close errors
        }
        ws = null;
      }
    };
  }, [patientId]);

  return { status };
}
