import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { ModuleType } from '@event-management/shared';

export const lineItemRoutes = Router();

// Helper to parse metadata
const parseMetadata = (item: any) => {
  if (!item) return item;
  
  // Create a copy to avoid mutating the original
  const parsed = { ...item };
  
  if (parsed.metadata && typeof parsed.metadata === 'string') {
    try {
      parsed.metadata = JSON.parse(parsed.metadata);
    } catch {
      parsed.metadata = {};
    }
  }
  
  // Map main item relations (Prisma uses capitalized names)
  if (parsed.Status) parsed.status = parsed.Status;
  if (parsed.Category) parsed.category = parsed.Category;
  // Tag is always an array from Prisma
  if (parsed.Tag) {
    parsed.tags = Array.isArray(parsed.Tag) ? parsed.Tag : (parsed.Tag ? [parsed.Tag] : []);
  } else {
    parsed.tags = [];
  }
  
  // Handle sub-line items (Prisma uses other_LineItem)
  if (parsed.other_LineItem && Array.isArray(parsed.other_LineItem)) {
    parsed.subLineItems = parsed.other_LineItem.map((subItem: any) => {
      const parsedSub = parseMetadata(subItem);
      // Map sub-item relations
      if (parsedSub.Status) parsedSub.status = parsedSub.Status;
      if (parsedSub.Category) parsedSub.category = parsedSub.Category;
      // Tag is always an array from Prisma
      if (parsedSub.Tag) {
        parsedSub.tags = Array.isArray(parsedSub.Tag) ? parsedSub.Tag : (parsedSub.Tag ? [parsedSub.Tag] : []);
      } else {
        parsedSub.tags = [];
      }
      return parsedSub;
    });
  } else if (parsed.subLineItems && Array.isArray(parsed.subLineItems)) {
    // Fallback: if subLineItems already exists, parse it recursively
    parsed.subLineItems = parsed.subLineItems.map(parseMetadata);
  } else {
    parsed.subLineItems = [];
  }
  
  return parsed;
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
        Status: true,
        Category: true,
        Tag: true,
        LineItem: {
          include: {
            Status: true,
            Category: true,
          },
        },
        other_LineItem: {
          include: {
            Status: true,
            Category: true,
            Tag: true,
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

    // Validate required fields
    if (!moduleType) {
      return res.status(400).json({ error: 'moduleType is required' });
    }
    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }
    if (!eventId) {
      return res.status(400).json({ error: 'eventId is required' });
    }

    const totalPrice = quantity && unitPrice ? quantity * unitPrice : (plannedCost || null);

    // If no statusId provided, try to find default status, but allow null
    // Statuses are now global (eventId is optional)
    // Determine itemType: 'sub' if parentLineItemId exists, otherwise 'main'
    const itemType = parentLineItemId ? 'sub' : 'main';
    let finalStatusId = statusId || null;
    if (!finalStatusId) {
      const defaultStatus = await prisma.status.findFirst({
        where: {
          moduleType: moduleType as ModuleType,
          itemType: itemType, // Use 'sub' for sub-line items, 'main' for main items
          isDefault: true,
        },
      });
      if (defaultStatus) {
        finalStatusId = defaultStatus.id;
      } else {
        // If no default status, get the first status for this module and itemType
        const firstStatus = await prisma.status.findFirst({
          where: {
            moduleType: moduleType as ModuleType,
            itemType: itemType,
          },
          orderBy: { order: 'asc' },
        });
        if (firstStatus) {
          finalStatusId = firstStatus.id;
        }
        // If no status found, allow null (status is optional)
      }
    }

    const createData: any = {
      moduleType: moduleType as ModuleType,
      eventId,
      name,
      description: description || null,
      quantity: quantity || null,
      unitPrice: unitPrice || null,
      totalPrice: totalPrice || null,
      plannedCost: plannedCost || null,
      actualCost: actualCost || null,
      statusId: finalStatusId || null,
      categoryId: categoryId || null,
      parentLineItemId: parentLineItemId || null,
      metadata: metadata ? JSON.stringify(metadata) : null,
    };
    
    // Only add Tag relation if tagIds are provided
    if (tagIds && tagIds.length > 0) {
      createData.Tag = { connect: tagIds.map((id: string) => ({ id })) };
    }
    
    const lineItem = await prisma.lineItem.create({
      data: createData,
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
        },
      },
    });

    // If this is a sub-line item, recalculate parent totals
    // Preserve parent's planned cost if it was manually set (for artists with initial budget)
    if (parentLineItemId) {
      await recalculateParentTotals(parentLineItemId, true);
    }

    res.status(201).json(parseMetadata(lineItem));
  } catch (error: any) {
    console.error('❌ Error creating line item:', error);
    console.error('❌ Error details:', {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
    });
    res.status(500).json({ error: 'Failed to create line item', details: error?.message });
  }
});

// Update line item
lineItemRoutes.put('/:id', async (req, res) => {
  try {
    console.log('🔵 Update request received:', {
      id: req.params.id,
      body: req.body,
    });
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
      // Statuses are now global (eventId is optional)
      if (!statusId) {
        const defaultStatus = await prisma.status.findFirst({
          where: {
            moduleType: current.moduleType as ModuleType,
            itemType: current.parentLineItemId ? 'sub' : 'main', // Determine itemType based on whether it's a sub-item
            isDefault: true,
          },
        });
        if (defaultStatus) {
          updateData.statusId = defaultStatus.id;
        } else {
          const firstStatus = await prisma.status.findFirst({
            where: {
              moduleType: current.moduleType as ModuleType,
              itemType: current.parentLineItemId ? 'sub' : 'main',
            },
            orderBy: { order: 'asc' },
          });
          if (firstStatus) {
            updateData.statusId = firstStatus.id;
          } else {
            // If no status found, set to null (status is optional)
            updateData.statusId = null;
          }
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
          Tag: {
            set: tagIds.map((id: string) => ({ id })),
          },
        },
      });
    }

    const lineItem = await prisma.lineItem.update({
      where: { id: req.params.id },
      data: updateData,
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
        },
      },
    });

    // If this is a sub-line item, recalculate parent totals
    // Preserve parent's planned cost if it was manually set (for artists with initial budget)
    if (current.parentLineItemId) {
      await recalculateParentTotals(current.parentLineItemId, true);
    }

    const parsed = parseMetadata(lineItem);
    console.log('🔵 Update successful, parsed response:', {
      id: parsed.id,
      name: parsed.name,
      hasStatus: !!parsed.status,
      hasCategory: !!parsed.category,
      tagsLength: parsed.tags?.length || 0,
      subLineItemsLength: parsed.subLineItems?.length || 0,
    });
    res.json(parsed);
  } catch (error: any) {
    console.error('❌ Error updating line item:', error);
    console.error('❌ Error details:', {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack?.split('\n').slice(0, 5),
    });
    res.status(500).json({ error: 'Failed to update line item', details: error?.message });
  }
});

// Delete line item
lineItemRoutes.delete('/:id', async (req, res) => {
  try {
    const lineItem = await prisma.lineItem.findUnique({
      where: { id: req.params.id },
      include: { other_LineItem: true },
    });

    if (!lineItem) {
      return res.status(404).json({ error: 'Line item not found' });
    }

    // Delete sub-line items first (cascade should handle this, but being explicit)
    if (lineItem.other_LineItem.length > 0) {
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

