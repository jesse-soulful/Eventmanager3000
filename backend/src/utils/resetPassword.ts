import { prisma } from '../lib/prisma';

/**
 * Script to reset a user's password
 * Usage: tsx src/utils/resetPassword.ts <email> <newPassword>
 * Example: tsx src/utils/resetPassword.ts jesse@soulfulsessions.be newpassword123
 */
async function resetPassword() {
  const email = process.argv[2];
  const newPassword = process.argv[3];

  if (!email || !newPassword) {
    console.error('❌ Usage: tsx src/utils/resetPassword.ts <email> <newPassword>');
    console.error('Example: tsx src/utils/resetPassword.ts jesse@soulfulsessions.be newpassword123');
    process.exit(1);
  }

  if (newPassword.length < 8) {
    console.error('❌ Password must be at least 8 characters long');
    process.exit(1);
  }

  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
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

    // Hash the new password using bcrypt (same as better-auth uses)
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.default.hash(newPassword, 10);

    // Update the password
    await prisma.account.update({
      where: { id: user.accounts[0].id },
      data: {
        password: hashedPassword,
      },
    });

    console.log('✅ Password reset successfully!');
    console.log(`Email: ${email}`);
    console.log(`New password: ${newPassword}`);
    console.log('\n⚠️  Please change this password after logging in for security!');
  } catch (error: any) {
    console.error('❌ Failed to reset password:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();

