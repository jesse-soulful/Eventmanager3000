import { Router } from 'express';
import { prisma } from '../lib/prisma';

export const commentRoutes = Router();

// Get all comments for a line item
commentRoutes.get('/line-item/:lineItemId', async (req, res) => {
  try {
    const { lineItemId } = req.params;
    const comments = await prisma.comment.findMany({
      where: { lineItemId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(comments);
  } catch (error: any) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments', details: error?.message });
  }
});

// Create a comment
commentRoutes.post('/', async (req, res) => {
  try {
    const { lineItemId, content } = req.body;
    
    if (!lineItemId || !content || !content.trim()) {
      return res.status(400).json({ error: 'lineItemId and content are required' });
    }

    // Verify line item exists
    const lineItem = await prisma.lineItem.findUnique({
      where: { id: lineItemId },
    });

    if (!lineItem) {
      return res.status(404).json({ error: 'Line item not found' });
    }

    const comment = await prisma.comment.create({
      data: {
        lineItemId,
        content: content.trim(),
      },
    });

    res.status(201).json(comment);
  } catch (error: any) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Failed to create comment', details: error?.message });
  }
});

// Update a comment
commentRoutes.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'content is required' });
    }

    const comment = await prisma.comment.update({
      where: { id },
      data: {
        content: content.trim(),
      },
    });

    res.json(comment);
  } catch (error: any) {
    console.error('Error updating comment:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Comment not found' });
    }
    res.status(500).json({ error: 'Failed to update comment', details: error?.message });
  }
});

// Delete a comment
commentRoutes.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.comment.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting comment:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Comment not found' });
    }
    res.status(500).json({ error: 'Failed to delete comment', details: error?.message });
  }
});



