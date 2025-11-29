import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { ModuleType } from '@event-management/shared';

export const categoryRoutes = Router();

// Get categories for a module type in an event
categoryRoutes.get('/:eventId/:moduleType', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: {
        eventId: req.params.eventId,
        moduleType: req.params.moduleType as ModuleType,
      },
      orderBy: { name: 'asc' },
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Create category
categoryRoutes.post('/', async (req, res) => {
  try {
    const { eventId, moduleType, name, description, color } = req.body;
    const category = await prisma.category.create({
      data: {
        eventId,
        moduleType: moduleType as ModuleType,
        name,
        description,
        color,
      },
    });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Update category
categoryRoutes.put('/:id', async (req, res) => {
  try {
    const { name, description, color } = req.body;
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (color !== undefined) updateData.color = color;

    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: updateData,
    });
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Delete category
categoryRoutes.delete('/:id', async (req, res) => {
  try {
    await prisma.category.delete({
      where: { id: req.params.id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

