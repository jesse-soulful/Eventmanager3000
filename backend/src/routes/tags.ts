import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { ModuleType } from '@event-management/shared';

export const tagRoutes = Router();

// Get tags for a module type in an event
tagRoutes.get('/:eventId/:moduleType', async (req, res) => {
  try {
    const tags = await prisma.tag.findMany({
      where: {
        eventId: req.params.eventId,
        moduleType: req.params.moduleType as ModuleType,
      },
      orderBy: { name: 'asc' },
    });
    res.json(tags);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

// Create tag
tagRoutes.post('/', async (req, res) => {
  try {
    const { eventId, moduleType, name, color } = req.body;
    const tag = await prisma.tag.create({
      data: {
        eventId,
        moduleType: moduleType as ModuleType,
        name,
        color,
      },
    });
    res.status(201).json(tag);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create tag' });
  }
});

// Update tag
tagRoutes.put('/:id', async (req, res) => {
  try {
    const { name, color } = req.body;
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (color !== undefined) updateData.color = color;

    const tag = await prisma.tag.update({
      where: { id: req.params.id },
      data: updateData,
    });
    res.json(tag);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update tag' });
  }
});

// Delete tag
tagRoutes.delete('/:id', async (req, res) => {
  try {
    await prisma.tag.delete({
      where: { id: req.params.id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete tag' });
  }
});


