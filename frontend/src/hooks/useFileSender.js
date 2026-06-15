import { useState, useCallback } from 'react';
import { useTransferStore } from '../store/transferStore';

export default function useFileSender() {
  const [isSending, setIsSending] = useState(false);

  const startSending = useCallback(async (file, dc) => {
    if (!file || !dc || dc.readyState !== 'open') {
      console.error('[Sender] Cannot start transfer: file or data channel is not ready');
      return;
    }

    setIsSending(true);
    console.log('[Sender] Starting transfer');

    const { setStatus, setBytesTransferred, setTotalBytes, setProgressPercent } = useTransferStore.getState();
    setStatus('transferring');
    setTotalBytes(file.size);
    setBytesTransferred(0);
    setProgressPercent(0);

    const CHUNK_SIZE = 16384;
    let offset = 0;

    dc.bufferedAmountLowThreshold = 65536;

    const waitForBuffer = () => {
      return new Promise((resolve) => {
        dc.onbufferedamountlow = () => {
          dc.onbufferedamountlow = null;
          resolve();
        };
      });
    };

    try {
      while (offset < file.size) {
        if (dc.readyState !== 'open') {
          console.warn('[Sender] Data channel closed during transfer');
          setStatus('failed');
          setIsSending(false);
          return;
        }

        if (dc.bufferedAmount > 262144) {
          await waitForBuffer();
        }

        const chunkSlice = file.slice(offset, offset + CHUNK_SIZE);
        const arrayBuffer = await chunkSlice.arrayBuffer();

        console.log('[Sender] Sending chunk');
        dc.send(arrayBuffer);

        offset += arrayBuffer.byteLength;

        setBytesTransferred(offset);
        const percent = Math.min(100, Math.round((offset / file.size) * 100));
        setProgressPercent(percent);
      }

      if (dc.readyState === 'open') {
        console.log('[Sender] EOF sent');
        dc.send(JSON.stringify({ type: 'EOF' }));
        setStatus('completed');
      } else {
        setStatus('failed');
      }
    } catch (err) {
      console.error('[Sender] Error during file transfer:', err);
      setStatus('failed');
    } finally {
      setIsSending(false);
    }
  }, []);

  return {
    isSending,
    startSending
  };
}
