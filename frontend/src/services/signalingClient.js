export const signalingClient = {
  connect: (url) => {
    console.log('Connect to signaling server at:', url);
  },
  disconnect: () => {
    console.log('Disconnect from signaling server');
  },
  emit: (event, payload) => {
    console.log('Relaying signaling event:', event, payload);
  },
  on: (event, callback) => {
    console.log('Listening to signaling event:', event);
  }
};
