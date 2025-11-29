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

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/events', eventRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/line-items', lineItemRoutes);
app.use('/api/statuses', statusRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/sub-line-item-types', subLineItemTypeRoutes);
app.use('/api/documents', documentRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

