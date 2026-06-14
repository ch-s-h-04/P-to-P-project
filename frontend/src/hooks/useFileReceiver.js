import { useState } from 'react';

export default function useFileReceiver() {
  const [isReceiving, setIsReceiving] = useState(false);

  const initReceiver = () => {
    setIsReceiving(true);
    console.log('File receiver buffer initialization goes here');
  };

  return {
    isReceiving,
    initReceiver
  };
}
