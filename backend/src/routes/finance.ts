import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { ModuleType, MODULE_DISPLAY_NAMES } from '@event-management/shared';

export const financeRoutes = Router();

// Helper function to calculate cost values from a line item
function getCostValues(item: any) {
  const plannedCost = item.plannedCost ?? item.totalPrice ?? 0;
  const actualCost = item.actualCost ?? 0;
  const totalPrice = item.totalPrice ?? plannedCost ?? 0;
  const variance = actualCost - plannedCost;
  return { plannedCost, actualCost, totalPrice, variance };
}

// Helper function to aggregate line items with sub-items
function aggregateLineItems(lineItems: any[], includeSubItems: boolean = false) {
  const items: any[] = [];
  
  for (const item of lineItems) {
    const { plannedCost, actualCost, totalPrice, variance } = getCostValues(item);
    
    // Add main line item
    items.push({
      ...item,
      plannedCost,
      actualCost,
      totalPrice,
      variance,
      isSubLineItem: false,
    });
    
    // Add sub-line items if requested
    if (includeSubItems && item.other_LineItem && item.other_LineItem.length > 0) {
      for (const subItem of item.other_LineItem) {
        const subCosts = getCostValues(subItem);
        items.push({
          ...subItem,
          ...subCosts,
          isSubLineItem: true,
          parentLineItemId: item.id,
          parentLineItemName: item.name,
        });
      }
    }
  }
  
  return items;
}

// Get cross-event finance summary with filters
financeRoutes.get('/', async (req, res) => {
  try {
    const eventIds = req.query.eventIds ? (req.query.eventIds as string).split(',') : undefined;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    const moduleTypes = req.query.moduleTypes ? (req.query.moduleTypes as string).split(',') as ModuleType[] : undefined;
    const includeSubItems = req.query.includeSubItems === 'true';

    // Build where clause
    const where: any = {};
    
    if (eventIds && eventIds.length > 0) {
      where.eventId = { in: eventIds };
    }
    
    if (moduleTypes && moduleTypes.length > 0) {
      where.moduleType = { in: moduleTypes };
    }

    // Get events for date filtering
    let eventIdsForDateFilter: string[] | undefined;
    if (startDate || endDate) {
      const eventWhere: any = {};
      if (startDate) eventWhere.startDate = { gte: startDate };
      if (endDate) eventWhere.endDate = { lte: endDate };
      
      const events = await prisma.event.findMany({
        where: eventWhere,
        select: { id: true },
      });
      eventIdsForDateFilter = events.map(e => e.id);
      
      if (eventIdsForDateFilter.length === 0) {
        // No events match date filter, return empty summary
        return res.json({
          totalEstimated: 0,
          totalActual: 0,
          totalBudget: 0,
          totalSpent: 0,
          totalCommitted: 0,
          remaining: 0,
          variance: 0,
          byModule: [],
          byCategory: [],
          byStatus: [],
          byEvent: [],
        });
      }
      
      if (where.eventId) {
        // Combine with existing event filter
        where.eventId = { in: eventIdsForDateFilter.filter(id => eventIds?.includes(id)) };
      } else {
        where.eventId = { in: eventIdsForDateFilter };
      }
    }

    // Get all line items matching filters
    const lineItems = await prisma.lineItem.findMany({
      where: {
        ...where,
        parentLineItemId: null, // Only get top-level items for aggregation
      },
      include: {
        Status: true,
        Category: true,
        Tag: true,
        Event: true,
        other_LineItem: {
          include: {
            Status: true,
            Category: true,
          },
        },
      },
    });

    // Get sub-line items if needed
    let allItems = lineItems;
    if (includeSubItems) {
      const subItems = await prisma.lineItem.findMany({
        where: {
          ...where,
          parentLineItemId: { not: null },
        },
        include: {
          Status: true,
          Category: true,
          LineItem: {
            select: { id: true, name: true },
          },
        },
      });
      allItems = [...lineItems, ...subItems];
    }

    // Calculate totals using plannedCost and actualCost
    let totalEstimated = 0;
    let totalActual = 0;
    let totalBudget = 0; // Legacy fallback

    for (const item of allItems) {
      const costs = getCostValues(item);
      totalEstimated += costs.plannedCost;
      totalActual += costs.actualCost;
      totalBudget += costs.totalPrice;
    }

    const variance = totalActual - totalEstimated;

    // Group by module
    const moduleMap = new Map<ModuleType, { items: any[] }>();
    for (const item of allItems) {
      if (!moduleMap.has(item.moduleType)) {
        moduleMap.set(item.moduleType, { items: [] });
      }
      moduleMap.get(item.moduleType)!.items.push(item);
    }

    const byModule = Object.values(ModuleType).map(moduleType => {
      const moduleData = moduleMap.get(moduleType) || { items: [] };
      let moduleEstimated = 0;
      let moduleActual = 0;
      let moduleBudget = 0;
      
      for (const item of moduleData.items) {
        const costs = getCostValues(item);
        moduleEstimated += costs.plannedCost;
        moduleActual += costs.actualCost;
        moduleBudget += costs.totalPrice;
      }

      return {
        moduleType,
        moduleName: MODULE_DISPLAY_NAMES[moduleType],
        budget: moduleBudget, // Legacy
        spent: 0, // Legacy - not used in new calculations
        committed: 0, // Legacy - not used in new calculations
        remaining: moduleBudget, // Legacy
        totalEstimated: moduleEstimated,
        totalActual: moduleActual,
        variance: moduleActual - moduleEstimated,
        lineItemCount: moduleData.items.length,
      };
    });

    // Group by category
    const categoryMap = new Map<string, { name: string; items: any[] }>();
    for (const item of allItems) {
      if (item.Category) {
        const catId = item.categoryId || '';
        if (!categoryMap.has(catId)) {
          categoryMap.set(catId, { name: item.Category.name, items: [] });
        }
        categoryMap.get(catId)!.items.push(item);
      }
    }

    const byCategory = Array.from(categoryMap.entries()).map(([id, data]) => {
      let catEstimated = 0;
      let catActual = 0;
      let catAmount = 0;
      
      for (const item of data.items) {
        const costs = getCostValues(item);
        catEstimated += costs.plannedCost;
        catActual += costs.actualCost;
        catAmount += costs.totalPrice;
      }

      return {
        categoryId: id,
        categoryName: data.name,
        amount: catAmount, // Legacy
        totalEstimated: catEstimated,
        totalActual: catActual,
        variance: catActual - catEstimated,
        lineItemCount: data.items.length,
      };
    });

    // Group by status
    const statusMap = new Map<string, { name: string; items: any[] }>();
    for (const item of allItems) {
      if (item.Status) {
        const statusId = item.statusId || '';
        if (!statusMap.has(statusId)) {
          statusMap.set(statusId, { name: item.Status.name, items: [] });
        }
        statusMap.get(statusId)!.items.push(item);
      }
    }

    const byStatus = Array.from(statusMap.entries()).map(([id, data]) => {
      let statusEstimated = 0;
      let statusActual = 0;
      let statusAmount = 0;
      
      for (const item of data.items) {
        const costs = getCostValues(item);
        statusEstimated += costs.plannedCost;
        statusActual += costs.actualCost;
        statusAmount += costs.totalPrice;
      }

      return {
        statusId: id,
        statusName: data.name,
        amount: statusAmount, // Legacy
        totalEstimated: statusEstimated,
        totalActual: statusActual,
        variance: statusActual - statusEstimated,
        lineItemCount: data.items.length,
      };
    });

    // Group by event
    const eventMap = new Map<string, { name: string; startDate: Date; endDate: Date; items: any[] }>();
    for (const item of allItems) {
      const eventId = item.eventId;
      if (item.Event) {
        if (!eventMap.has(eventId)) {
          eventMap.set(eventId, {
            name: item.Event.name,
            startDate: item.Event.startDate,
            endDate: item.Event.endDate,
            items: [],
          });
        }
        eventMap.get(eventId)!.items.push(item);
      }
    }

    const byEvent = Array.from(eventMap.entries()).map(([eventId, data]) => {
      let eventEstimated = 0;
      let eventActual = 0;
      
      for (const item of data.items) {
        const costs = getCostValues(item);
        eventEstimated += costs.plannedCost;
        eventActual += costs.actualCost;
      }

      return {
        eventId,
        eventName: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
        totalEstimated: eventEstimated,
        totalActual: eventActual,
        variance: eventActual - eventEstimated,
        lineItemCount: data.items.length,
      };
    });

    const summary = {
      totalEstimated,
      totalActual,
      totalBudget,
      totalSpent: 0, // Legacy - not used in new calculations
      totalCommitted: 0, // Legacy - not used in new calculations
      remaining: totalBudget, // Legacy
      variance,
      byModule,
      byCategory,
      byStatus,
      byEvent,
    };

    res.json(summary);
  } catch (error: any) {
    console.error('Error fetching cross-event finance summary:', error);
    res.status(500).json({ error: 'Failed to fetch finance summary', details: error?.message });
  }
});

// Get cross-event finance line items with filters
financeRoutes.get('/line-items', async (req, res) => {
  try {
    const eventIds = req.query.eventIds ? (req.query.eventIds as string).split(',') : undefined;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    const moduleTypes = req.query.moduleTypes ? (req.query.moduleTypes as string).split(',') as ModuleType[] : undefined;
    const includeSubItems = req.query.includeSubItems === 'true';

    // Build where clause
    const where: any = {};
    
    if (eventIds && eventIds.length > 0) {
      where.eventId = { in: eventIds };
    }
    
    if (moduleTypes && moduleTypes.length > 0) {
      where.moduleType = { in: moduleTypes };
    }

    // Get events for date filtering
    if (startDate || endDate) {
      const eventWhere: any = {};
      if (startDate) eventWhere.startDate = { gte: startDate };
      if (endDate) eventWhere.endDate = { lte: endDate };
      
      const events = await prisma.event.findMany({
        where: eventWhere,
        select: { id: true },
      });
      const eventIdsForDateFilter = events.map(e => e.id);
      
      if (eventIdsForDateFilter.length === 0) {
        return res.json([]);
      }
      
      if (where.eventId) {
        where.eventId = { in: eventIdsForDateFilter.filter(id => eventIds?.includes(id)) };
      } else {
        where.eventId = { in: eventIdsForDateFilter };
      }
    }

    // Get main line items
    const mainItems = await prisma.lineItem.findMany({
      where: {
        ...where,
        parentLineItemId: null,
      },
      include: {
        Status: true,
        Category: true,
        Tag: true,
        Event: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    let allItems = mainItems.map(item => ({
      ...item,
      isSubLineItem: false,
    }));

    // Get sub-line items if requested
    if (includeSubItems) {
      const subItems = await prisma.lineItem.findMany({
        where: {
          ...where,
          parentLineItemId: { not: null },
        },
        include: {
          Status: true,
          Category: true,
          Tag: true,
          Event: true,
          LineItem: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const subItemsMapped = subItems.map(item => ({
        ...item,
        isSubLineItem: true,
        parentLineItemId: item.parentLineItemId,
        parentLineItemName: item.LineItem?.name,
      }));

      allItems = [...allItems, ...subItemsMapped];
    }

    const financeLineItems = allItems.map(item => {
      const costs = getCostValues(item);
      return {
        id: item.id,
        eventId: item.eventId,
        eventName: item.Event?.name,
        moduleType: item.moduleType,
        moduleName: MODULE_DISPLAY_NAMES[item.moduleType],
        lineItemName: item.name,
        categoryName: item.Category?.name,
        statusName: item.Status?.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: costs.totalPrice,
        plannedCost: costs.plannedCost,
        actualCost: costs.actualCost,
        variance: costs.variance,
        isSubLineItem: item.isSubLineItem || false,
        parentLineItemId: item.parentLineItemId,
        parentLineItemName: item.parentLineItemName,
        date: item.createdAt,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      };
    });

    res.json(financeLineItems);
  } catch (error: any) {
    console.error('Error fetching cross-event finance line items:', error);
    res.status(500).json({ error: 'Failed to fetch finance line items', details: error?.message });
  }
});

// Get finance summary for an event (backward compatibility)
financeRoutes.get('/:eventId', async (req, res) => {
  try {
    const eventId = req.params.eventId;

    // Get all line items for the event (including sub-items for aggregation)
    const lineItems = await prisma.lineItem.findMany({
      where: { eventId },
      include: {
        Status: true,
        Category: true,
        Tag: true,
        other_LineItem: {
          include: {
            Status: true,
            Category: true,
          },
        },
      },
    });

    // Calculate totals using new cost fields
    let totalEstimated = 0;
    let totalActual = 0;
    let totalBudget = 0;
    let totalSpent = 0; // Legacy status-based
    let totalCommitted = 0; // Legacy status-based

    for (const item of lineItems) {
      const costs = getCostValues(item);
      totalEstimated += costs.plannedCost;
      totalActual += costs.actualCost;
      totalBudget += costs.totalPrice;
      
      // Legacy status-based calculations
      if (item.Status) {
        const statusName = item.Status.name.toLowerCase();
        if (statusName.includes('paid') || statusName.includes('completed')) {
          totalSpent += costs.totalPrice;
        }
        if (statusName.includes('confirmed') || statusName.includes('committed')) {
          totalCommitted += costs.totalPrice;
        }
      }
    }

    const variance = totalActual - totalEstimated;

    // Group by module
    const byModule = Object.values(ModuleType).map(moduleType => {
      const moduleItems = lineItems.filter(item => item.moduleType === moduleType);
      let moduleEstimated = 0;
      let moduleActual = 0;
      let moduleBudget = 0;
      let moduleSpent = 0;
      let moduleCommitted = 0;

      for (const item of moduleItems) {
        const costs = getCostValues(item);
        moduleEstimated += costs.plannedCost;
        moduleActual += costs.actualCost;
        moduleBudget += costs.totalPrice;
        
        if (item.Status) {
          const statusName = item.Status.name.toLowerCase();
          if (statusName.includes('paid') || statusName.includes('completed')) {
            moduleSpent += costs.totalPrice;
          }
          if (statusName.includes('confirmed') || statusName.includes('committed')) {
            moduleCommitted += costs.totalPrice;
          }
        }
      }

      return {
        moduleType,
        moduleName: MODULE_DISPLAY_NAMES[moduleType],
        budget: moduleBudget,
        spent: moduleSpent,
        committed: moduleCommitted,
        remaining: moduleBudget - moduleSpent - moduleCommitted,
        totalEstimated: moduleEstimated,
        totalActual: moduleActual,
        variance: moduleActual - moduleEstimated,
        lineItemCount: moduleItems.length,
      };
    });

    // Group by category
    const categoryMap = new Map<string, { name: string; items: any[] }>();
    lineItems.forEach(item => {
      if (item.Category) {
        const catId = item.categoryId || '';
        if (!categoryMap.has(catId)) {
          categoryMap.set(catId, { name: item.Category.name, items: [] });
        }
        categoryMap.get(catId)!.items.push(item);
      }
    });
    const byCategory = Array.from(categoryMap.entries()).map(([id, data]) => {
      let catEstimated = 0;
      let catActual = 0;
      let catAmount = 0;
      
      for (const item of data.items) {
        const costs = getCostValues(item);
        catEstimated += costs.plannedCost;
        catActual += costs.actualCost;
        catAmount += costs.totalPrice;
      }

      return {
      categoryId: id,
      categoryName: data.name,
        amount: catAmount,
        totalEstimated: catEstimated,
        totalActual: catActual,
        variance: catActual - catEstimated,
        lineItemCount: data.items.length,
      };
    });

    // Group by status
    const statusMap = new Map<string, { name: string; items: any[] }>();
    lineItems.forEach(item => {
      if (item.Status) {
        const statusId = item.statusId || '';
        if (!statusMap.has(statusId)) {
          statusMap.set(statusId, { name: item.Status.name, items: [] });
        }
        statusMap.get(statusId)!.items.push(item);
      }
    });
    const byStatus = Array.from(statusMap.entries()).map(([id, data]) => {
      let statusEstimated = 0;
      let statusActual = 0;
      let statusAmount = 0;
      
      for (const item of data.items) {
        const costs = getCostValues(item);
        statusEstimated += costs.plannedCost;
        statusActual += costs.actualCost;
        statusAmount += costs.totalPrice;
      }

      return {
      statusId: id,
      statusName: data.name,
        amount: statusAmount,
        totalEstimated: statusEstimated,
        totalActual: statusActual,
        variance: statusActual - statusEstimated,
        lineItemCount: data.items.length,
      };
    });

    const summary = {
      eventId,
      totalEstimated,
      totalActual,
      totalBudget,
      totalSpent,
      totalCommitted,
      remaining: totalBudget - totalSpent - totalCommitted,
      variance,
      byModule,
      byCategory,
      byStatus,
    };

    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch finance summary' });
  }
});

// Get finance line items (detailed view) - backward compatibility
financeRoutes.get('/:eventId/line-items', async (req, res) => {
  try {
    const lineItems = await prisma.lineItem.findMany({
      where: { 
        eventId: req.params.eventId,
        parentLineItemId: null, // Only main items for backward compatibility
      },
      include: {
        Status: true,
        Category: true,
        Tag: true,
        Event: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const financeLineItems = lineItems.map(item => {
      const costs = getCostValues(item);
      return {
      id: item.id,
        eventId: item.eventId,
        eventName: item.Event?.name,
      moduleType: item.moduleType,
      moduleName: MODULE_DISPLAY_NAMES[item.moduleType],
      lineItemName: item.name,
      categoryName: item.Category?.name,
      statusName: item.Status?.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
        totalPrice: costs.totalPrice,
        plannedCost: costs.plannedCost,
        actualCost: costs.actualCost,
        variance: costs.variance,
        isSubLineItem: false,
      date: item.createdAt,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      };
    });

    res.json(financeLineItems);
  } catch (error: any) {
    console.error('Error fetching finance line items:', error);
    res.status(500).json({ error: 'Failed to fetch finance line items', details: error?.message });
  }
});


