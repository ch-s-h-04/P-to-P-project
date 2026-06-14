export function registerRoomHandlers(io, socket) {
  socket.on('create-room', (payload) => {
    console.log('Room creation requested:', payload);
  });

  socket.on('join-room', (payload) => {
    console.log('Join room requested:', payload);
  });

  socket.on('leave-room', (payload) => {
    console.log('Leave room requested:', payload);
  });
}
