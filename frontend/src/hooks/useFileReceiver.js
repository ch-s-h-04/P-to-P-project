import { useState, useCallback } from 'react';
import { useTransferStore } from '../store/transferStore';
import { useRoomStore } from '../store/roomStore';

let receivedChunks = [];
let bytesReceived = 0;

export default function useFileReceiver() {
  const [isReceiving, setIsReceiving] = useState(false);

  const initReceiver = useCallback(() => {
    receivedChunks = [];
    bytesReceived = 0;
    setIsReceiving(true);

    const { setStatus, setBytesTransferred, setProgressPercent } = useTransferStore.getState();
    setStatus('transferring');
    setBytesTransferred(0);
    setProgressPercent(0);
  }, []);

  const cleanupReceiver = useCallback(() => {
    receivedChunks = [];
    bytesReceived = 0;
    setIsReceiving(false);
  }, []);

  const handleIncomingMessage = useCallback(async (event) => {
    const { fileMeta } = useRoomStore.getState();
    const { setStatus, setBytesTransferred, setProgressPercent, setRemoteHash, setVerified } = useTransferStore.getState();

    if (typeof event.data === 'string') {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'EOF') {
          console.log('[Receiver] EOF received');

          if (receivedChunks.length === 0) {
            console.warn('[Receiver] No chunks received before EOF');
            setStatus('failed');
            setIsReceiving(false);
            return;
          }

          console.log('[Receiver] Blob created');
          const blob = new Blob(receivedChunks, { type: fileMeta?.type || 'application/octet-stream' });

          setStatus('verifying');

          let computedHash = '';
          try {
            const arrayBuffer = await blob.arrayBuffer();
            const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            computedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            setRemoteHash(computedHash);
          } catch (err) {
            console.error('Error verifying remote file hash:', err);
          }

          const isVerified = fileMeta?.hash ? computedHash === fileMeta.hash : null;
          setVerified(isVerified);
          console.log(`[Receiver] Hash verification: ${isVerified ? 'SUCCESS' : 'FAILED'}`);

          console.log('[Receiver] Download triggered');
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileMeta?.name || 'downloaded_file';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          setStatus('completed');
          setIsReceiving(false);

          receivedChunks = [];
          bytesReceived = 0;
        }
      } catch (err) {
        console.error('[Receiver] Error processing JSON message:', err);
      }
    } else {
      console.log('[Receiver] Chunk received');

      if (receivedChunks.length === 0) {
        setIsReceiving(true);
        setStatus('transferring');
      }

      receivedChunks.push(event.data);
      bytesReceived += event.data.byteLength;

      setBytesTransferred(bytesReceived);
      if (fileMeta?.size) {
        const percent = Math.min(100, Math.round((bytesReceived / fileMeta.size) * 100));
        setProgressPercent(percent);
      }
    }
  }, []);

  return {
    isReceiving,
    initReceiver,
    cleanupReceiver,
    handleIncomingMessage
  };
}
