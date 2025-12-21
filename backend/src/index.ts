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
import { passwordResetRoutes } from './routes/passwordReset';
import { auth } from './lib/auth';
import { requireAuth } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter, authLimiter, passwordResetLimiter } from './middleware/rateLimiter';
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

// Rate limiting - exclude auth routes as they have their own limiter
app.use('/api/', (req, res, next) => {
  // Skip rate limiting for auth routes (they have their own stricter limiter)
  if (req.path.startsWith('/api/auth/')) {
    return next();
  }
  apiLimiter(req, res, next);
});

// Health check (public)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Password reset routes (public) - with rate limiting
app.use('/api/password-reset', passwordResetLimiter, passwordResetRoutes);

// BetterAuth routes (public) - with strict rate limiting
app.all('/api/auth/*', authLimiter, async (req, res) => {
  try {
    // Handle OPTIONS preflight requests
    if (req.method === 'OPTIONS') {
      const origin = req.headers.origin;
      if (origin && env.CORS_ORIGINS.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      }
      return res.status(200).end();
    }

    // Ensure CORS headers are set for better-auth routes
    const origin = req.headers.origin;
    if (origin && env.CORS_ORIGINS.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    // Convert Express request to Web API Request
    const url = new URL(req.url, `http://${req.headers.host}`);
    
    // Prepare headers - ensure Content-Type is set for JSON requests
    const headers = new Headers();
    Object.keys(req.headers).forEach(key => {
      const value = req.headers[key];
      if (value && typeof value === 'string') {
        headers.set(key, value);
      } else if (Array.isArray(value)) {
        headers.set(key, value[0]);
      }
    });
    
    // Ensure Content-Type is set for POST/PUT requests with body
    if ((req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') && req.body) {
      if (!headers.has('content-type')) {
        headers.set('content-type', 'application/json');
      }
    }
    
    // Prepare body - better-auth expects JSON for POST/PUT requests
    let body: string | undefined = undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      try {
        body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      } catch (err) {
        console.error('Error stringifying request body:', err);
        body = JSON.stringify(req.body);
      }
    }
    
    const webRequest = new Request(url.toString(), {
      method: req.method,
      headers,
      body,
    });

    // Call betterAuth handler
    let response: Response;
    try {
      response = await auth.handler(webRequest);
    } catch (handlerError: any) {
      console.error('Better-auth handler threw an error:', handlerError);
      console.error('Handler error details:', {
        message: handlerError?.message,
        stack: handlerError?.stack,
        name: handlerError?.name,
      });
      throw handlerError;
    }

    // Convert Web API Response to Express response
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    // Preserve CORS headers
    Object.entries(responseHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    res.status(response.status);
    
    const responseBody = await response.text();
    if (responseBody) {
      try {
        const json = JSON.parse(responseBody);
        // Ensure error messages are user-friendly
        if (response.status >= 400 && json.error) {
          // Map better-auth error codes to user-friendly messages
          if (json.error.includes('Invalid') || json.error.includes('invalid')) {
            json.error = 'Invalid email or password. Please check your credentials.';
          } else if (json.error.includes('not found') || json.error.includes('does not exist')) {
            json.error = 'No account found with this email address.';
          } else if (json.error.includes('password')) {
            json.error = 'Invalid password. Please try again.';
          }
        }
        res.json(json);
      } catch {
        res.send(responseBody);
      }
    } else {
      res.end();
    }
  } catch (error: any) {
    console.error('Auth handler error:', error);
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      cause: error?.cause,
    });
    res.status(500).json({ 
      error: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { 
        details: error?.message,
        stack: error?.stack 
      })
    });
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

