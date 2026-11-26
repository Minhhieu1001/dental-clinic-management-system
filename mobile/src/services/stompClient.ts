import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { ChatMessageItem } from './chat.service';
import { NotificationItem } from './notification.service';
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

type TopicCallback = (payload: any) => void;

/**
 * Bộ quản lý kết nối STOMP WebSocket dùng chung duy nhất cho toàn ứng dụng Mobile
 * (Chat, Lịch hẹn, Thông báo đều chia sẻ chung 1 socket, tự SUBSCRIBE/UNSUBSCRIBE theo ref-count).
 */
class SharedStompHub {
  private ws: WebSocket | null = null;
  private stompConnected = false;
  private hasConnectedOnce = false;
  private status: WsConnectionStatus = 'offline';
  private buffer = '';
  private subCounter = 0;
  private retryAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private appStateInstalled = false;

  private topicListeners = new Map<string, Set<TopicCallback>>();
  private activeStompSubIds = new Map<string, string>();
  private statusListeners = new Set<(s: WsConnectionStatus) => void>();
  private reconnectListeners = new Set<() => void>();

  constructor() {
    this.ensureAppStateListener();
  }

  private ensureAppStateListener() {
    if (this.appStateInstalled) return;
    this.appStateInstalled = true;
    AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (
        nextState === 'active' &&
        this.topicListeners.size > 0 &&
        !this.stompConnected &&
        !this.reconnectTimer
      ) {
        this.retryAttempt = 0;
        this.connect();
      }
    });
  }

  private setStatus(next: WsConnectionStatus) {
    if (this.status === next) return;
    this.status = next;
    this.statusListeners.forEach((fn) => fn(next));
  }

  getStatus(): WsConnectionStatus {
    return this.status;
  }

  onStatusChange(fn: (s: WsConnectionStatus) => void): () => void {
    this.statusListeners.add(fn);
    fn(this.status);
    return () => {
      this.statusListeners.delete(fn);
    };
  }

  onReconnected(fn: () => void): () => void {
    this.reconnectListeners.add(fn);
    return () => {
      this.reconnectListeners.delete(fn);
    };
  }

  subscribe(destination: string, cb: TopicCallback): () => void {
    let set = this.topicListeners.get(destination);
    if (!set) {
      set = new Set();
      this.topicListeners.set(destination, set);
    }
    set.add(cb);

    if (this.stompConnected && !this.activeStompSubIds.has(destination)) {
      this.sendSubscribe(destination);
    } else if (!this.ws && !this.reconnectTimer) {
      this.connect();
    }

    return () => {
      const currentSet = this.topicListeners.get(destination);
      if (currentSet) {
        currentSet.delete(cb);
        if (currentSet.size === 0) {
          this.topicListeners.delete(destination);
          const subId = this.activeStompSubIds.get(destination);
          if (subId && this.stompConnected) {
            this.sendRaw(buildFrame('UNSUBSCRIBE', { id: subId }));
          }
          this.activeStompSubIds.delete(destination);
        }
      }
      if (this.topicListeners.size === 0) {
        this.disconnect();
      }
    };
  }

  private clearTimers() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private sendRaw(frame: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(frame);
    }
  }

  private sendSubscribe(destination: string) {
    const id = `sub-${this.subCounter++}`;
    this.activeStompSubIds.set(destination, id);
    this.sendRaw(buildFrame('SUBSCRIBE', { id, destination, ack: 'auto' }));
  }

  private async connect() {
    if (this.topicListeners.size === 0) {
      this.setStatus('offline');
      return;
    }
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    this.clearTimers();
    this.setStatus(this.hasConnectedOnce ? 'reconnecting' : 'connecting');

    const token = await tokenStorage.getAccessToken().catch(() => null);
    if (this.topicListeners.size === 0) return;

    const wsUrl = resolveWebSocketUrl();
    const hostHeader = getHostHeader(wsUrl);
    this.buffer = '';
    this.stompConnected = false;
    this.activeStompSubIds.clear();

    try {
      this.ws = new WebSocket(wsUrl);
    } catch {
      this.scheduleReconnect();
      return;
    }

    const socket = this.ws;

    socket.onopen = () => {
      if (this.ws !== socket) return;
      const headers: Record<string, string> = {
        'accept-version': '1.2,1.1,1.0',
        host: hostHeader,
        'heart-beat': '10000,10000',
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      this.sendRaw(buildFrame('CONNECT', headers));
    };

    socket.onmessage = (event) => {
      if (this.ws !== socket || typeof event.data !== 'string') return;
      this.buffer += event.data;

      let nullIdx = this.buffer.indexOf('\0');
      while (nullIdx !== -1) {
        const rawFrame = this.buffer.slice(0, nullIdx);
        this.buffer = this.buffer.slice(nullIdx + 1);
        const frame = parseFrame(rawFrame);

        if (frame?.command === 'CONNECTED') {
          const wasReconnect = this.hasConnectedOnce;
          this.hasConnectedOnce = true;
          this.stompConnected = true;
          this.retryAttempt = 0;
          this.setStatus('connected');

          this.activeStompSubIds.clear();
          for (const dest of this.topicListeners.keys()) {
            this.sendSubscribe(dest);
          }

          this.heartbeatTimer = setInterval(() => {
            this.sendRaw('\n');
          }, 10000);

          if (wasReconnect) {
            this.reconnectListeners.forEach((fn) => fn());
          }
        } else if (frame?.command === 'MESSAGE') {
          const dest = frame.headers.destination || '';
          const listeners = this.topicListeners.get(dest);
          if (listeners && listeners.size > 0) {
            try {
              const payload = JSON.parse(frame.body);
              listeners.forEach((cb) => cb(payload));
            } catch {
              // ignore non-JSON payload
            }
          }
        } else if (frame?.command === 'ERROR') {
          this.setStatus('reconnecting');
        }

        nullIdx = this.buffer.indexOf('\0');
      }

      if (this.buffer && !this.buffer.trim()) {
        this.buffer = '';
      }
    };

    socket.onerror = () => {
      // onclose handles retry
    };

    socket.onclose = () => {
      if (this.ws !== socket) return;
      this.clearTimers();
      this.ws = null;
      this.stompConnected = false;
      this.activeStompSubIds.clear();
      if (this.topicListeners.size > 0) {
        this.scheduleReconnect();
      } else {
        this.setStatus('offline');
      }
    };
  }

  private scheduleReconnect() {
    if (this.topicListeners.size === 0 || this.reconnectTimer) return;
    this.setStatus(this.hasConnectedOnce ? 'reconnecting' : 'connecting');
    const delay = Math.min(5000, 800 * Math.pow(2, this.retryAttempt));
    this.retryAttempt = Math.min(this.retryAttempt + 1, 3);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private disconnect() {
    this.clearTimers();
    const socket = this.ws;
    this.ws = null;
    const wasConnected = this.stompConnected;
    this.stompConnected = false;
    this.activeStompSubIds.clear();
    this.setStatus('offline');

    if (socket) {
      try {
        if (wasConnected && socket.readyState === WebSocket.OPEN) {
          socket.send(buildFrame('DISCONNECT'));
        }
        socket.close();
      } catch {
        // ignore close errors
      }
    }
  }
}

const stompHub = new SharedStompHub();

interface UseChatWebSocketOptions {
  roomId?: string | null;
  patientId?: string | null;
  onMessage?: (msg: ChatMessageItem) => void;
  onPatientUpdate?: (msg: ChatMessageItem) => void;
  onReconnect?: () => void;
}

export function useChatWebSocket({
  roomId,
  patientId,
  onMessage,
  onPatientUpdate,
  onReconnect,
}: UseChatWebSocketOptions): { status: WsConnectionStatus } {
  const [status, setStatus] = useState<WsConnectionStatus>(stompHub.getStatus());
  const cbRef = useRef({ onMessage, onPatientUpdate, onReconnect });

  useEffect(() => {
    cbRef.current = { onMessage, onPatientUpdate, onReconnect };
  }, [onMessage, onPatientUpdate, onReconnect]);

  useEffect(() => stompHub.onStatusChange(setStatus), []);

  useEffect(() => {
    return stompHub.onReconnected(() => {
      cbRef.current.onReconnect?.();
    });
  }, []);

  useEffect(() => {
    if (!roomId) return;
    return stompHub.subscribe(`/topic/chat/${roomId}`, (payload) => {
      cbRef.current.onMessage?.(payload as ChatMessageItem);
    });
  }, [roomId]);

  useEffect(() => {
    if (!patientId) return;
    return stompHub.subscribe(`/topic/patient/${patientId}/chat`, (payload) => {
      cbRef.current.onPatientUpdate?.(payload as ChatMessageItem);
    });
  }, [patientId]);

  return { status };
}

interface UseAppRealtimeOptions {
  userId?: string | null;
  patientId?: string | null;
  userPhone?: string | null;
  onAppointmentRealtime?: (payload: any) => void;
  onNotificationRealtime?: (notif: NotificationItem) => void;
}

/**
 * Hook lắng nghe Realtime Lịch hẹn (`/topic/appointments`) & Thông báo (`/user/queue/notifications`, `/topic/notifications`)
 * giống hệt `useWebSocket` trên Web.
 */
export function useAppRealtime({
  userId,
  patientId,
  userPhone,
  onAppointmentRealtime,
  onNotificationRealtime,
}: UseAppRealtimeOptions) {
  const cbRef = useRef({ onAppointmentRealtime, onNotificationRealtime });
  const identityRef = useRef({ userId, patientId, userPhone });

  useEffect(() => {
    cbRef.current = { onAppointmentRealtime, onNotificationRealtime };
  }, [onAppointmentRealtime, onNotificationRealtime]);

  useEffect(() => {
    identityRef.current = { userId, patientId, userPhone };
  }, [userId, patientId, userPhone]);

  useEffect(() => {
    if (!userId && !patientId) return;

    const cleanups: Array<() => void> = [];

    // 1. Lắng nghe cập nhật lịch hẹn realtime
    cleanups.push(
      stompHub.subscribe('/topic/appointments', (payload) => {
        if (!payload) return;
        const { userId: uid, patientId: pid, userPhone: phone } = identityRef.current;
        const isRelated =
          !payload.patientId ||
          (pid && String(payload.patientId) === String(pid)) ||
          (uid && String(payload.patientId) === String(uid)) ||
          (phone && payload.phone && String(payload.phone).trim() === String(phone).trim());
        if (isRelated) {
          cbRef.current.onAppointmentRealtime?.(payload);
        }
      })
    );

    // 2. Lắng nghe thông báo riêng Unicast & Broadcast
    const handleNotif = (payload: any) => {
      if (!payload) return;
      const { userId: uid } = identityRef.current;
      // Nếu thông báo chỉ định userId khác thì bỏ qua
      if (payload.userId && uid && String(payload.userId) !== String(uid)) {
        return;
      }
      cbRef.current.onNotificationRealtime?.(payload as NotificationItem);
    };

    cleanups.push(stompHub.subscribe('/user/queue/notifications', handleNotif));
    cleanups.push(stompHub.subscribe('/topic/notifications', handleNotif));

    return () => {
      cleanups.forEach((fn) => fn());
    };
  }, [userId, patientId]);
}
