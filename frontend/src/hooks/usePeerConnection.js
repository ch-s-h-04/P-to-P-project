import { useRef, useCallback, useEffect } from 'react';
import { getWebRTCConfig } from '../services/webrtcConfig';
import { useConnectionStore } from '../store/connectionStore';
import { useRoomStore } from '../store/roomStore';
import { useTransferStore } from '../store/transferStore';
import { signalingClient } from '../services/signalingClient';
import useFileSender from './useFileSender';
import useFileReceiver from './useFileReceiver';

let closeInstance = null;

export function closeActivePeerConnection() {
  if (closeInstance) {
    console.log('[WebRTC] Global closeActivePeerConnection invoked');
    closeInstance();
  } else {
    console.warn('[WebRTC] closeActivePeerConnection called, but no instance registered');
  }
}

export default function usePeerConnection() {
  const peerConnectionRef = useRef(null);
  const dataChannelRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const isRemoteDescriptionSetRef = useRef(false);

  const { setPeerConnectionState, setIceConnectionState, setDataChannelState } = useConnectionStore();
  const { startSending } = useFileSender();
  const { handleIncomingMessage, cleanupReceiver } = useFileReceiver();

  useEffect(() => {
    const match = window.location.pathname.match(/\/room\/([^/]+)/);
    if (match) {
      const urlRoomId = match[1];
      const { roomId } = useRoomStore.getState();
      
      // If the URL room ID is different from the stored room ID, reset the room session
      if (roomId && roomId !== urlRoomId) {
        console.log('[usePeerConnection] URL room ID mismatch, resetting room session');
        useRoomStore.getState().resetRoom();
      }

      // Re-read role after possible reset
      const currentRole = useRoomStore.getState().role;
      if (!currentRole) {
        const interval = setInterval(() => {
          if (signalingClient.isConnected()) {
            clearInterval(interval);
            console.log('[usePeerConnection] Auto-joining room as receiver:', urlRoomId);
            useRoomStore.setState({ role: 'receiver', roomId: urlRoomId });
            signalingClient.emit('join-room', { roomId: urlRoomId });
          }
        }, 100);
        return () => clearInterval(interval);
      }
    }
  }, []);

  const bindDataChannelEvents = useCallback((dc) => {
    dataChannelRef.current = dc;
    dc.binaryType = 'arraybuffer';

    dc.onopen = () => {
      console.log('[DataChannel] Open');
      setDataChannelState('open');
      const { role, file } = useRoomStore.getState();
      if (role === 'sender' && file) {
        startSending(file, dc);
      }
    };

    dc.onclose = () => {
      console.log('[DataChannel] Closed');
      setDataChannelState('closed');
      dataChannelRef.current = null;
      cleanupReceiver();
    };

    dc.onerror = (err) => {
      console.error('[DataChannel] Error:', err);
    };

    dc.onmessage = (event) => {
      handleIncomingMessage(event);
    };
  }, [setDataChannelState, startSending, handleIncomingMessage, cleanupReceiver]);

  const closePeerConnection = useCallback(() => {
    if (dataChannelRef.current) {
      console.log('[DataChannel] Closing channel');
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }
    if (peerConnectionRef.current) {
      console.log('[WebRTC] Closing PeerConnection');
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    pendingCandidatesRef.current = [];
    isRemoteDescriptionSetRef.current = false;
    setPeerConnectionState('new');
    setIceConnectionState('new');
    setDataChannelState('closed');
    cleanupReceiver();
    useTransferStore.getState().resetTransfer();
  }, [setPeerConnectionState, setIceConnectionState, setDataChannelState, cleanupReceiver]);

  useEffect(() => {
    closeInstance = closePeerConnection;
    return () => {
      if (closeInstance === closePeerConnection) {
        closeInstance = null;
      }
    };
  }, [closePeerConnection]);

  const createPeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      console.warn('[WebRTC] PeerConnection already exists, closing it first');
      closePeerConnection();
    }

    const config = getWebRTCConfig();
    console.log('[WebRTC] Creating RTCPeerConnection with config:', config);
    const pc = new RTCPeerConnection(config);
    peerConnectionRef.current = pc;

    // Sender creates the DataChannel, Receiver binds the listener
    const { role } = useRoomStore.getState();
    if (role === 'sender') {
      console.log('[DataChannel] Creating channel "fileTransfer"');
      const dc = pc.createDataChannel('fileTransfer', { ordered: true });
      console.log('[DataChannel] Created');
      setDataChannelState('connecting');
      bindDataChannelEvents(dc);
    } else {
      pc.ondatachannel = (event) => {
        console.log('[DataChannel] Received');
        setDataChannelState('connecting');
        bindDataChannelEvents(event.channel);
      };
    }

    pc.onicecandidate = (event) => {
      const { roomId } = useRoomStore.getState();
      if (!roomId) {
        console.warn('[WebRTC] Cannot emit ICE candidate — no active room ID');
        return;
      }

      if (event.candidate) {
        console.log('[WebRTC] Generated ICE candidate:', event.candidate);
        signalingClient.emit('signal:ice-candidate', {
          roomId,
          candidate: event.candidate,
        });
      } else {
        console.log('[WebRTC] End of ICE candidates');
        signalingClient.emit('signal:ice-candidate', {
          roomId,
          candidate: null,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] Connection state changed:', pc.connectionState);
      setPeerConnectionState(pc.connectionState);
    };

    pc.oniceconnectionstatechange = () => {
      console.log('[WebRTC] ICE Connection state changed:', pc.iceConnectionState);
      setIceConnectionState(pc.iceConnectionState);
    };

    return pc;
  }, [closePeerConnection, setPeerConnectionState, setIceConnectionState, setDataChannelState, bindDataChannelEvents]);

  const handleOffer = useCallback(async (sdp) => {
    console.log('[WebRTC] Received remote offer SDP');
    let pc = peerConnectionRef.current;
    if (!pc) {
      pc = createPeerConnection();
    }

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      isRemoteDescriptionSetRef.current = true;
      console.log('[WebRTC] Set remote description successfully');

      // Flush queued candidates
      if (pendingCandidatesRef.current.length > 0) {
        console.log(`[WebRTC] Flushing ${pendingCandidatesRef.current.length} queued ICE candidates`);
        for (const candidate of pendingCandidatesRef.current) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
        pendingCandidatesRef.current = [];
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      console.log('[WebRTC] Created and set local answer description');
      
      const { roomId } = useRoomStore.getState();
      signalingClient.emit('signal:answer', {
        roomId,
        sdp: answer,
      });
    } catch (err) {
      console.error('[WebRTC] Error during offer processing:', err);
    }
  }, [createPeerConnection]);

  const handleAnswer = useCallback(async (sdp) => {
    console.log('[WebRTC] Received remote answer SDP');
    const pc = peerConnectionRef.current;
    if (!pc) {
      console.error('[WebRTC] PeerConnection does not exist when answer received');
      return;
    }

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      isRemoteDescriptionSetRef.current = true;
      console.log('[WebRTC] Set remote description successfully');

      // Flush queued candidates
      if (pendingCandidatesRef.current.length > 0) {
        console.log(`[WebRTC] Flushing ${pendingCandidatesRef.current.length} queued ICE candidates`);
        for (const candidate of pendingCandidatesRef.current) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
        pendingCandidatesRef.current = [];
      }
    } catch (err) {
      console.error('[WebRTC] Error during answer processing:', err);
    }
  }, []);

  const handleIceCandidate = useCallback(async (candidate) => {
    const pc = peerConnectionRef.current;
    if (!candidate) {
      console.log('[WebRTC] Received remote end-of-candidate signal');
      return;
    }

    if (pc && isRemoteDescriptionSetRef.current) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
        console.log('[WebRTC] Successfully added remote ICE candidate');
      } catch (err) {
        console.error('[WebRTC] Error adding remote ICE candidate:', err);
      }
    } else {
      console.log('[WebRTC] Remote description not set. Queueing remote ICE candidate');
      pendingCandidatesRef.current.push(candidate);
    }
  }, []);

  const initiateOffer = useCallback(async () => {
    let pc = peerConnectionRef.current;
    if (!pc) {
      pc = createPeerConnection();
    }

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      console.log('[WebRTC] Created and set local offer description');

      const { roomId } = useRoomStore.getState();
      signalingClient.emit('signal:offer', {
        roomId,
        sdp: offer,
      });
    } catch (err) {
      console.error('[WebRTC] Error creating offer:', err);
    }
  }, [createPeerConnection]);

  return {
    peerConnection: peerConnectionRef.current,
    dataChannel: dataChannelRef.current,
    createPeerConnection,
    closePeerConnection,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    initiateOffer
  };
}
