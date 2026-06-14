import { useRef } from 'react';

export default function useDataChannel() {
  const dataChannelRef = useRef(null);

  const initDataChannel = () => {
    console.log('DataChannel initialization will go here');
  };

  const sendData = (data) => {
    console.log('Mock sending data over DataChannel');
  };

  return {
    dataChannel: dataChannelRef.current,
    initDataChannel,
    sendData
  };
}
