import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';
import projectRoutes from './routes/projects.js';
import notificationRoutes from './routes/notifications.js';
import { initSocket } from './config/socket.js';

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Create HTTP server wrapping express app
const server = http.createServer(app);

// Initialize Socket.io integration
initSocket(server);

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for seamless development and hosting deployments
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Logger Middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl} - ${new Date().toISOString()}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/notifications', notificationRoutes);

// Health Check Route
app.get('/api/status', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Root Route
app.get('/', (req, res) => {
  res.send('MERN Collaborative Workspace API is running.');
});

// 404 Route handler
app.use((req, res, next) => {
  res.status(404).json({ message: 'Resource not found' });
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack);
  
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Collaborative server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
