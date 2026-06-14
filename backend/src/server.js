import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { PORT, ALLOWED_ORIGINS } from './config/env.js';
import { corsOptions } from './config/cors.js';
import { errorHandler } from './middleware/errorHandler.js';
import healthRouter from './routes/health.js';
import turnRouter from './routes/turn.js';
import { initializeSockets } from './sockets/index.js';

const app = express();
const httpServer = createServer(app);

// Setup Socket.io with allowed CORS origins
const io = new Server(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/health', healthRouter);
app.use('/turn-credentials', turnRouter);

// Socket.io initialization
initializeSockets(io);

// Global Error Handler
app.use(errorHandler);

// Bootstrap server
httpServer.listen(PORT, () => {
  console.log(`[Signaling Server] Running on port ${PORT}`);
});
