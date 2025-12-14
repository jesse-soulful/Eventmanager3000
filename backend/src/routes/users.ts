import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAdmin } from '../middleware/rbac';
import { requireAuth } from '../middleware/auth';

export const userRoutes = Router();

// Get all users (admin only)
userRoutes.get('/', requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
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
    res.status(500).json({ error: 'Failed to fetch users', details: error?.message });
  }
});

// Get user by ID (admin only)
userRoutes.get('/:id', requireAdmin, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        name: true,
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
    res.status(500).json({ error: 'Failed to fetch user', details: error?.message });
  }
});

// Update own profile (authenticated users can update their name)
userRoutes.put('/profile', requireAuth, async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name || null;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    res.json(user);
  } catch (error: any) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile', details: error?.message });
  }
});

// Change password (authenticated users)
userRoutes.put('/profile/password', requireAuth, async (req, res) => {
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
    res.status(500).json({ error: 'Failed to change password', details: error?.message });
  }
});

// Update user (admin only)
userRoutes.put('/:id', requireAdmin, async (req, res) => {
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
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    res.json(user);
  } catch (error: any) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user', details: error?.message });
  }
});

// Delete user (admin only)
userRoutes.delete('/:id', requireAdmin, async (req, res) => {
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
    res.status(500).json({ error: 'Failed to delete user', details: error?.message });
  }
});

