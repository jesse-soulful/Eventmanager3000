import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { validate } from '../middleware/validation';
import { sendPasswordResetEmail } from '../services/emailService';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export const passwordResetRoutes = Router();

const requestResetSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters long'),
});

/**
 * Request password reset - sends email with reset link
 * POST /api/password-reset/request
 */
passwordResetRoutes.post('/request', validate({ body: requestResetSchema }), async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        accounts: {
          where: {
            providerId: 'credential',
          },
        },
      },
    });

    // Always return success to prevent email enumeration
    // Don't reveal if email exists or not
    if (!user || !user.accounts.length) {
      // Still return success, but don't send email
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour

    // Delete any existing reset tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
        used: false,
      },
    });

    // Create new reset token
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt,
      },
    });

    // Send password reset email
    const isSmtpConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
    
    if (isSmtpConfigured) {
      try {
        await sendPasswordResetEmail(user.email, resetToken, user.name || undefined);
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
        // Don't fail the request if email fails (could be SMTP issue)
        // The token is still created, user can request again
      }
    } else {
      // Log the reset token and URL when SMTP is not configured
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
      console.log('\n📧 SMTP not configured - Password reset token generated:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`Email: ${user.email}`);
      console.log(`Token: ${resetToken}`);
      console.log(`Reset URL: ${resetUrl}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
      ...(isSmtpConfigured ? {} : {
        // Include token in response when SMTP is not configured (development only)
        token: resetToken,
        resetUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`,
        note: 'SMTP not configured. Check backend console or use this token.',
      }),
    });
  } catch (error: any) {
    console.error('Error requesting password reset:', error);
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    });
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
});

/**
 * Reset password with token
 * POST /api/password-reset/reset
 */
passwordResetRoutes.post('/reset', validate({ body: resetPasswordSchema }), async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Find valid reset token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: {
        user: {
          include: {
            accounts: {
              where: {
                providerId: 'credential',
              },
            },
          },
        },
      },
    });

    // Check if token exists, is not used, and not expired
    if (!resetToken) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    if (resetToken.used) {
      return res.status(400).json({ error: 'This reset token has already been used' });
    }

    if (new Date() > resetToken.expiresAt) {
      return res.status(400).json({ error: 'This reset token has expired. Please request a new one.' });
    }

    if (!resetToken.user.accounts.length) {
      return res.status(400).json({ error: 'No credential account found for this user' });
    }

    // Hash the new password using bcrypt (same as better-auth uses)
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and mark token as used
    await prisma.$transaction([
      prisma.account.update({
        where: { id: resetToken.user.accounts[0].id },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ]);

    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.',
    });
  } catch (error: any) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

/**
 * Verify reset token validity
 * GET /api/password-reset/verify?token=...
 */
passwordResetRoutes.get('/verify', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ valid: false, error: 'Token is required' });
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return res.json({ valid: false, error: 'Invalid token' });
    }

    if (resetToken.used) {
      return res.json({ valid: false, error: 'Token has already been used' });
    }

    if (new Date() > resetToken.expiresAt) {
      return res.json({ valid: false, error: 'Token has expired' });
    }

    res.json({ valid: true });
  } catch (error: any) {
    console.error('Error verifying reset token:', error);
    res.status(500).json({ valid: false, error: 'Failed to verify token' });
  }
});

