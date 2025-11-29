import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { ModuleType } from '@event-management/shared';

export const lineItemRoutes = Router();

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

// Helper to recalculate parent totals from sub-line items
async function recalculateParentTotals(parentId: string, preservePlannedCost: boolean = false) {
  const parent = await prisma.lineItem.findUnique({
    where: { id: parentId },
  });

  if (!parent) return;

  const subItems = await prisma.lineItem.findMany({
    where: { parentLineItemId: parentId },
  });

  const plannedTotal = subItems.reduce((sum, item) => sum + (item.plannedCost || 0), 0);
  const actualTotal = subItems.reduce((sum, item) => sum + (item.actualCost || 0), 0);
  const totalPrice = subItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

  const updateData: any = {
    actualCost: actualTotal || null,
    totalPrice: totalPrice || null,
  };

  if (preservePlannedCost && parent.plannedCost && parent.plannedCost > 0) {
    // Preserve the parent's manually set planned cost (budget limit)
    // Don't overwrite it with the sum of sub-items
    // The parent's planned cost serves as the budget target
    updateData.plannedCost = parent.plannedCost;
  } else {
    // Normal behavior: update planned cost from sub-items sum
    updateData.plannedCost = plannedTotal || null;
  }

  await prisma.lineItem.update({
    where: { id: parentId },
    data: updateData,
  });
}

// Get all line items for an event
lineItemRoutes.get('/event/:eventId', async (req, res) => {
  try {
    const lineItems = await prisma.lineItem.findMany({
      where: { 
        eventId: req.params.eventId,
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
    res.status(500).json({ error: 'Failed to fetch line items' });
  }
});

// Get line item by ID
lineItemRoutes.get('/:id', async (req, res) => {
  try {
    const lineItem = await prisma.lineItem.findUnique({
      where: { id: req.params.id },
      include: {
        status: true,
        category: true,
        tags: true,
        parentLineItem: {
          include: {
            status: true,
            category: true,
          },
        },
        subLineItems: {
          include: {
            status: true,
            category: true,
            tags: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!lineItem) {
      return res.status(404).json({ error: 'Line item not found' });
    }
    res.json(parseMetadata(lineItem));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch line item' });
  }
});

// Create line item
lineItemRoutes.post('/', async (req, res) => {
  try {
    const {
      moduleType,
      eventId,
      name,
      description,
      quantity,
      unitPrice,
      plannedCost,
      actualCost,
      statusId,
      categoryId,
      tagIds,
      parentLineItemId,
      metadata,
    } = req.body;

    const totalPrice = quantity && unitPrice ? quantity * unitPrice : (plannedCost || null);

    // If no statusId provided, try to find default status, but allow null
    let finalStatusId = statusId || null;
    if (!finalStatusId) {
      const defaultStatus = await prisma.status.findFirst({
        where: {
          eventId,
          moduleType: moduleType as ModuleType,
          isDefault: true,
        },
      });
      if (defaultStatus) {
        finalStatusId = defaultStatus.id;
      } else {
        // If no default status, get the first status for this module
        const firstStatus = await prisma.status.findFirst({
          where: {
            eventId,
            moduleType: moduleType as ModuleType,
          },
          orderBy: { order: 'asc' },
        });
        if (firstStatus) {
          finalStatusId = firstStatus.id;
        }
        // If no status found, allow null (status is optional)
      }
    }

    const lineItem = await prisma.lineItem.create({
      data: {
        moduleType: moduleType as ModuleType,
        eventId,
        name,
        description,
        quantity,
        unitPrice,
        totalPrice,
        plannedCost: plannedCost || null,
        actualCost: actualCost || null,
        statusId: finalStatusId || null,
        categoryId: categoryId || null,
        parentLineItemId: parentLineItemId || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
        tags: tagIds ? { connect: tagIds.map((id: string) => ({ id })) } : undefined,
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
        },
      },
    });

    // If this is a sub-line item, recalculate parent totals
    // Preserve parent's planned cost if it was manually set (for artists with initial budget)
    if (parentLineItemId) {
      await recalculateParentTotals(parentLineItemId, true);
    }

    res.status(201).json(parseMetadata(lineItem));
  } catch (error) {
    res.status(500).json({ error: 'Failed to create line item' });
  }
});

// Update line item
lineItemRoutes.put('/:id', async (req, res) => {
  try {
    const {
      name,
      description,
      quantity,
      unitPrice,
      plannedCost,
      actualCost,
      statusId,
      categoryId,
      tagIds,
      parentLineItemId,
      metadata,
    } = req.body;

    const current = await prisma.lineItem.findUnique({ where: { id: req.params.id } });
    if (!current) {
      return res.status(404).json({ error: 'Line item not found' });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (quantity !== undefined) updateData.quantity = quantity;
    if (unitPrice !== undefined) updateData.unitPrice = unitPrice;
    if (plannedCost !== undefined) updateData.plannedCost = plannedCost || null;
    if (actualCost !== undefined) updateData.actualCost = actualCost || null;
    if (statusId !== undefined) {
      // If statusId is empty string, find default status
      if (!statusId) {
        const defaultStatus = await prisma.status.findFirst({
          where: {
            eventId: current.eventId,
            moduleType: current.moduleType as ModuleType,
            isDefault: true,
          },
        });
        if (defaultStatus) {
          updateData.statusId = defaultStatus.id;
        } else {
          const firstStatus = await prisma.status.findFirst({
            where: {
              eventId: current.eventId,
              moduleType: current.moduleType as ModuleType,
            },
            orderBy: { order: 'asc' },
          });
          if (firstStatus) {
            updateData.statusId = firstStatus.id;
          }
          // If no status found, set to null (status is optional)
          updateData.statusId = null;
        }
      } else {
        updateData.statusId = statusId;
      }
    }
    if (categoryId !== undefined) updateData.categoryId = categoryId || null;
    if (parentLineItemId !== undefined) updateData.parentLineItemId = parentLineItemId || null;
    if (metadata !== undefined) updateData.metadata = metadata ? JSON.stringify(metadata) : null;

    // Calculate totalPrice from quantity/unitPrice or use plannedCost
    if (quantity !== undefined || unitPrice !== undefined) {
      const qty = quantity !== undefined ? quantity : current.quantity;
      const price = unitPrice !== undefined ? unitPrice : current.unitPrice;
      updateData.totalPrice = qty && price ? qty * price : (plannedCost !== undefined ? plannedCost : current.totalPrice);
    } else if (plannedCost !== undefined) {
      updateData.totalPrice = plannedCost;
    }

    if (tagIds !== undefined) {
      await prisma.lineItem.update({
        where: { id: req.params.id },
        data: {
          tags: {
            set: tagIds.map((id: string) => ({ id })),
          },
        },
      });
    }

    const lineItem = await prisma.lineItem.update({
      where: { id: req.params.id },
      data: updateData,
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
        },
      },
    });

    // If this is a sub-line item, recalculate parent totals
    // Preserve parent's planned cost if it was manually set (for artists with initial budget)
    if (current.parentLineItemId) {
      await recalculateParentTotals(current.parentLineItemId, true);
    }

    res.json(parseMetadata(lineItem));
  } catch (error) {
    res.status(500).json({ error: 'Failed to update line item' });
  }
});

// Delete line item
lineItemRoutes.delete('/:id', async (req, res) => {
  try {
    const lineItem = await prisma.lineItem.findUnique({
      where: { id: req.params.id },
      include: { subLineItems: true },
    });

    if (!lineItem) {
      return res.status(404).json({ error: 'Line item not found' });
    }

    // Delete sub-line items first (cascade should handle this, but being explicit)
    if (lineItem.subLineItems.length > 0) {
      await prisma.lineItem.deleteMany({
        where: { parentLineItemId: req.params.id },
      });
    }

    const parentId = lineItem.parentLineItemId;

    await prisma.lineItem.delete({
      where: { id: req.params.id },
    });

    // Recalculate parent totals if this was a sub-line item
    // Preserve parent's planned cost if it was manually set (for artists with initial budget)
    if (parentId) {
      await recalculateParentTotals(parentId, true);
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete line item' });
  }
});

