/**
 * roomRegistry.js
 *
 * In-memory registry of active P2P file-share rooms.
 *
 * A "room" pairs at most two socket connections (sender + receiver) and
 * carries only file metadata — never file bytes. Rooms are ephemeral by
 * design: they are created on demand and removed either when both peers
 * have left or after ROOM_TTL_MS of inactivity (see cleanupExpiredRooms).
 */

/** Time (ms) a room may remain inactive before it is eligible for cleanup. */
export const ROOM_TTL_MS = 15 * 60 * 1000; // 15 minutes

/**
 * @typedef {Object} FileMeta
 * @property {string} name
 * @property {number} size
 * @property {string} type
 */

/**
 * @typedef {Object} Room
 * @property {string} roomId
 * @property {FileMeta} fileMeta
 * @property {string[]} members - Socket IDs currently in the room (max 2).
 * @property {number} createdAt - Epoch ms timestamp of room creation.
 * @property {number} lastActivityAt - Epoch ms timestamp of last mutation.
 * @property {'waiting' | 'paired'} status
 */

const MAX_MEMBERS_PER_ROOM = 2;

export class RoomRegistry {
  constructor() {
    /** @type {Map<string, Room>} */
    this.rooms = new Map();
  }

  /**
   * Create and register a new room.
   *
   * @param {string} roomId
   * @param {FileMeta} fileMeta
   * @returns {Room}
   */
  createRoom(roomId, fileMeta) {
    const now = Date.now();
    const room = {
      roomId,
      fileMeta,
      members: [],
      createdAt: now,
      lastActivityAt: now,
      status: 'waiting',
    };

    this.rooms.set(roomId, room);
    return room;
  }

  /**
   * @param {string} roomId
   * @returns {Room | undefined}
   */
  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  /**
   * @param {string} roomId
   * @returns {boolean} True if a room with this ID is currently registered.
   */
  roomExists(roomId) {
    return this.rooms.has(roomId);
  }

  /**
   * @param {string} roomId
   * @returns {boolean} True if the room existed and was removed.
   */
  removeRoom(roomId) {
    return this.rooms.delete(roomId);
  }

  /**
   * @param {string} roomId
   * @returns {boolean} True if the room exists and already has 2 members.
   */
  isRoomFull(roomId) {
    const room = this.getRoom(roomId);
    return !!room && room.members.length >= MAX_MEMBERS_PER_ROOM;
  }

  /**
   * Add a socket to a room.
   *
   * @param {string} roomId
   * @param {string} socketId
   * @returns {boolean} True if the socket is now a member of the room
   *   (either newly added or already present). False if the room does
   *   not exist or is already full.
   */
  addMember(roomId, socketId) {
    const room = this.getRoom(roomId);
    if (!room) return false;

    if (room.members.includes(socketId)) {
      return true; // Already a member — idempotent.
    }

    if (room.members.length >= MAX_MEMBERS_PER_ROOM) {
      return false;
    }

    room.members.push(socketId);
    room.lastActivityAt = Date.now();
    room.status = room.members.length === MAX_MEMBERS_PER_ROOM ? 'paired' : 'waiting';

    return true;
  }

  /**
   * Remove a socket from a room.
   *
   * @param {string} roomId
   * @param {string} socketId
   * @returns {boolean} True if the socket was a member and was removed.
   */
  removeMember(roomId, socketId) {
    const room = this.getRoom(roomId);
    if (!room) return false;

    const index = room.members.indexOf(socketId);
    if (index === -1) return false;

    room.members.splice(index, 1);
    room.lastActivityAt = Date.now();
    room.status = room.members.length === MAX_MEMBERS_PER_ROOM ? 'paired' : 'waiting';

    return true;
  }

  /**
   * Remove all rooms that have had no activity for longer than `ttlMs`.
   *
   * Intended to be called periodically (see startRoomCleanupTask in
   * roomHandlers.js) to prevent abandoned rooms from accumulating in
   * memory indefinitely.
   *
   * @param {number} [ttlMs=ROOM_TTL_MS]
   * @returns {string[]} IDs of rooms that were removed.
   */
  cleanupExpiredRooms(ttlMs = ROOM_TTL_MS) {
    const now = Date.now();
    const expiredRoomIds = [];

    for (const [roomId, room] of this.rooms) {
      if (now - room.lastActivityAt > ttlMs) {
        expiredRoomIds.push(roomId);
      }
    }

    for (const roomId of expiredRoomIds) {
      this.rooms.delete(roomId);
    }

    return expiredRoomIds;
  }
}
