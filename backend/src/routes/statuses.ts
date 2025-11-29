import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { ModuleType } from '@event-management/shared';

export const statusRoutes = Router();

// Get statuses for a module type in an event
statusRoutes.get('/:eventId/:moduleType', async (req, res) => {
  try {
    const statuses = await prisma.status.findMany({
      where: {
        eventId: req.params.eventId,
        moduleType: req.params.moduleType as ModuleType,
      },
      orderBy: { order: 'asc' },
    });
    res.json(statuses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch statuses' });
  }
});

// Create status
statusRoutes.post('/', async (req, res) => {
  try {
    const { eventId, moduleType, name, color, order, isDefault } = req.body;
    const status = await prisma.status.create({
      data: {
        eventId,
        moduleType: moduleType as ModuleType,
        name,
        color: color || '#6B7280',
        order: order || 0,
        isDefault: isDefault || false,
      },
    });
    res.status(201).json(status);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create status' });
  }
});

// Update status
statusRoutes.put('/:id', async (req, res) => {
  try {
    const { name, color, order, isDefault } = req.body;
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (color !== undefined) updateData.color = color;
    if (order !== undefined) updateData.order = order;
    if (isDefault !== undefined) updateData.isDefault = isDefault;

    const status = await prisma.status.update({
      where: { id: req.params.id },
      data: updateData,
    });
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Delete status
statusRoutes.delete('/:id', async (req, res) => {
  try {
    await prisma.status.delete({
      where: { id: req.params.id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete status' });
  }
});

