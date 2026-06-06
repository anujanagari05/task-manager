import { Server } from 'socket.io';

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*', // Allow all origins for seamless development and hosting deployments
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`Socket Connected: ${socket.id}`);

    // Register user room for private/direct events (like personal notifications)
    socket.on('register_user', (userId) => {
      if (userId) {
        socket.join(userId.toString());
        console.log(`Socket ${socket.id} registered for user room: ${userId}`);
      }
    });

    // Join Project Channel Room
    socket.on('join_project', (projectId) => {
      if (projectId) {
        socket.join(projectId.toString());
        console.log(`Socket ${socket.id} joined project room: ${projectId}`);
      }
    });

    // Leave Project Channel Room
    socket.on('leave_project', (projectId) => {
      if (projectId) {
        socket.leave(projectId.toString());
        console.log(`Socket ${socket.id} left project room: ${projectId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket Disconnected: ${socket.id}`);
    });
  });

  return io;
};

// Helper to broadcast changes inside a project channel room
export const notifyProjectChange = (projectId, event, data) => {
  if (io && projectId) {
    io.to(projectId.toString()).emit(event, data);
  }
};

// Helper to send real-time alerts to a specific user's private channel room
export const notifyUser = (userId, event, data) => {
  if (io && userId) {
    io.to(userId.toString()).emit(event, data);
  }
};

