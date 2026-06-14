import { customAlphabet } from 'nanoid';

// URL-safe alphabet for Room IDs
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const nanoid = customAlphabet(alphabet, 21);

export function generateRoomId() {
  return nanoid();
}
