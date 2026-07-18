import express from 'express';
import cors from 'cors';

import { config } from './config';
import { errorHandler, notFound } from './middleware/errorHandler';
import routes from './routes';
import { securityHeaders } from './middleware/helmet';
import { generalLimiter } from './middleware/rateLimiter';

const app = express();

// Security headers
app.use(securityHeaders);

// CORS with strict origins
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count'],
  maxAge: 86400,
}));

// Security headers (additional)
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// General rate limiting
app.use('/api/', generalLimiter);

// Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'API is running', timestamp: new Date().toISOString() });
});

// API root
app.get('/api/v1', (_req, res) => {
  res.json({
    success: true,
    message: 'Premium Fashion Store API',
    version: '1.0.0',
    docs: {
      products: '/api/v1/products',
      categories: '/api/v1/categories',
      auth: '/api/v1/auth/login',
      health: '/health',
    },
  });
});

// API routes
app.use('/api/v1', routes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
app.listen(config.port, () => {
  console.log(`\n🚀 Server running in ${config.nodeEnv} mode on port ${config.port}`);
  console.log(`📡 API: http://localhost:${config.port}/api/v1`);
  console.log(`❤️  Health: http://localhost:${config.port}/health\n`);
});

export default app;
