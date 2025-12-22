import { prisma } from '../lib/prisma';
import crypto from 'crypto';

/**
 * Script to create a password reset token for a user
 * Usage: tsx src/utils/createResetToken.ts <email>
 * Example: tsx src/utils/createResetToken.ts jesse@soulfulsessions.be
 * 
 * This will create a reset token and display it so you can use it in the reset URL
 */
async function createResetToken() {
  const email = process.argv[2];

  if (!email) {
    console.error('❌ Usage: tsx src/utils/createResetToken.ts <email>');
    console.error('Example: tsx src/utils/createResetToken.ts jesse@soulfulsessions.be');
    process.exit(1);
  }

  try {
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

    if (!user) {
      console.error(`❌ User with email ${email} not found`);
      process.exit(1);
    }

    if (!user.accounts || user.accounts.length === 0) {
      console.error(`❌ No credential account found for user ${email}`);
      console.error('This user may have been created with a different authentication method.');
      process.exit(1);
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

    // Get frontend URL from environment or use default
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    console.log('\n✅ Password reset token created successfully!');
    console.log('\n📧 User:', email);
    console.log('🔑 Reset Token:', resetToken);
    console.log('\n🔗 Reset URL:');
    console.log(resetUrl);
    console.log('\n⏰ Token expires in 1 hour');
    console.log('\n💡 Copy the URL above and open it in your browser to reset the password.');
    console.log('   Or use the token with: tsx src/utils/resetPassword.ts <email> <newPassword>\n');
  } catch (error: any) {
    console.error('❌ Failed to create reset token:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createResetToken();


