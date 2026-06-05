import http from 'http';
import { Server } from 'socket.io';
import app from './app';

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialize Socket.io with CORS configured for the React frontend
export const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// Map to keep track of active user socket connections
const userSockets = new Map<string, string>(); // userId -> socketId

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Register user socket
  socket.on('register', (userId: string) => {
    if (userId) {
      userSockets.set(userId, socket.id);
      console.log(`Registered socket ${socket.id} for user ${userId}`);
    }
  });

  socket.on('disconnect', () => {
    // Clean up mapping
    for (const [userId, socketId] of userSockets.entries()) {
      if (socketId === socket.id) {
        userSockets.delete(userId);
        console.log(`Unregistered socket for user ${userId}`);
        break;
      }
    }
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Helper function to send real-time notification to a specific user
export const sendRealTimeNotification = (userId: string, eventName: string, data: any) => {
  const socketId = userSockets.get(userId);
  if (socketId) {
    io.to(socketId).emit(eventName, data);
    console.log(`Sent real-time notification '${eventName}' to user ${userId}`);
  } else {
    console.log(`User ${userId} is offline. Notification queued in DB.`);
  }
};

if (!process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
