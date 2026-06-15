import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { signalingClient } from '../services/signalingClient';
import { useRoomStore } from '../store/roomStore';
import usePeerConnection, { closeActivePeerConnection } from './usePeerConnection';
import { useTransferStore } from '../store/transferStore';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3000';

export function useSocketLifecycle() {
  const navigate = useNavigate();
  const { setRoomId, setRole, setPeerPresent, setFileMeta, resetRoom } = useRoomStore();
  const { initiateOffer, handleOffer, handleAnswer, handleIceCandidate, closePeerConnection } = usePeerConnection();

  // ── Listener handlers ────────────────────────────────────────────────────────

  const onRoomCreated = useCallback(({ roomId }) => {
    console.log('[socket] room-created:', roomId);
    setRoomId(roomId);
    setRole('sender');
    navigate(`/room/${roomId}`);
  }, [setRoomId, setRole, navigate]);

  const onRoomJoined = useCallback(({ roomId, fileMeta }) => {
    console.log('[socket] room-joined:', roomId, fileMeta);
    setRoomId(roomId);
    setRole('receiver');
    setFileMeta(fileMeta);
    navigate(`/room/${roomId}`);
  }, [setRoomId, setRole, setFileMeta, navigate]);

  const onPeerJoined = useCallback(({ peerSocketId }) => {
    console.log('[socket] peer-joined:', peerSocketId);
    setPeerPresent(true);
    // If peer joins, we (the sender) initiate the WebRTC handshake
    initiateOffer();
  }, [setPeerPresent, initiateOffer]);

  const onPeerLeft = useCallback(() => {
    console.log('[socket] peer-left');
    setPeerPresent(false);
    closePeerConnection();
  }, [setPeerPresent, closePeerConnection]);

  const onOfferReceived = useCallback((payload) => {
    console.log('[socket] offer-received:', payload);
    handleOffer(payload.sdp);
  }, [handleOffer]);

  const onAnswerReceived = useCallback((payload) => {
    console.log('[socket] answer-received:', payload);
    handleAnswer(payload.sdp);
  }, [handleAnswer]);

  const onIceCandidateReceived = useCallback((payload) => {
    console.log('[socket] ice-candidate-received:', payload);
    handleIceCandidate(payload.candidate);
  }, [handleIceCandidate]);

  // ── Lifecycle ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    signalingClient.connect(BACKEND_URL);

    signalingClient.on('room-created', onRoomCreated);
    signalingClient.on('room-joined',  onRoomJoined);
    signalingClient.on('peer-joined',  onPeerJoined);
    signalingClient.on('peer-left',    onPeerLeft);
    signalingClient.on('offer-received', onOfferReceived);
    signalingClient.on('answer-received', onAnswerReceived);
    signalingClient.on('ice-candidate-received', onIceCandidateReceived);

    return () => {
      signalingClient.off('room-created', onRoomCreated);
      signalingClient.off('room-joined',  onRoomJoined);
      signalingClient.off('peer-joined',  onPeerJoined);
      signalingClient.off('peer-left',    onPeerLeft);
      signalingClient.off('offer-received', onOfferReceived);
      signalingClient.off('answer-received', onAnswerReceived);
      signalingClient.off('ice-candidate-received', onIceCandidateReceived);
      closePeerConnection();
      signalingClient.disconnect();
      resetRoom();
    };
  }, [
    onRoomCreated,
    onRoomJoined,
    onPeerJoined,
    onPeerLeft,
    onOfferReceived,
    onAnswerReceived,
    onIceCandidateReceived,
    closePeerConnection,
    resetRoom
  ]);
}

export default function useSocket() {
  const navigate = useNavigate();
  const { setFileMeta, resetRoom } = useRoomStore();

  // ── Public API ────────────────────────────────────────────────────────────────

  const createRoom = useCallback((fileMeta) => {
    setFileMeta(fileMeta);
    signalingClient.emit('create-room', { fileMeta });
  }, [setFileMeta]);

  const joinRoom = useCallback((roomId) => {
    console.log('joinRoom called with:', roomId);
    console.log('socket connected:', signalingClient.isConnected());
    signalingClient.emit('join-room', { roomId });
  }, []);
  
  const leaveRoom = useCallback((roomId) => {
    console.log('Explicit leaveRoom called for:', roomId);
    signalingClient.emit('leave-room', { roomId });
    closeActivePeerConnection();
    useTransferStore.getState().resetTransfer();
    resetRoom();
    navigate('/');
  }, [resetRoom, navigate]);

  return {
    createRoom,
    joinRoom,
    leaveRoom,
    emit:        signalingClient.emit.bind(signalingClient),
    on:          signalingClient.on.bind(signalingClient),
    off:         signalingClient.off.bind(signalingClient),
    isConnected: signalingClient.isConnected.bind(signalingClient),
  };
}