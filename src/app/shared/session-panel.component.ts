import { Component, EventEmitter, Input, Output } from '@angular/core';
import { createRoomCode, SessionConfig, SessionPeer, SessionRole, SessionTransportKind } from './session.service';

@Component({
  selector: 'app-session-panel',
  template: `
    <nb-card status="info" *ngIf="!connected; else connectedTpl">
      <nb-card-header>{{ title || 'Group Session' }}</nb-card-header>
      <nb-card-body>
        <p class="copy">Host a session to get a room code, or join with a code. Use "Same browser/device tabs" for local testing, or a WebSocket relay URL for cross-device play.</p>
        <form #f="ngForm" (ngSubmit)="submit(f.value)" ngNativeValidate>
          <label [attr.for]="uid+'name'">Your name</label>
          <input [id]="uid+'name'" name="name" [(ngModel)]="form.name" required nbInput class="field" placeholder="Enter your name" />
          <label [attr.for]="uid+'mode'">Mode</label>
          <nb-select [id]="uid+'mode'" name="mode" [(selected)]="form.mode" class="field">
            <nb-option value="host">Host session</nb-option>
            <nb-option value="join">Join session</nb-option>
            <nb-option value="local">Local / pass & play</nb-option>
          </nb-select>
          <ng-container *ngIf="form.mode !== 'local'">
            <label [attr.for]="uid+'transport'">Transport</label>
            <nb-select [id]="uid+'transport'" name="transport" [(selected)]="form.transport" class="field">
              <nb-option value="broadcast">Same browser/device tabs</nb-option>
              <nb-option value="websocket">WebSocket relay</nb-option>
            </nb-select>
            <label [attr.for]="uid+'room'">Room code</label>
            <div class="row">
              <input [id]="uid+'room'" name="room" [(ngModel)]="form.room" [required]="form.mode==='join'" nbInput class="field" placeholder="e.g. ABC123" maxlength="12" />
              <button *ngIf="form.mode==='host'" nbButton type="button" status="basic" (click)="makeRoom()">New</button>
            </div>
            <ng-container *ngIf="form.transport==='websocket'">
              <label [attr.for]="uid+'relay'">Relay URL</label>
              <input [id]="uid+'relay'" name="relayUrl" [(ngModel)]="form.relayUrl" required nbInput class="field" placeholder="ws://192.168.1.5:8787" />
              <small class="hint">Run <code>node session-relay.js</code> from the app folder on the host/network.</small>
            </ng-container>
          </ng-container>
          <div class="actions">
            <button nbButton status="success" type="submit">{{ form.mode==='local' ? 'Start local game' : form.mode==='host' ? 'Host' : 'Join' }}</button>
            <button *ngIf="showCancel" nbButton status="basic" type="button" (click)="cancelled.emit()">Cancel</button>
          </div>
        </form>
        <p *ngIf="error" class="error" aria-live="polite">{{ error }}</p>
      </nb-card-body>
    </nb-card>
    <ng-template #connectedTpl>
      <nb-card status="success" class="session-bar">
        <nb-card-body>
          <div class="bar">
            <div><strong>Room {{ room }}</strong> · {{ role }} · {{ transportLabel }}</div>
            <div class="bar-actions">
              <button nbButton size="tiny" status="basic" (click)="copyRoom()">Copy code</button>
              <button nbButton size="tiny" status="warning" (click)="leave.emit()">Leave</button>
            </div>
          </div>
          <div class="peers" *ngIf="peers?.length">Peers: <span *ngFor="let p of peers; let last=last">{{ p.name }} ({{ p.role }}){{ last ? '' : ', ' }}</span></div>
          <div class="peers" *ngIf="!peers?.length">Waiting for other players to join…</div>
        </nb-card-body>
      </nb-card>
    </ng-template>
  `,
  styles: [`
    .copy{margin-top:0}.field{width:100%;margin:6px 0 12px;display:block}.row{display:flex;gap:.5rem;align-items:flex-start}.row .field{flex:1}
    .actions{display:flex;gap:.5rem;flex-wrap:wrap}.error{color:#ff8a80;margin:.5rem 0 0}.hint{display:block;opacity:.8;margin:-6px 0 12px}
    .session-bar{margin-bottom:1rem}.bar{display:flex;justify-content:space-between;gap:.75rem;align-items:center;flex-wrap:wrap}.bar-actions{display:flex;gap:.5rem}
    .peers{margin-top:.5rem;font-size:.9rem;opacity:.9}
  `]
})
export class SessionPanelComponent {
  @Input() title = '';
  @Input() connected = false;
  @Input() room: string | null = null;
  @Input() role: SessionRole | null = null;
  @Input() kind: SessionTransportKind | null = null;
  @Input() peers: SessionPeer[] = [];
  @Input() error: string | null = null;
  @Input() showCancel = false;
  @Output() started = new EventEmitter<SessionConfig | { mode: 'local'; name: string }>();
  @Output() leave = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
  uid = Math.random().toString(36).slice(2);
  form = { name: '', mode: 'host' as 'host' | 'join' | 'local', transport: 'broadcast' as SessionTransportKind, room: createRoomCode(), relayUrl: 'ws://localhost:8787' };

  get transportLabel(): string { return this.kind === 'websocket' ? 'relay' : 'local tabs'; }

  makeRoom(): void { this.form.room = createRoomCode(); }

  submit(value: any): void {
    const name = String(value.name || this.form.name || '').trim();
    if (!name) return;
    if (this.form.mode === 'local') { this.started.emit({ mode: 'local', name }); return; }
    const room = String(value.room || this.form.room || '').trim().toUpperCase();
    const config: SessionConfig = {
      room,
      name,
      role: this.form.mode === 'host' ? 'host' : 'guest',
      kind: this.form.transport,
      relayUrl: this.form.transport === 'websocket' ? String(value.relayUrl || this.form.relayUrl || '').trim() : undefined
    };
    this.started.emit(config);
  }

  async copyRoom(): Promise<void> {
    if (!this.room) return;
    try { await (navigator as any).clipboard.writeText(this.room); } catch {}
  }
}
