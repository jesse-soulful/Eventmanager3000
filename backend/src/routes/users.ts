import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAdmin } from '../middleware/rbac';
import { requireAuth } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { sanitizeFilename, getSafeFilePath, validateMimeType, IMAGE_MIME_TYPES } from '../utils/fileSecurity';
import { validate } from '../middleware/validation';
import { uuidSchema, updateProfileSchema, changePasswordSchema, updateUserSchema } from '../validation/schemas';

// Profile picture upload configuration
const profilesDir = path.join(process.cwd(), 'uploads', 'profiles');

const profilePictureUpload = multer({
  dest: profilesDir,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    // Check extension
    const allowedExtensions = /\.(jpg|jpeg|png|webp|gif)$/i;
    if (!allowedExtensions.test(file.originalname)) {
      return cb(new Error('Invalid file type. Only image files (JPG, PNG, WEBP, GIF) are allowed.'));
    }
    
    // Validate MIME type
    if (!validateMimeType(file.mimetype, IMAGE_MIME_TYPES)) {
      return cb(new Error('Invalid file MIME type. File content does not match extension.'));
    }
    
    cb(null, true);
  },
});

// Ensure profiles directory exists
if (!fs.existsSync(profilesDir)) {
  fs.mkdirSync(profilesDir, { recursive: true });
}

export const userRoutes = Router();

// Get all users (admin only)
userRoutes.get('/', requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        // Exclude password and sensitive data
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (error: any) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by ID (admin only)
userRoutes.get('/:id', requireAdmin, validate({
  params: z.object({ id: uuidSchema }),
}), async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error: any) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update own profile (authenticated users can update their name and image)
userRoutes.put('/profile', requireAuth, validate({ body: updateProfileSchema }), async (req, res) => {
  try {
    const { name, image } = req.body;
    
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name || null;
    if (image !== undefined) updateData.image = image || null;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    res.json(user);
  } catch (error: any) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Upload profile picture
userRoutes.post('/profile/picture', requireAuth, profilePictureUpload.single('picture'), async (req, res) => {
  try {
    const file = req.file;
    
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Get current user to check for existing picture
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { image: true },
    });

    // Delete old profile picture if exists
    if (currentUser?.image) {
      const oldFilename = path.basename(currentUser.image);
      const oldPath = path.join(profilesDir, oldFilename);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Create URL for the profile picture (relative to API)
    const pictureUrl = `/api/users/profile/picture/${file.filename}`;

    // Update user with picture URL
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { image: pictureUrl },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({ image: updatedUser.image });
  } catch (error: any) {
    console.error('Error uploading profile picture:', error);
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Failed to upload profile picture' });
  }
});

// Serve profile picture (public endpoint, but sanitized)
userRoutes.get('/profile/picture/:filename', async (req, res) => {
  try {
    // Sanitize filename to prevent path traversal
    const safeFilePath = getSafeFilePath(req.params.filename, profilesDir);
    if (!safeFilePath || !fs.existsSync(safeFilePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Determine content type from extension
    const sanitizedFilename = sanitizeFilename(req.params.filename);
    const ext = path.extname(sanitizedFilename).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
    };
    const contentType = mimeTypes[ext] || 'image/jpeg';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(sanitizedFilename)}"`);
    
    res.sendFile(path.resolve(safeFilePath));
  } catch (error: any) {
    console.error('Error serving profile picture:', error);
    res.status(500).json({ error: 'Failed to serve profile picture' });
  }
});

// Change password (authenticated users)
userRoutes.put('/profile/password', requireAuth, validate({ body: changePasswordSchema }), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long' });
    }

    // Get user with account info to verify current password
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        accounts: {
          where: {
            provider: 'credential',
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password using better-auth
    const { auth } = await import('../lib/auth');
    
    // Try to sign in with current password to verify it
    // Create a minimal request for password verification
    const authRequest = {
      headers: new Headers(),
    };

    // Verify current password by attempting sign in
    const signInResult = await auth.api.signInEmail({
      body: {
        email: req.user.email,
        password: currentPassword,
      },
      headers: authRequest.headers,
    });

    if (signInResult.error) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Update password using better-auth's password update
    // We need to update the account's password hash
    const account = user.accounts[0];
    if (!account) {
      return res.status(400).json({ error: 'No credential account found' });
    }

    // Use better-auth's password hashing
    const { hash } = await import('better-auth/utils');
    const hashedPassword = await hash(newPassword);

    await prisma.account.update({
      where: { id: account.id },
      data: {
        password: hashedPassword,
      },
    });

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error: any) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Update user (admin only)
userRoutes.put('/:id', requireAdmin, validate({
  params: z.object({ id: uuidSchema }),
  body: updateUserSchema,
}), async (req, res) => {
  try {
    const { name, role, emailVerified } = req.body;
    
    // Validate role if provided
    if (role && !['ADMIN', 'USER', 'VIEWER'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be ADMIN, USER, or VIEWER' });
    }

    // Prevent users from removing their own admin role
    if (req.user && req.user.id === req.params.id && role && role !== 'ADMIN' && req.user.role === 'ADMIN') {
      return res.status(400).json({ error: 'Cannot remove your own admin role' });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (role !== undefined) updateData.role = role;
    if (emailVerified !== undefined) updateData.emailVerified = emailVerified;

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    res.json(user);
  } catch (error: any) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user (admin only)
userRoutes.delete('/:id', requireAdmin, validate({
  params: z.object({ id: uuidSchema }),
}), async (req, res) => {
  try {
    const userId = req.params.id;

    // Prevent users from deleting themselves
    if (req.user && req.user.id === userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete user (sessions and accounts will be cascade deleted)
    await prisma.user.delete({
      where: { id: userId },
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

