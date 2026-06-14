export function registerSignalingHandlers(io, socket) {
  socket.on('signal:offer', (payload) => {
    console.log('Offer received:', payload);
  });

  socket.on('signal:answer', (payload) => {
    console.log('Answer received:', payload);
  });

  socket.on('signal:ice-candidate', (payload) => {
    console.log('ICE candidate received:', payload);
  });

  socket.on('signal:transfer-ack', (payload) => {
    console.log('Transfer ACK received:', payload);
  });
}
