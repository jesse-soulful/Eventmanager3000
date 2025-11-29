import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { ModuleType } from '@event-management/shared';

export const subLineItemTypeRoutes = Router();

// Get sub-line item types for a module type in an event
subLineItemTypeRoutes.get('/:eventId/:moduleType', async (req, res) => {
  try {
    const types = await prisma.subLineItemType.findMany({
      where: {
        eventId: req.params.eventId,
        moduleType: req.params.moduleType as ModuleType,
      },
      orderBy: [{ isDefault: 'desc' }, { order: 'asc' }, { name: 'asc' }],
    });
    res.json(types);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sub-line item types' });
  }
});

// Create sub-line item type
subLineItemTypeRoutes.post('/', async (req, res) => {
  try {
    const { eventId, moduleType, name, description, isDefault, order } = req.body;
    const type = await prisma.subLineItemType.create({
      data: {
        eventId,
        moduleType: moduleType as ModuleType,
        name,
        description,
        isDefault: isDefault || false,
        order: order || 0,
      },
    });
    res.status(201).json(type);
  } catch (error: any) {
    console.error('Error creating sub-line item type:', error);
    res.status(500).json({ 
      error: 'Failed to create sub-line item type',
      details: error?.message 
    });
  }
});

// Update sub-line item type
subLineItemTypeRoutes.put('/:id', async (req, res) => {
  try {
    const { name, description, isDefault, order } = req.body;
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (isDefault !== undefined) updateData.isDefault = isDefault;
    if (order !== undefined) updateData.order = order;

    const type = await prisma.subLineItemType.update({
      where: { id: req.params.id },
      data: updateData,
    });
    res.json(type);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update sub-line item type' });
  }
});

// Delete sub-line item type
subLineItemTypeRoutes.delete('/:id', async (req, res) => {
  try {
    await prisma.subLineItemType.delete({
      where: { id: req.params.id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete sub-line item type' });
  }
});


