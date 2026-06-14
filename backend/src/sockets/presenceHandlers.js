export function registerPresenceHandlers(io, socket) {
  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', socket.id, 'Reason:', reason);
  });
}
