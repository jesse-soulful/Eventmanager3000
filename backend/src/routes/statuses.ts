import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { ModuleType } from '@event-management/shared';

export const statusRoutes = Router();

// Get statuses for a module type (global metadata)
// Optional query param: ?itemType=main or ?itemType=sub
statusRoutes.get('/:moduleType', async (req, res) => {
  try {
    const { moduleType } = req.params;
    const itemType = req.query.itemType as string | undefined;
    
    const where: any = {
      moduleType: moduleType as ModuleType,
      eventId: null, // Only return global metadata (eventId is null)
    };
    
    // Filter by itemType if provided
    if (itemType === 'main' || itemType === 'sub') {
      where.itemType = itemType;
    }
    
    const statuses = await prisma.status.findMany({
      where,
      orderBy: { order: 'asc' },
      select: {
        id: true,
        moduleType: true,
        name: true,
        color: true,
        order: true,
        isDefault: true,
        itemType: true, // Explicitly select itemType
        createdAt: true,
        updatedAt: true,
        eventId: true,
      },
    });
    console.log(`📥 Returning ${statuses.length} global statuses for ${moduleType}${itemType ? `/${itemType}` : ''}`);
    res.json(statuses);
  } catch (error: any) {
    console.error('Error fetching statuses:', error);
    res.status(500).json({ error: 'Failed to fetch statuses', details: error?.message });
  }
});

// Track recent status creations to prevent duplicates
const recentCreations = new Map<string, number>();
const CREATION_WINDOW_MS = 5000; // 5 second window

// Create status
statusRoutes.post('/', async (req, res) => {
  let validatedEventId: string | null = null;
  try {
    const { eventId, moduleType, name, color, order, isDefault, itemType } = req.body;
    const requestId = `${moduleType}-${name}-${itemType}-${Date.now()}`;
    
    console.log('=== CREATING STATUS ===');
    console.log('Request ID:', requestId);
    console.log('Request body:', { eventId, moduleType, name, itemType, isDefault });
    
    // Metadata is now global - eventId is optional and can be null
    // If eventId is provided, validate it exists (for backward compatibility)
    validatedEventId = null;
    if (eventId) {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
      });
      if (!event) {
        console.error('❌ Event not found:', eventId);
        return res.status(404).json({ error: `Event with id ${eventId} not found` });
      }
      validatedEventId = eventId;
      console.log('✅ Event validated:', event.name);
    } else {
      console.log('✅ Creating global metadata (no eventId)');
    }
    
    // Validate itemType - must be explicitly 'main' or 'sub', no defaults
    console.log('🔍 Validating itemType:', itemType, 'type:', typeof itemType);
    if (!itemType) {
      console.error('❌ Missing itemType');
      return res.status(400).json({ error: 'itemType is required and must be either "main" or "sub"' });
    }
    if (itemType !== 'main' && itemType !== 'sub') {
      console.error('❌ Invalid itemType:', itemType, 'type:', typeof itemType);
      return res.status(400).json({ error: `itemType must be either "main" or "sub", got: ${itemType}` });
    }
    console.log('✅ itemType validated:', itemType);
    
    // Check for duplicate requests within time window
    const creationKey = `${moduleType}-${name}-${itemType}`;
    const lastCreation = recentCreations.get(creationKey);
    const now = Date.now();
    
    if (lastCreation && (now - lastCreation) < CREATION_WINDOW_MS) {
      console.warn('❌ BLOCKED: Duplicate request within 5 seconds:', creationKey);
      return res.status(429).json({ error: 'Duplicate request detected. Please wait a moment.' });
    }
    
    // Check if status with same name and itemType already exists (global - eventId is null)
    const existing = await prisma.status.findFirst({
      where: {
        eventId: null, // Global metadata
        moduleType: moduleType as ModuleType,
        itemType,
        name,
      },
    });
    
    if (existing) {
      console.warn('❌ Status already exists in DB:', existing.id);
      return res.status(409).json({ error: 'Status with this name and itemType already exists' });
    }
    
    // Record this creation attempt
    recentCreations.set(creationKey, now);
    
    // Create ONLY ONE status with the specified itemType
    console.log('🔴 About to create status with itemType:', itemType, 'type:', typeof itemType);
    
    // Ensure itemType is explicitly set (no undefined, no null)
    const finalItemType = itemType === 'sub' ? 'sub' : 'main';
    console.log('🔴 Final itemType to save:', finalItemType);
    
    const status = await prisma.status.create({
      data: {
        eventId: validatedEventId, // null for global metadata
        moduleType: moduleType as ModuleType,
        name,
        color: color || '#6B7280',
        order: order || 0,
        isDefault: isDefault || false,
        itemType: finalItemType, // Explicitly set - no defaults
      },
      select: {
        id: true,
        moduleType: true,
        name: true,
        color: true,
        order: true,
        isDefault: true,
        itemType: true, // Explicitly select itemType
        createdAt: true,
        updatedAt: true,
        eventId: true,
      },
    });
    
    console.log('✅ Created status:', status.id, status.name, 'itemType:', status.itemType);
    console.log('✅ Verifying created status itemType:', status.itemType);
    
    // Double-check: query the database to see what was actually created
    const verifyStatus = await prisma.status.findUnique({
      where: { id: status.id },
      select: { id: true, name: true, itemType: true },
    });
    console.log('✅ Database verification:', verifyStatus);
    
    // Check if ANY other status with same name but different itemType was created
    const otherItemType = finalItemType === 'main' ? 'sub' : 'main';
    const duplicateCheck = await prisma.status.findFirst({
      where: {
        eventId: null, // Global metadata
        moduleType: moduleType as ModuleType,
        name,
        itemType: otherItemType,
        createdAt: {
          gte: new Date(Date.now() - 5000), // Within last 5 seconds
        },
      },
    });
    
    if (duplicateCheck) {
      console.error('🚨 ALERT: Found duplicate status with different itemType!', duplicateCheck);
    }
    
    console.log('=== STATUS CREATION COMPLETE ===');
    console.log('📤 Sending response:', JSON.stringify(status, null, 2));
    console.log('📤 Response itemType:', status.itemType, 'type:', typeof status.itemType);
    
    // Clean up old entries from map
    setTimeout(() => {
      recentCreations.delete(creationKey);
    }, CREATION_WINDOW_MS);
    
    res.status(201).json(status);
  } catch (error: any) {
    console.error('❌ Error creating status:', error);
    if (error.code === 'P2002') {
      // Prisma unique constraint violation
      return res.status(409).json({ error: 'Status with this name and itemType already exists' });
    }
    if (error.code === 'P2003') {
      // Prisma foreign key constraint violation
      return res.status(404).json({ error: validatedEventId ? `Event with id ${validatedEventId} not found` : 'Invalid event reference' });
    }
    res.status(500).json({ error: 'Failed to create status', details: error?.message });
  }
});

// Update status
statusRoutes.put('/:id', async (req, res) => {
  try {
    const { name, color, order, isDefault, itemType } = req.body;
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (color !== undefined) updateData.color = color;
    if (order !== undefined) updateData.order = order;
    if (isDefault !== undefined) updateData.isDefault = isDefault;
    if (itemType !== undefined) updateData.itemType = itemType;

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


