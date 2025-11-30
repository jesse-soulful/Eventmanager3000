import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { ModuleType, MODULE_DISPLAY_NAMES } from '@event-management/shared';

export const financeRoutes = Router();

// Get finance summary for an event
financeRoutes.get('/:eventId', async (req, res) => {
  try {
    const eventId = req.params.eventId;

    // Get all line items for the event
    const lineItems = await prisma.lineItem.findMany({
      where: { eventId },
      include: {
        Status: true,
        Category: true,
        Tag: true,
      },
    });

    // Calculate totals
    const totalBudget = lineItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    const totalSpent = lineItems
      .filter(item => item.Status && (item.Status.name.toLowerCase().includes('paid') || item.Status.name.toLowerCase().includes('completed')))
      .reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    const totalCommitted = lineItems
      .filter(item => item.Status && (item.Status.name.toLowerCase().includes('confirmed') || item.Status.name.toLowerCase().includes('committed')))
      .reduce((sum, item) => sum + (item.totalPrice || 0), 0);

    // Group by module
    const byModule = Object.values(ModuleType).map(moduleType => {
      const moduleItems = lineItems.filter(item => item.moduleType === moduleType);
      const budget = moduleItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
      const spent = moduleItems
        .filter(item => item.Status && (item.Status.name.toLowerCase().includes('paid') || item.Status.name.toLowerCase().includes('completed')))
        .reduce((sum, item) => sum + (item.totalPrice || 0), 0);
      const committed = moduleItems
        .filter(item => item.Status && (item.Status.name.toLowerCase().includes('confirmed') || item.Status.name.toLowerCase().includes('committed')))
        .reduce((sum, item) => sum + (item.totalPrice || 0), 0);

      return {
        moduleType,
        moduleName: MODULE_DISPLAY_NAMES[moduleType],
        budget,
        spent,
        committed,
        remaining: budget - spent - committed,
        lineItemCount: moduleItems.length,
      };
    });

    // Group by category
    const categoryMap = new Map<string, { name: string; amount: number; count: number }>();
    lineItems.forEach(item => {
      if (item.Category) {
        const existing = categoryMap.get(item.categoryId || '') || { name: item.Category.name, amount: 0, count: 0 };
        categoryMap.set(item.categoryId || '', {
          name: item.Category.name,
          amount: existing.amount + (item.totalPrice || 0),
          count: existing.count + 1,
        });
      }
    });
    const byCategory = Array.from(categoryMap.entries()).map(([id, data]) => ({
      categoryId: id,
      categoryName: data.name,
      amount: data.amount,
      lineItemCount: data.count,
    }));

    // Group by status
    const statusMap = new Map<string, { name: string; amount: number; count: number }>();
    lineItems.forEach(item => {
      if (item.Status) {
        const existing = statusMap.get(item.statusId || '') || { name: item.Status.name, amount: 0, count: 0 };
        statusMap.set(item.statusId || '', {
          name: item.Status.name,
          amount: existing.amount + (item.totalPrice || 0),
          count: existing.count + 1,
        });
      }
    });
    const byStatus = Array.from(statusMap.entries()).map(([id, data]) => ({
      statusId: id,
      statusName: data.name,
      amount: data.amount,
      lineItemCount: data.count,
    }));

    const summary = {
      eventId,
      totalBudget,
      totalSpent,
      totalCommitted,
      remaining: totalBudget - totalSpent - totalCommitted,
      byModule,
      byCategory,
      byStatus,
    };

    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch finance summary' });
  }
});

// Get finance line items (detailed view)
financeRoutes.get('/:eventId/line-items', async (req, res) => {
  try {
    const lineItems = await prisma.lineItem.findMany({
      where: { eventId: req.params.eventId },
      include: {
        Status: true,
        Category: true,
        Tag: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const financeLineItems = lineItems.map(item => ({
      id: item.id,
      moduleType: item.moduleType,
      moduleName: MODULE_DISPLAY_NAMES[item.moduleType],
      lineItemName: item.name,
      categoryName: item.Category?.name,
      statusName: item.Status?.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice || 0,
      date: item.createdAt,
    }));

    res.json(financeLineItems);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch finance line items' });
  }
});


