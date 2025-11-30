import { Router } from 'express';
import { prisma } from '../lib/prisma';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const bannerUpload = multer({
  dest: path.join(process.cwd(), 'uploads', 'banners'),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /\.(jpg|jpeg|png|webp|gif)$/i;
    if (allowedTypes.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only image files (JPG, PNG, WEBP, GIF) are allowed.'));
    }
  },
});

// Ensure banners directory exists
const bannersDir = path.join(process.cwd(), 'uploads', 'banners');
if (!fs.existsSync(bannersDir)) {
  fs.mkdirSync(bannersDir, { recursive: true });
}

export const eventRoutes = Router();

// Get all events
eventRoutes.get('/', async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      orderBy: { startDate: 'desc' },
    });
    res.json(events);
  } catch (error: any) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events', details: error?.message });
  }
});

// Get event by ID
eventRoutes.get('/:id', async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
      include: {
        LineItem: {
          include: {
            Status: true,
            Category: true,
            Tag: true,
          },
        },
      },
    });
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json(event);
  } catch (error: any) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: 'Failed to fetch event', details: error?.message });
  }
});

// Create event
eventRoutes.post('/', async (req, res) => {
  try {
    const { 
      name, 
      description, 
      startDate, 
      endDate, 
      location,
      venueName,
      venueAddress,
      venueCapacity,
      promotorName,
      promotorPhone,
      artistLiaisonName,
      artistLiaisonPhone,
      technicalName,
      technicalPhone,
      runningOrder,
      bannerImageUrl,
    } = req.body;
    console.log('Creating event with data:', { name, description, startDate, endDate, location });
    const event = await prisma.event.create({
      data: {
        name,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        location,
        venueName,
        venueAddress,
        venueCapacity: venueCapacity ? parseInt(venueCapacity) : null,
        promotorName,
        promotorPhone,
        artistLiaisonName,
        artistLiaisonPhone,
        technicalName,
        technicalPhone,
        runningOrder,
        bannerImageUrl,
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
    const { 
      name, 
      description, 
      startDate, 
      endDate, 
      location, 
      status,
      venueName,
      venueAddress,
      venueCapacity,
      promotorName,
      promotorPhone,
      artistLiaisonName,
      artistLiaisonPhone,
      technicalName,
      technicalPhone,
      runningOrder,
      bannerImageUrl,
    } = req.body;
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    if (location !== undefined) updateData.location = location;
    if (status !== undefined) updateData.status = status;
    if (venueName !== undefined) updateData.venueName = venueName;
    if (venueAddress !== undefined) updateData.venueAddress = venueAddress;
    if (venueCapacity !== undefined) updateData.venueCapacity = venueCapacity ? parseInt(venueCapacity) : null;
    if (promotorName !== undefined) updateData.promotorName = promotorName;
    if (promotorPhone !== undefined) updateData.promotorPhone = promotorPhone;
    if (artistLiaisonName !== undefined) updateData.artistLiaisonName = artistLiaisonName;
    if (artistLiaisonPhone !== undefined) updateData.artistLiaisonPhone = artistLiaisonPhone;
    if (technicalName !== undefined) updateData.technicalName = technicalName;
    if (technicalPhone !== undefined) updateData.technicalPhone = technicalPhone;
    if (runningOrder !== undefined) updateData.runningOrder = runningOrder;
    if (bannerImageUrl !== undefined) updateData.bannerImageUrl = bannerImageUrl;

    const event = await prisma.event.update({
      where: { id: req.params.id },
      data: updateData,
    });
    res.json(event);
  } catch (error: any) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Failed to update event', details: error?.message });
  }
});

// Upload banner image for event
eventRoutes.post('/:id/banner', bannerUpload.single('banner'), async (req, res) => {
  try {
    const { id } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      // Clean up uploaded file
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      return res.status(404).json({ error: 'Event not found' });
    }

    // Delete old banner if exists
    if (event.bannerImageUrl) {
      const oldFilename = path.basename(event.bannerImageUrl);
      const oldPath = path.join(bannersDir, oldFilename);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Create URL for the banner (relative to API)
    const bannerUrl = `/api/events/${id}/banner/${file.filename}`;

    // Update event with banner URL
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        bannerImageUrl: bannerUrl,
      },
    });

    res.json({ bannerImageUrl: updatedEvent.bannerImageUrl });
  } catch (error: any) {
    console.error('Error uploading banner:', error);
    res.status(500).json({ error: 'Failed to upload banner', details: error?.message });
  }
});

// Serve banner image
eventRoutes.get('/:id/banner/:filename', async (req, res) => {
  try {
    const filePath = path.join(bannersDir, req.params.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Banner not found' });
    }

    // Determine content type from extension
    const ext = path.extname(req.params.filename).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
    };
    const contentType = mimeTypes[ext] || 'image/jpeg';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.sendFile(path.resolve(filePath));
  } catch (error: any) {
    console.error('Error serving banner:', error);
    res.status(500).json({ error: 'Failed to serve banner' });
  }
});

// Delete banner
eventRoutes.delete('/:id/banner', async (req, res) => {
  try {
    const { id } = req.params;
    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (event.bannerImageUrl) {
      const filename = path.basename(event.bannerImageUrl);
      const filePath = path.join(bannersDir, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await prisma.event.update({
      where: { id },
      data: {
        bannerImageUrl: null,
      },
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting banner:', error);
    res.status(500).json({ error: 'Failed to delete banner', details: error?.message });
  }
});

// Delete event
eventRoutes.delete('/:id', async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
    });

    if (event) {
      // Delete banner if exists
      if (event.bannerImageUrl) {
        const filename = path.basename(event.bannerImageUrl);
        const filePath = path.join(bannersDir, filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }

    await prisma.event.delete({
      where: { id: req.params.id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

