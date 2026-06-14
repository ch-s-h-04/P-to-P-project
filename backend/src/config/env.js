import dotenv from 'dotenv';
dotenv.config();

export const PORT = process.env.PORT || 3000;
export const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');
export const TURN_SECRET = process.env.TURN_SECRET || 'fallback_secret';
export const TURN_SERVER_URL = process.env.TURN_SERVER_URL || 'turn:localhost:3478';
export const ROOM_TTL_MS = parseInt(process.env.ROOM_TTL_MS || '600000', 10);
