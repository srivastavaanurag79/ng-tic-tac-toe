/**
 * Minimal WebSocket relay for Kattam Kutta session-based games.
 * Not E2E-encrypted game logic (this app's session payloads are plain game state);
 * it only forwards JSON messages within a room. Run on a trusted LAN/host.
 *
 * Usage: node session-relay.js [port]   (default 8787)
 * Clients send:
 *   { t: 'join', room: 'ABC123', name: 'Alice', role: 'host'|'guest', id: 'client-id' }
 *   { t: 'relay', room: 'ABC123', message: <SessionEnvelope> }
 * Server sends:
 *   { t: 'joined', room, id }
 *   { t: 'relay', message }
 *   { t: 'peer', id, name, role, event: 'join'|'leave' }
 *   { t: 'error', message }
 */
const http = require('http');
const crypto = require('crypto');

const port = Number(process.argv[2] || process.env.PORT || 8787);
const rooms = new Map(); // room -> Map(clientId, {ws,name,role})

function send(ws, data) {
  if (ws && ws.readyState === 1) ws.send(JSON.stringify(data));
}

function acceptKey(key) {
  return crypto.createHash('sha1')
    .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11', 'binary')
    .digest('base64');
}

function decodeFrame(buffer) {
  if (buffer.length < 2) return null;
  const b1 = buffer[0], b2 = buffer[1];
  const op = b1 & 0x0f;
  let len = b2 & 0x7f;
  let off = 2;
  if (len === 126) { if (buffer.length < 4) return null; len = buffer.readUInt16BE(2); off = 4; }
  else if (len === 127) { if (buffer.length < 10) return null; const big = Number(buffer.readBigUInt64BE(2)); if (!Number.isSafeInteger(big)) return null; len = big; off = 10; }
  const masked = (b2 & 0x80) !== 0;
  if (masked) {
    if (buffer.length < off + 4 + len) return null;
    const mask = buffer.slice(off, off + 4); off += 4;
    const payload = Buffer.alloc(len);
    for (let i = 0; i < len; i++) payload[i] = buffer[off + i] ^ mask[i % 4];
    return { op, payload, total: off + len };
  }
  if (buffer.length < off + len) return null;
  return { op, payload: buffer.slice(off, off + len), total: off + len };
}

function encodeText(text) {
  const payload = Buffer.from(text);
  const head = payload.length < 126 ? Buffer.from([0x81, payload.length])
    : payload.length < 65536 ? (() => { const h = Buffer.alloc(4); h[0]=0x81; h[1]=126; h.writeUInt16BE(payload.length,2); return h; })()
    : (() => { const h = Buffer.alloc(10); h[0]=0x81; h[1]=127; h.writeBigUInt64BE(BigInt(payload.length),2); return h; })();
  return Buffer.concat([head, payload]);
}

const server = http.createServer((req, res) => {
  if (req.url === '/healthz') { res.writeHead(200, {'content-type':'application/json'}); res.end(JSON.stringify({ok:true, rooms: rooms.size})); return; }
  res.writeHead(426, {'content-type':'text/plain'}); res.end('Kattam Kutta session relay. Connect via WebSocket.');
});

server.on('upgrade', (req, socket) => {
  const key = req.headers['sec-websocket-key'];
  if (!key) { socket.destroy(); return; }
  socket.write([
    'HTTP/1.1 101 Switching Protocols',
    'Upgrade: websocket',
    'Connection: Upgrade',
    'Sec-WebSocket-Accept: ' + acceptKey(key),
    '\r\n'
  ].join('\r\n'));
  const client = { ws: { readyState: 1, send: (t) => socket.write(encodeText(t)) }, room: null, id: null, name: null, role: null, buf: Buffer.alloc(0) };
  socket.on('data', (chunk) => {
    client.buf = Buffer.concat([client.buf, chunk]);
    while (true) {
      const frame = decodeFrame(client.buf);
      if (!frame) break;
      client.buf = client.buf.slice(frame.total);
      if (frame.op === 0x8) { socket.end(); return; }
      if (frame.op === 0x9) { socket.write(Buffer.concat([Buffer.from([0x8a, frame.payload.length]), frame.payload])); continue; }
      if (frame.op !== 0x1) continue;
      let msg; try { msg = JSON.parse(frame.payload.toString('utf8')); } catch { continue; }
      handle(client, msg);
    }
  });
  const cleanup = () => {
    client.ws.readyState = 3;
    if (client.room && client.id) {
      const room = rooms.get(client.room);
      if (room) {
        room.delete(client.id);
        for (const peer of room.values()) send(peer.ws, { t: 'peer', id: client.id, name: client.name, role: client.role, event: 'leave' });
        if (!room.size) rooms.delete(client.room);
      }
    }
  };
  socket.on('close', cleanup);
  socket.on('end', cleanup);
  socket.on('error', cleanup);
});

function handle(client, msg) {
  if (msg.t === 'join') {
    const room = String(msg.room || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
    if (!room) return send(client.ws, { t: 'error', message: 'Missing room code.' });
    client.room = room; client.id = String(msg.id || Math.random().toString(36).slice(2)); client.name = String(msg.name || 'Player'); client.role = msg.role === 'host' ? 'host' : 'guest';
    if (!rooms.has(room)) rooms.set(room, new Map());
    const peers = rooms.get(room);
    for (const peer of peers.values()) { send(client.ws, { t: 'peer', id: peer.id, name: peer.name, role: peer.role, event: 'join' }); send(peer.ws, { t: 'peer', id: client.id, name: client.name, role: client.role, event: 'join' }); }
    peers.set(client.id, client);
    send(client.ws, { t: 'joined', room, id: client.id });
    return;
  }
  if (msg.t === 'relay' && client.room) {
    const peers = rooms.get(client.room);
    if (!peers) return;
    for (const peer of peers.values()) if (peer.id !== client.id) send(peer.ws, { t: 'relay', message: msg.message });
  }
}

server.listen(port, '0.0.0.0', () => console.log('Session relay listening on ws://0.0.0.0:' + port));
