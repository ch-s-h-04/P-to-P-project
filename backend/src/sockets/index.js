import { registerRoomHandlers } from './roomHandlers.js';
import { registerSignalingHandlers } from './signalingHandlers.js';
import { registerPresenceHandlers } from './presenceHandlers.js';
import { roomRegistry } from '../services/roomRegistry.js';
// export function initializeSockets(io) {
//   io.on('connection', (socket) => {
//     console.log('Socket connected:', socket.id);

//     // Register all socket event handlers
//     registerRoomHandlers(io, socket);
//     registerSignalingHandlers(io, socket);
//     registerPresenceHandlers(io, socket);
//   });
// }
export function initializeSockets(io) {
  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    registerRoomHandlers(io, socket, roomRegistry);
    registerSignalingHandlers(io, socket, roomRegistry);
    registerPresenceHandlers(io, socket);
  });
}