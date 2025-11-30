import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { ModuleType } from '@event-management/shared';

export const tagRoutes = Router();

// Get tags for a module type (global metadata)
tagRoutes.get('/:moduleType', async (req, res) => {
  try {
    const tags = await prisma.tag.findMany({
      where: {
        eventId: null, // Only return global metadata
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
    
    // Check if tag already exists (global)
    const existing = await prisma.tag.findFirst({
      where: {
        eventId: null,
        moduleType: moduleType as ModuleType,
        name,
      },
    });
    
    if (existing) {
      return res.status(409).json({ error: 'Tag with this name already exists' });
    }
    
    const tag = await prisma.tag.create({
      data: {
        eventId: validatedEventId, // null for global metadata
        moduleType: moduleType as ModuleType,
        name,
        color,
      },
    });
    res.status(201).json(tag);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Tag with this name already exists' });
    }
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


