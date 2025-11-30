import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { ModuleType, isGlobalModule } from '@event-management/shared';

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

// Get line items for a global module type (across all events, optionally filtered by eventId)
// IMPORTANT: This route must come BEFORE /:eventId/:moduleType to avoid route conflicts
moduleRoutes.get('/global/:moduleType', async (req, res) => {
  console.log('🚀 GLOBAL MODULE ROUTE HIT:', req.params.moduleType);
  try {
    const { moduleType } = req.params;
    const eventId = req.query.eventId as string | undefined;
    const moduleTypeEnum = moduleType.toUpperCase().replace(/-/g, '_') as ModuleType;

    console.log('🔍 Global module request:', { moduleType, moduleTypeEnum, eventId });

    // Verify this is a global module
    if (!isGlobalModule(moduleTypeEnum)) {
      console.error('❌ Not a global module:', moduleTypeEnum);
      return res.status(400).json({ error: 'Module type is not a global module' });
    }

    const where: any = {
      moduleType: moduleTypeEnum,
      parentLineItemId: null, // Only get top-level items
    };

    if (eventId) {
      where.eventId = eventId;
    }

    console.log('🔍 Query where clause:', JSON.stringify(where, null, 2));
    console.log('🔍 isGlobalModule check:', isGlobalModule(moduleTypeEnum));

    const lineItems = await prisma.lineItem.findMany({
      where,
      include: {
        Status: true,
        Category: true,
        Tag: true,
        Event: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
          },
        },
        other_LineItem: {
          include: {
            Status: true,
            Category: true,
            Tag: true,
            Event: {
              select: {
                id: true,
                name: true,
                startDate: true,
                endDate: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`✅ Found ${lineItems.length} line items for ${moduleTypeEnum}`);
    if (lineItems.length > 0) {
      console.log('🔍 First item:', JSON.stringify({ id: lineItems[0].id, name: lineItems[0].name, moduleType: lineItems[0].moduleType }, null, 2));
    }
    
    // Map the data to match expected format (subLineItems instead of other_LineItem)
    const mappedItems = lineItems.map(item => ({
      ...item,
      status: item.Status,
      category: item.Category,
      tags: item.Tag,
      event: item.Event,
      subLineItems: item.other_LineItem.map(subItem => ({
        ...subItem,
        status: subItem.Status,
        category: subItem.Category,
        tags: subItem.Tag,
        event: subItem.Event,
      })),
    }));

    console.log(`✅ Mapped ${mappedItems.length} items`);
    const parsedItems = mappedItems.map(parseMetadata);
    console.log(`✅ Parsed ${parsedItems.length} items`);
    
    res.json(parsedItems);
  } catch (error: any) {
    console.error('Error fetching global module line items:', error);
    res.status(500).json({ error: 'Failed to fetch global module line items', details: error?.message });
  }
});

// Get line items for a module type in an event
moduleRoutes.get('/:eventId/:moduleType', async (req, res) => {
  try {
    const { eventId, moduleType } = req.params;
    const lineItems = await prisma.lineItem.findMany({
      where: {
        eventId,
        moduleType: moduleType.toUpperCase().replace(/-/g, '_') as ModuleType,
        parentLineItemId: null, // Only get top-level items
      },
      include: {
        Status: true,
        Category: true,
        Tag: true,
        other_LineItem: {
          include: {
            Status: true,
            Category: true,
            Tag: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    // Map the data to match expected format (subLineItems instead of other_LineItem)
    const mappedItems = lineItems.map(item => ({
      ...item,
      status: item.Status,
      category: item.Category,
      tags: item.Tag,
      subLineItems: item.other_LineItem.map(subItem => ({
        ...subItem,
        status: subItem.Status,
        category: subItem.Category,
        tags: subItem.Tag,
      })),
    }));
    
    res.json(mappedItems.map(parseMetadata));
  } catch (error: any) {
    console.error('Error fetching module line items:', error);
    res.status(500).json({ error: 'Failed to fetch module line items', details: error?.message });
  }
});

