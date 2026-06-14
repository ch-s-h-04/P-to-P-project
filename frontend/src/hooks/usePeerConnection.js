import { useRef } from 'react';

export default function usePeerConnection() {
  const peerConnectionRef = useRef(null);

  const createPeerConnection = () => {
    console.log('PeerConnection initialization will go here');
  };

  const closePeerConnection = () => {
    console.log('Close PeerConnection will go here');
  };

  return {
    peerConnection: peerConnectionRef.current,
    createPeerConnection,
    closePeerConnection
  };
}
