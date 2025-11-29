import { Router } from 'express';
import { prisma } from '../lib/prisma';

export const eventRoutes = Router();

// Get all events
eventRoutes.get('/', async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      orderBy: { startDate: 'desc' },
    });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Get event by ID
eventRoutes.get('/:id', async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
      include: {
        lineItems: {
          include: {
            status: true,
            category: true,
            tags: true,
          },
        },
      },
    });
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// Create event
eventRoutes.post('/', async (req, res) => {
  try {
    const { name, description, startDate, endDate, location } = req.body;
    console.log('Creating event with data:', { name, description, startDate, endDate, location });
    const event = await prisma.event.create({
      data: {
        name,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        location,
        status: 'DRAFT',
      },
    });
    res.status(201).json(event);
  } catch (error: any) {
    console.error('Error creating event:', error);
    res.status(500).json({ 
      error: 'Failed to create event',
      details: error?.message || 'Unknown error'
    });
  }
});

// Update event
eventRoutes.put('/:id', async (req, res) => {
  try {
    const { name, description, startDate, endDate, location, status } = req.body;
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    if (location !== undefined) updateData.location = location;
    if (status !== undefined) updateData.status = status;

    const event = await prisma.event.update({
      where: { id: req.params.id },
      data: updateData,
    });
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// Delete event
eventRoutes.delete('/:id', async (req, res) => {
  try {
    await prisma.event.delete({
      where: { id: req.params.id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

