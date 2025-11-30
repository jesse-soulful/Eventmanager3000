import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { ModuleType } from '@event-management/shared';

export const categoryRoutes = Router();

// Get categories for a module type (global metadata)
categoryRoutes.get('/:moduleType', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: {
        eventId: null, // Only return global metadata
        moduleType: req.params.moduleType as ModuleType,
      },
      orderBy: { name: 'asc' },
    });
    res.json(categories);
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories', details: error?.message });
  }
});

// Create category
categoryRoutes.post('/', async (req, res) => {
  try {
    const { eventId, moduleType, name, description, color } = req.body;
    
    // Metadata is now global - eventId is optional
    let validatedEventId: string | null = null;
    if (eventId) {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
      });
      if (!event) {
        return res.status(404).json({ error: `Event with id ${eventId} not found` });
      }
      validatedEventId = eventId;
    }
    
    // Check if category already exists (global)
    const existing = await prisma.category.findFirst({
      where: {
        eventId: null,
        moduleType: moduleType as ModuleType,
        name,
      },
    });
    
    if (existing) {
      return res.status(409).json({ error: 'Category with this name already exists' });
    }
    
    const category = await prisma.category.create({
      data: {
        eventId: validatedEventId, // null for global metadata
        moduleType: moduleType as ModuleType,
        name,
        description,
        color,
      },
    });
    res.status(201).json(category);
  } catch (error: any) {
    console.error('Error creating category:', error);
    console.error('Error details:', {
      code: error?.code,
      message: error?.message,
      meta: error?.meta,
      stack: error?.stack,
    });
    if (error.code === 'P2002') {
      return res.status(409).json({ 
        error: 'Category with this name already exists', 
        details: error?.meta?.target || 'Unique constraint violation'
      });
    }
    res.status(500).json({ 
      error: 'Failed to create category', 
      details: error?.message || 'Unknown error',
      code: error?.code,
    });
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


