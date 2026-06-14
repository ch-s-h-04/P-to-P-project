/**
 * roomHandlers.js
 *
 * Socket.io event handlers for room lifecycle management:
 *   - create-room  -> room-created
 *   - join-room    -> room-joined | room-not-found | room-full | peer-joined
 *   - leave-room   -> peer-left
 *
 * Also handles the built-in `disconnect` event so that a peer closing
 * their tab/browser is treated the same as an explicit `leave-room`,
 * and exposes startRoomCleanupTask() for periodic TTL-based cleanup
 * of abandoned rooms.
 *
 * The signaling layer never inspects file content — only `fileMeta`
 * (name, size, type) is stored and relayed.
 */

import { nanoid } from 'nanoid';

/** Matches the default nanoid alphabet (A-Za-z0-9_-) at default length 21. */
const ROOM_ID_PATTERN = /^[A-Za-z0-9_-]{21}$/;

/** Number of times to retry room ID generation on (extremely rare) collision. */
const MAX_ROOM_ID_ATTEMPTS = 5;

/**
 * Attach room-related event listeners to a connected socket.
 *
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 * @param {import('./roomRegistry.js').RoomRegistry} roomRegistry
 */
export function registerRoomHandlers(io, socket, roomRegistry) {
  socket.on('create-room', (payload) => {
    handleCreateRoom(socket, roomRegistry, payload);
  });

  socket.on('join-room', (payload) => {
    handleJoinRoom(socket, roomRegistry, payload);
  });

  socket.on('leave-room', (payload) => {
    handleLeaveRoom(socket, roomRegistry, payload);
  });

  socket.on('disconnect', () => {
    handleDisconnect(socket, roomRegistry);
  });
}

/**
 * Periodically sweep the registry for inactive rooms and notify any
 * sockets still joined to them before evicting those sockets from the
 * Socket.io room.
 *
 * @param {import('socket.io').Server} io
 * @param {import('./roomRegistry.js').RoomRegistry} roomRegistry
 * @param {number} [intervalMs=60000]
 * @returns {() => void} Stop function — clears the interval timer.
 */
export function startRoomCleanupTask(io, roomRegistry, intervalMs = 60 * 1000) {
  const timer = setInterval(() => {
    const expiredRoomIds = roomRegistry.cleanupExpiredRooms();

    for (const roomId of expiredRoomIds) {
      io.to(roomId).emit('peer-left', { reason: 'expired' });
      io.socketsLeave(roomId);
    }
  }, intervalMs);

  return () => clearInterval(timer);
}

// ---------------------------------------------------------------------
// Handler implementations
// ---------------------------------------------------------------------

/**
 * @param {import('socket.io').Socket} socket
 * @param {import('./roomRegistry.js').RoomRegistry} roomRegistry
 * @param {{ fileMeta?: unknown }} payload
 */
function handleCreateRoom(socket, roomRegistry, payload) {
  const fileMeta = payload?.fileMeta;

  if (!isValidFileMeta(fileMeta)) {
    socket.emit('error', {
      code: 'INVALID_FILE_META',
      message: 'fileMeta must include a non-empty "name" (string), '
        + 'a positive "size" (number), and a "type" (string).',
    });
    return;
  }

  const roomId = generateUniqueRoomId(roomRegistry);
  if (!roomId) {
    socket.emit('error', {
      code: 'ROOM_CREATION_FAILED',
      message: 'Could not allocate a unique room ID. Please try again.',
    });
    return;
  }

  roomRegistry.createRoom(roomId, fileMeta);
  roomRegistry.addMember(roomId, socket.id);

  socket.join(roomId);
  socket.data.roomId = roomId;

  socket.emit('room-created', { roomId });
}

/**
 * @param {import('socket.io').Socket} socket
 * @param {import('./roomRegistry.js').RoomRegistry} roomRegistry
 * @param {{ roomId?: unknown }} payload
 */
function handleJoinRoom(socket, roomRegistry, payload) {
  const roomId = payload?.roomId;

  if (!isValidRoomId(roomId)) {
    socket.emit('error', {
      code: 'INVALID_ROOM_ID',
      message: 'roomId must be a valid room code.',
    });
    return;
  }

  if (!roomRegistry.roomExists(roomId)) {
    socket.emit('room-not-found', { roomId });
    return;
  }

  if (roomRegistry.isRoomFull(roomId)) {
    socket.emit('room-full', { roomId });
    return;
  }

  const room = roomRegistry.getRoom(roomId);
  roomRegistry.addMember(roomId, socket.id);

  socket.join(roomId);
  socket.data.roomId = roomId;

  socket.emit('room-joined', { roomId, fileMeta: room.fileMeta });
  socket.to(roomId).emit('peer-joined', { peerSocketId: socket.id });
}

/**
 * @param {import('socket.io').Socket} socket
 * @param {import('./roomRegistry.js').RoomRegistry} roomRegistry
 * @param {{ roomId?: unknown }} payload
 */
function handleLeaveRoom(socket, roomRegistry, payload) {
  const roomId = payload?.roomId ?? socket.data.roomId;

  if (!roomId || !roomRegistry.roomExists(roomId)) {
    return;
  }

  leaveRoom(socket, roomRegistry, roomId, 'left');
}

/**
 * @param {import('socket.io').Socket} socket
 * @param {import('./roomRegistry.js').RoomRegistry} roomRegistry
 */
function handleDisconnect(socket, roomRegistry) {
  const roomId = socket.data.roomId;

  if (!roomId || !roomRegistry.roomExists(roomId)) {
    return;
  }

  leaveRoom(socket, roomRegistry, roomId, 'disconnect');
}

// ---------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------

/**
 * Remove `socket` from `roomId`, notify the remaining peer, and clean up
 * the room itself if it is now empty.
 *
 * @param {import('socket.io').Socket} socket
 * @param {import('./roomRegistry.js').RoomRegistry} roomRegistry
 * @param {string} roomId
 * @param {'left' | 'disconnect'} reason
 */
function leaveRoom(socket, roomRegistry, roomId, reason) {
  const wasRemoved = roomRegistry.removeMember(roomId, socket.id);

  if (wasRemoved) {
    socket.to(roomId).emit('peer-left', { reason });
  }

  socket.leave(roomId);
  delete socket.data.roomId;

  const room = roomRegistry.getRoom(roomId);
  if (room && room.members.length === 0) {
    roomRegistry.removeRoom(roomId);
  }
}

/**
 * Generate a room ID guaranteed not to collide with an existing room.
 * Collisions are vanishingly unlikely with nanoid's default settings
 * (21 chars, ~126 bits of entropy) — the retry loop exists purely as a
 * defensive safeguard.
 *
 * @param {import('./roomRegistry.js').RoomRegistry} roomRegistry
 * @returns {string | null}
 */
function generateUniqueRoomId(roomRegistry) {
  for (let attempt = 0; attempt < MAX_ROOM_ID_ATTEMPTS; attempt += 1) {
    const candidate = nanoid();
    if (!roomRegistry.roomExists(candidate)) {
      return candidate;
    }
  }
  return null;
}

/**
 * @param {unknown} fileMeta
 * @returns {fileMeta is { name: string, size: number, type: string }}
 */
function isValidFileMeta(fileMeta) {
  return (
    typeof fileMeta === 'object'
    && fileMeta !== null
    && typeof fileMeta.name === 'string'
    && fileMeta.name.trim().length > 0
    && typeof fileMeta.size === 'number'
    && Number.isFinite(fileMeta.size)
    && fileMeta.size > 0
    && typeof fileMeta.type === 'string'
  );
}

/**
 * @param {unknown} roomId
 * @returns {roomId is string}
 */
function isValidRoomId(roomId) {
  return typeof roomId === 'string' && ROOM_ID_PATTERN.test(roomId);
}
