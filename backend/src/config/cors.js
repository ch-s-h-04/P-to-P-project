import { ALLOWED_ORIGINS } from './env.js';

export const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl requests) or allowed origins
    if (!origin || ALLOWED_ORIGINS.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};
