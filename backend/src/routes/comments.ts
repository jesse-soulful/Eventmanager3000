import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { uuidSchema, createCommentSchema, updateCommentSchema } from '../validation/schemas';

export const commentRoutes = Router();

// Get all comments for a line item
commentRoutes.get('/line-item/:lineItemId', requireAuth, validate({
  params: z.object({ lineItemId: uuidSchema }),
}), async (req, res) => {
  try {
    const { lineItemId } = req.params;
    const comments = await prisma.comment.findMany({
      where: { lineItemId },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(comments);
  } catch (error: any) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Create a comment
commentRoutes.post('/', requireAuth, validate({ body: createCommentSchema }), async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

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
        userId: req.user.id,
        content: content.trim(),
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    res.status(201).json(comment);
  } catch (error: any) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

// Update a comment (only by owner)
commentRoutes.put('/:id', requireAuth, validate({
  params: z.object({ id: uuidSchema }),
  body: updateCommentSchema,
}), async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'content is required' });
    }

    // Check if comment exists and user owns it
    const existingComment = await prisma.comment.findUnique({
      where: { id },
    });

    if (!existingComment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Verify ownership (or allow admins to edit any comment)
    if (existingComment.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden - You can only edit your own comments' });
    }

    const comment = await prisma.comment.update({
      where: { id },
      data: {
        content: content.trim(),
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    res.json(comment);
  } catch (error: any) {
    console.error('Error updating comment:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Comment not found' });
    }
    res.status(500).json({ error: 'Failed to update comment' });
  }
});

// Delete a comment (only by owner or admin)
commentRoutes.delete('/:id', requireAuth, validate({
  params: z.object({ id: uuidSchema }),
}), async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    // Check if comment exists and user owns it
    const existingComment = await prisma.comment.findUnique({
      where: { id },
    });

    if (!existingComment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Verify ownership (or allow admins to delete any comment)
    if (existingComment.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden - You can only delete your own comments' });
    }

    await prisma.comment.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting comment:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Comment not found' });
    }
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});



