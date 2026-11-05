import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type SessionRole = 'host' | 'guest';
export type SessionTransportKind = 'broadcast' | 'websocket';

export interface SessionConfig {
  room: string;
  name: string;
  role: SessionRole;
  kind: SessionTransportKind;
  relayUrl?: string;
}

export interface SessionEnvelope<T = any> {
  v: 1;
  room: string;
  from: string;
  name: string;
  role: SessionRole;
  type: string;
  payload: T;
  ts: number;
}

export interface SessionPeer {
  id: string;
  name: string;
  role: SessionRole;
  lastSeen: number;
}

interface Transport {
  send(message: SessionEnvelope): void;
  close(): void;
}

function randomId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function createRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

@Injectable({ providedIn: 'root' })
export class SessionService implements OnDestroy {
  private transport: Transport | null = null;
  private clientId = randomId();
  private config: SessionConfig | null = null;
  private peers = new Map<string, SessionPeer>();
  private connectedSubject = new BehaviorSubject<boolean>(false);
  private peersSubject = new BehaviorSubject<SessionPeer[]>([]);
  private errorSubject = new BehaviorSubject<string | null>(null);
  private messageSubject = new BehaviorSubject<SessionEnvelope | null>(null);

  connected$ = this.connectedSubject.asObservable();
  peers$ = this.peersSubject.asObservable();
  error$ = this.errorSubject.asObservable();

  constructor(private zone: NgZone) {}

  get room(): string | null { return this.config ? this.config.room : null; }
  get name(): string { return this.config ? this.config.name : ''; }
  get role(): SessionRole | null { return this.config ? this.config.role : null; }
  get kind(): SessionTransportKind | null { return this.config ? this.config.kind : null; }
  get isConnected(): boolean { return this.connectedSubject.value; }
  get clientIdValue(): string { return this.clientId; }

  messages(): Observable<SessionEnvelope | null> { return this.messageSubject.asObservable(); }

  connect(config: SessionConfig): void {
    this.disconnect();
    this.config = { ...config, room: config.room.trim().toUpperCase() };
    this.errorSubject.next(null);
    try {
      if (config.kind === 'websocket' && config.relayUrl) {
        this.transport = this.createWebSocketTransport(this.config);
      } else {
        this.transport = this.createBroadcastTransport(this.config);
      }
      this.connectedSubject.next(true);
      this.send('presence', { name: this.config.name, role: this.config.role });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to connect session.';
      this.errorSubject.next(message);
      this.connectedSubject.next(false);
    }

  }

  disconnect(): void {
    if (this.transport) {
      try { this.send('leave', { name: this.name }); } catch {}
      this.transport.close();
      this.transport = null;
    }
    this.peers.clear();
    this.peersSubject.next([]);
    this.connectedSubject.next(false);
    this.config = null;
  }

  send<T>(type: string, payload: T): void {
    if (!this.transport || !this.config) return;
    const message: SessionEnvelope<T> = {
      v: 1,
      room: this.config.room,
      from: this.clientId,
      name: this.config.name,
      role: this.config.role,
      type,
      payload,
      ts: Date.now()
    };
    this.transport.send(message);
  }

  ngOnDestroy(): void {
    this.disconnect();
  }

  private createBroadcastTransport(config: SessionConfig): Transport {
    if (typeof BroadcastChannel === 'undefined') {
      throw new Error('BroadcastChannel is not supported in this browser. Use the WebSocket relay option.');
    }
    const channelName = 'kattam-kutta-session-' + config.room;
    const channel = new BroadcastChannel(channelName);
    channel.onmessage = (event) => this.zone.run(() => this.handleIncoming(event.data));
    channel.onmessageerror = () => this.zone.run(() => this.errorSubject.next('Received an unreadable session message.'));
    return {
      send: (message) => channel.postMessage(message),
      close: () => channel.close()
    };
  }

  private createWebSocketTransport(config: SessionConfig): Transport {
    const url = config.relayUrl as string;
    const ws = new WebSocket(url);
    ws.onopen = () => this.zone.run(() => {
      ws.send(JSON.stringify({ t: 'join', room: config.room, name: config.name, role: config.role, id: this.clientId }));
      this.connectedSubject.next(true);
    });
    ws.onmessage = (event) => this.zone.run(() => {
      try {
        const data = JSON.parse(event.data);
        if (data && data.t === 'error') { this.errorSubject.next(data.message || 'Relay error'); return; }
        if (data && data.t === 'relay' && data.message) { this.handleIncoming(data.message); return; }
        this.handleIncoming(data);
      } catch {
        this.errorSubject.next('Received an unreadable relay message.');
      }
    });
    ws.onerror = () => this.zone.run(() => this.errorSubject.next('WebSocket relay connection error.'));
    ws.onclose = () => this.zone.run(() => this.connectedSubject.next(false));
    return {
      send: (message) => {
        if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ t: 'relay', room: config.room, message }));
        else ws.addEventListener('open', () => ws.send(JSON.stringify({ t: 'relay', room: config.room, message })), { once: true } as any);
      },
      close: () => ws.close()
    };
  }

  private handleIncoming(raw: any): void {
    if (!raw || !this.config) return;
    const message = raw as SessionEnvelope;
    if (message.v !== 1 || message.room !== this.config.room || message.from === this.clientId) return;
    if (message.type === 'presence' || message.type === 'state' || message.type === 'action') {
      this.peers.set(message.from, { id: message.from, name: message.name, role: message.role, lastSeen: Date.now() });
      this.peersSubject.next(Array.from(this.peers.values()));
    }
    if (message.type === 'leave') {
      this.peers.delete(message.from);
      this.peersSubject.next(Array.from(this.peers.values()));
    }
    this.messageSubject.next(message);
  }
}
