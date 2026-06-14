export const CHUNK_SIZE = 16384; // Standard 16KB WebRTC chunk size
export const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1GB limit for safety

export const getFileChunksCount = (fileSize) => {
  return Math.ceil(fileSize / CHUNK_SIZE);
};

export const sliceFile = (file, chunkIndex) => {
  const start = chunkIndex * CHUNK_SIZE;
  const end = Math.min(start + CHUNK_SIZE, file.size);
  return file.slice(start, end);
};
