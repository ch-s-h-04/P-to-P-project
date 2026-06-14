import { useState } from 'react';

export default function useFileSender() {
  const [isSending, setIsSending] = useState(false);

  const startSending = (file) => {
    setIsSending(true);
    console.log('File sending loop starts here for:', file.name);
  };

  return {
    isSending,
    startSending
  };
}
