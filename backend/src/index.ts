import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { eventRoutes } from './routes/events';
import { moduleRoutes } from './routes/modules';
import { lineItemRoutes } from './routes/line-items';
import { statusRoutes } from './routes/statuses';
import { categoryRoutes } from './routes/categories';
import { tagRoutes } from './routes/tags';
import { financeRoutes } from './routes/finance';
import { subLineItemTypeRoutes } from './routes/sub-line-item-types';
import { documentRoutes } from './routes/documents';
import { commentRoutes } from './routes/comments';
import { userRoutes } from './routes/users';
import { auth } from './lib/auth';
import { requireAuth } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter, authLimiter } from './middleware/rateLimiter';
import { env } from './config/env';

const app = express();
const PORT = env.PORT;

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow embedding for file previews
}));

// CORS configuration for auth cookies
app.use(cors({
  origin: env.CORS_ORIGINS,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use('/api/', apiLimiter);

// Health check (public)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// BetterAuth routes (public) - with strict rate limiting
app.all('/api/auth/*', authLimiter, async (req, res) => {
  try {
    // Convert Express request to Web API Request
    const url = new URL(req.url, `http://${req.headers.host}`);
    const webRequest = new Request(url.toString(), {
      method: req.method,
      headers: req.headers as any,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    });

    // Call betterAuth handler
    const response = await auth.handler(webRequest);

    // Convert Web API Response to Express response
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    res.status(response.status);
    
    const body = await response.text();
    if (body) {
      try {
        const json = JSON.parse(body);
        res.json(json);
      } catch {
        res.send(body);
      }
    } else {
      res.end();
    }
  } catch (error: any) {
    console.error('Auth handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Protected API routes - require authentication
app.use('/api/events', requireAuth, eventRoutes);
app.use('/api/modules', requireAuth, moduleRoutes);
app.use('/api/line-items', requireAuth, lineItemRoutes);
app.use('/api/statuses', requireAuth, statusRoutes);
app.use('/api/categories', requireAuth, categoryRoutes);
app.use('/api/tags', requireAuth, tagRoutes);
app.use('/api/finance', requireAuth, financeRoutes);
app.use('/api/sub-line-item-types', requireAuth, subLineItemTypeRoutes);
app.use('/api/documents', requireAuth, documentRoutes);
app.use('/api/comments', requireAuth, commentRoutes);
app.use('/api/users', requireAuth, userRoutes);

// Error handler must be last middleware
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${env.NODE_ENV}`);
});

