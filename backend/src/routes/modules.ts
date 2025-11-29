import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { ModuleType } from '@event-management/shared';

export const moduleRoutes = Router();

// Helper to parse metadata
const parseMetadata = (item: any) => {
  if (item.metadata && typeof item.metadata === 'string') {
    try {
      item.metadata = JSON.parse(item.metadata);
    } catch {
      item.metadata = {};
    }
  }
  // Recursively parse sub-line items
  if (item.subLineItems && Array.isArray(item.subLineItems)) {
    item.subLineItems = item.subLineItems.map(parseMetadata);
  }
  return item;
};

// Get line items for a module type in an event
moduleRoutes.get('/:eventId/:moduleType', async (req, res) => {
  try {
    const { eventId, moduleType } = req.params;
    const lineItems = await prisma.lineItem.findMany({
      where: {
        eventId,
        moduleType: moduleType.toUpperCase().replace('-', '_') as ModuleType,
        parentLineItemId: null, // Only get top-level items
      },
      include: {
        status: true,
        category: true,
        tags: true,
        subLineItems: {
          include: {
            status: true,
            category: true,
            tags: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(lineItems.map(parseMetadata));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch module line items' });
  }
});

