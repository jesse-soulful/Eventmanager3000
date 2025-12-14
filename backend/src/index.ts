import express from 'express';
import cors from 'cors';
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

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration for auth cookies
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.FRONTEND_URL || 'http://localhost:5173',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check (public)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// BetterAuth routes (public)
app.all('/api/auth/*', async (req, res) => {
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
    res.status(500).json({ error: 'Internal server error', message: error?.message });
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

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

