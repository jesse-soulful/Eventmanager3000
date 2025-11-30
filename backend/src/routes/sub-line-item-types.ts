import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { ModuleType } from '@event-management/shared';

export const subLineItemTypeRoutes = Router();

// Get sub-line item types for a module type (global metadata)
// Returns both global (eventId IS NULL) and event-specific ones for backward compatibility
subLineItemTypeRoutes.get('/:moduleType', async (req, res) => {
  try {
    const moduleTypeParam = req.params.moduleType.toUpperCase() as ModuleType;
    console.log('🔍 Fetching sub-line item types for module:', moduleTypeParam);
    
    const types = await prisma.subLineItemType.findMany({
      where: {
        moduleType: moduleTypeParam,
      },
      orderBy: [{ isDefault: 'desc' }, { order: 'asc' }, { name: 'asc' }],
    });
    
    console.log(`✅ Found ${types.length} sub-line item types for ${moduleTypeParam}`);
    res.json(types);
  } catch (error: any) {
    console.error('❌ Error fetching sub-line item types:', error);
    res.status(500).json({ error: 'Failed to fetch sub-line item types', details: error?.message });
  }
});

// Create sub-line item type
subLineItemTypeRoutes.post('/', async (req, res) => {
  try {
    const { eventId, moduleType, name, description, isDefault, order } = req.body;
    
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
    
    // Check if sub-line item type already exists (global)
    const existing = await prisma.subLineItemType.findFirst({
      where: {
        eventId: null,
        moduleType: moduleType as ModuleType,
        name,
      },
    });
    
    if (existing) {
      return res.status(409).json({ error: 'Sub-line item type with this name already exists' });
    }
    
    const type = await prisma.subLineItemType.create({
      data: {
        eventId: validatedEventId, // null for global metadata
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
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Sub-line item type with this name already exists' });
    }
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


