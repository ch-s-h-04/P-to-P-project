export class RoomRegistry {
  constructor() {
    this.rooms = new Map();
  }

  createRoom(roomId, fileMeta) {
    const room = {
      roomId,
      fileMeta,
      members: [],
      createdAt: Date.now(),
      status: 'waiting'
    };
    this.rooms.set(roomId, room);
    return room;
  }

  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  removeRoom(roomId) {
    return this.rooms.delete(roomId);
  }

  addMember(roomId, socketId) {
    const room = this.getRoom(roomId);
    if (room && room.members.length < 2) {
      room.members.push(socketId);
      if (room.members.length === 2) {
        room.status = 'paired';
      }
      return true;
    }
    return false;
  }
}

export const roomRegistry = new RoomRegistry();
