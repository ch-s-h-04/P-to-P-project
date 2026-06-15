/**
 * signalingHandlers.js
 *
 * Pure WebRTC signaling relay.
 *
 * The server's only job here is to forward SDP offers/answers and ICE
 * candidates between the two peers in a room. It performs structural
 * validation (correct shape, sender is actually in the room) but never
 * parses, inspects, or rewrites SDP/ICE content — that data is opaque
 * to the signaling layer by design.
 *
 * Relay mapping:
 *   signal:offer         -> offer-received         { roomId, sdp, senderId }
 *   signal:answer        -> answer-received        { roomId, sdp, senderId }
 *   signal:ice-candidate -> ice-candidate-received  { roomId, candidate, senderId }
 *
 * Relays use `socket.to(roomId)`, which broadcasts to every other socket
 * in the Socket.io room (i.e. the single other peer) and excludes the
 * sender — exactly the "relay to the other peer" behavior required.
 */

/** RTCSessionDescriptionInit.type values that are valid for an SDP offer. */
const OFFER_SDP_TYPES = ['offer'];

/**
 * RTCSessionDescriptionInit.type values that are valid for an SDP answer.
 * 'pranswer' (provisional answer) is accepted alongside 'answer' since
 * some WebRTC negotiation flows use it.
 */
const ANSWER_SDP_TYPES = ['answer', 'pranswer'];

/**
 * @typedef {Object} RTCSessionDescriptionInitLike
 * @property {string} type
 * @property {string} sdp
 */

/**
 * @typedef {Object} RTCIceCandidateInitLike
 * @property {string} candidate
 * @property {string | null} [sdpMid]
 * @property {number | null} [sdpMLineIndex]
 * @property {string | null} [usernameFragment]
 */

/**
 * Attach signaling-relay event listeners to a connected socket.
 *
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 * @param {import('./roomRegistry.js').RoomRegistry} roomRegistry
 */
export function registerSignalingHandlers(io, socket, roomRegistry) {
  socket.on('signal:offer', (payload) => {
    relaySessionDescription(socket, roomRegistry, payload, {
      expectedSdpTypes: OFFER_SDP_TYPES,
      invalidSdpCode: 'INVALID_OFFER_PAYLOAD',
      invalidSdpMessage:
        'signal:offer payload must include sdp = { type: "offer", sdp: <string> }.',
      relayEvent: 'offer-received',
    });
  });

  socket.on('signal:answer', (payload) => {
    relaySessionDescription(socket, roomRegistry, payload, {
      expectedSdpTypes: ANSWER_SDP_TYPES,
      invalidSdpCode: 'INVALID_ANSWER_PAYLOAD',
      invalidSdpMessage:
        'signal:answer payload must include sdp = { type: "answer" | "pranswer", sdp: <string> }.',
      relayEvent: 'answer-received',
    });
  });

  socket.on('signal:ice-candidate', (payload) => {
    relayIceCandidate(socket, roomRegistry, payload);
  });
}

// ---------------------------------------------------------------------
// Relay implementations
// ---------------------------------------------------------------------

/**
 * Validate and relay an SDP offer or answer.
 *
 * @param {import('socket.io').Socket} socket
 * @param {import('./roomRegistry.js').RoomRegistry} roomRegistry
 * @param {{ roomId?: unknown, sdp?: unknown }} payload
 * @param {{
 *   expectedSdpTypes: string[],
 *   invalidSdpCode: string,
 *   invalidSdpMessage: string,
 *   relayEvent: string,
 * }} config
 */
function relaySessionDescription(socket, roomRegistry, payload, config) {
  const { roomId, sdp } = payload ?? {};

  const room = getRoomForSender(socket, roomRegistry, roomId);
  if (!room) return; // Error already emitted by getRoomForSender.

  if (!isValidSessionDescription(sdp, config.expectedSdpTypes)) {
    emitError(socket, config.invalidSdpCode, config.invalidSdpMessage);
    return;
  }

  // Relay verbatim — the sdp string itself is never read or modified.
  socket.to(roomId).emit(config.relayEvent, {
    roomId,
    sdp,
    senderId: socket.id,
  });
}

/**
 * Validate and relay an ICE candidate.
 *
 * @param {import('socket.io').Socket} socket
 * @param {import('./roomRegistry.js').RoomRegistry} roomRegistry
 * @param {{ roomId?: unknown, candidate?: unknown }} payload
 */
function relayIceCandidate(socket, roomRegistry, payload) {
  const { roomId, candidate } = payload ?? {};

  const room = getRoomForSender(socket, roomRegistry, roomId);
  if (!room) return; // Error already emitted by getRoomForSender.

  if (!isValidIceCandidate(candidate)) {
    emitError(
      socket,
      'INVALID_ICE_CANDIDATE_PAYLOAD',
      'signal:ice-candidate payload must include candidate = '
        + '{ candidate: <string>, sdpMid?, sdpMLineIndex? } or null '
        + '(end-of-candidates marker).',
    );
    return;
  }

  // Relay verbatim — candidate fields are never read or modified.
  socket.to(roomId).emit('ice-candidate-received', {
    roomId,
    candidate,
    senderId: socket.id,
  });
}

// ---------------------------------------------------------------------
// Shared validation helpers
// ---------------------------------------------------------------------

/**
 * Resolve `roomId` to a Room, verifying:
 *   1. roomId is a non-empty string,
 *   2. the room exists in the registry,
 *   3. the sending socket is actually a member of that room.
 *
 * Emits an `error` event and returns null on any failure, so callers can
 * simply `if (!room) return;`.
 *
 * @param {import('socket.io').Socket} socket
 * @param {import('./roomRegistry.js').RoomRegistry} roomRegistry
 * @param {unknown} roomId
 * @returns {import('./roomRegistry.js').Room | null}
 */
function getRoomForSender(socket, roomRegistry, roomId) {
  if (typeof roomId !== 'string' || roomId.trim().length === 0) {
    emitError(socket, 'INVALID_ROOM_ID', 'roomId must be a non-empty string.');
    return null;
  }

  const room = roomRegistry.getRoom(roomId);
  if (!room) {
    emitError(socket, 'ROOM_NOT_FOUND', `No active room with ID "${roomId}".`);
    return null;
  }

  if (!room.members.includes(socket.id)) {
    emitError(
      socket,
      'NOT_IN_ROOM',
      'You must join this room before sending signaling messages to it.',
    );
    return null;
  }

  return room;
}

/**
 * Structural validation of an RTCSessionDescriptionInit-like object.
 * Only the envelope (`type`, `sdp` field presence/typing) is checked —
 * the contents of the `sdp` string are never parsed.
 *
 * @param {unknown} sdp
 * @param {string[]} expectedTypes - Acceptable values for `sdp.type`.
 * @returns {sdp is RTCSessionDescriptionInitLike}
 */
function isValidSessionDescription(sdp, expectedTypes) {
  return (
    typeof sdp === 'object'
    && sdp !== null
    && typeof sdp.type === 'string'
    && expectedTypes.includes(sdp.type)
    && typeof sdp.sdp === 'string'
  );
}

/**
 * Structural validation of an RTCIceCandidateInit-like object.
 *
 * `null` is accepted as a valid value — browsers send a `null` candidate
 * (or one with an empty `candidate` string) to signal end-of-candidates,
 * and that marker must be relayed too.
 *
 * @param {unknown} candidate
 * @returns {candidate is RTCIceCandidateInitLike | null}
 */
function isValidIceCandidate(candidate) {
  if (candidate === null) return true; // End-of-candidates marker.

  if (typeof candidate !== 'object') return false;

  if (typeof candidate.candidate !== 'string') return false;

  if (
    candidate.sdpMid !== undefined
    && candidate.sdpMid !== null
    && typeof candidate.sdpMid !== 'string'
  ) {
    return false;
  }

  if (
    candidate.sdpMLineIndex !== undefined
    && candidate.sdpMLineIndex !== null
    && typeof candidate.sdpMLineIndex !== 'number'
  ) {
    return false;
  }

  return true;
}

/**
 * Emit a structured error back to the sending socket.
 *
 * @param {import('socket.io').Socket} socket
 * @param {string} code
 * @param {string} message
 */
function emitError(socket, code, message) {
  socket.emit('error', { code, message });
}
