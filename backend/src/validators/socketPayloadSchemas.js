export function validateCreateRoom(payload) {
  if (!payload || !payload.fileMeta) {
    return { valid: false, error: 'Missing fileMeta object' };
  }
  const { name, size, type } = payload.fileMeta;
  if (typeof name !== 'string' || name.trim() === '') {
    return { valid: false, error: 'Invalid or missing file name' };
  }
  if (typeof size !== 'number' || size <= 0) {
    return { valid: false, error: 'Invalid or missing file size' };
  }
  if (typeof type !== 'string') {
    return { valid: false, error: 'Invalid file type' };
  }
  return { valid: true };
}

export function validateJoinRoom(payload) {
  if (!payload || typeof payload.roomId !== 'string' || payload.roomId.trim() === '') {
    return { valid: false, error: 'Invalid or missing roomId' };
  }
  return { valid: true };
}

export function validateSignal(payload) {
  if (!payload || typeof payload.roomId !== 'string' || payload.roomId.trim() === '') {
    return { valid: false, error: 'Invalid or missing roomId' };
  }
  return { valid: true };
}
