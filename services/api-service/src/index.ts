import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import sessionRoutes from './routes/sessions';
import userRoutes from './routes/users';
import mentorRoutes from './routes/mentors';
import bookingRoutes from './routes/bookings';
import reviewRoutes from './routes/reviews';
import expertiseRoutes from './routes/expertise';
import calendarRoutes from './routes/calendar';
import availabilityRoutes from './routes/availability';
import notificationRoutes from './routes/notifications';
import { startJobScheduler } from './services/jobScheduler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
// CORS configuration - allow multiple origins for production
const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : ['http://localhost:5173'];

app.use(cors({
  credentials: true, // Allow cookies to be sent
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (allowedOrigins.some(allowed => origin.includes(allowed.replace(/^https?:\/\//, '')))) {
      callback(null, true);
    } else {
      // In development, allow all origins
      if (process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
}));
app.use(express.json());
app.use(cookieParser()); // CRITICAL: Parse cookies for httpOnly token support

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/mentors', mentorRoutes);
app.use('/api/mentors', calendarRoutes);
app.use('/api/mentors', availabilityRoutes);
app.use('/api/notifications', notificationRoutes);

// Support /api/v1/* routes for backward compatibility
// IMPORTANT: Mount reviewRoutes BEFORE mentorRoutes to avoid route conflicts
// (reviews route: /mentors/:mentorId/reviews must match before /:mentorId)
app.use('/api/v1', reviewRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/mentors', mentorRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/expertise', expertiseRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Video Call API Service',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      sessions: '/api/sessions',
      users: '/api/users',
      mentors: '/api/mentors',
      notifications: '/api/notifications',
    },
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'API service is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  
  // Start job scheduler for notification processing
  startJobScheduler();
});

