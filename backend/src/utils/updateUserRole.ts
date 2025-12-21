import { prisma } from '../lib/prisma';

/**
 * Script to update a user's role
 * Usage: tsx src/utils/updateUserRole.ts <email> <role>
 * Example: tsx src/utils/updateUserRole.ts jesse@soulfulsessions.be ADMIN
 * Valid roles: USER, ADMIN, VIEWER
 */
async function updateUserRole() {
  const email = process.argv[2];
  const role = process.argv[3]?.toUpperCase();

  if (!email || !role) {
    console.error('❌ Usage: tsx src/utils/updateUserRole.ts <email> <role>');
    console.error('Example: tsx src/utils/updateUserRole.ts jesse@soulfulsessions.be ADMIN');
    console.error('Valid roles: USER, ADMIN, VIEWER');
    process.exit(1);
  }

  const validRoles = ['USER', 'ADMIN', 'VIEWER'];
  if (!validRoles.includes(role)) {
    console.error(`❌ Invalid role: ${role}`);
    console.error(`Valid roles: ${validRoles.join(', ')}`);
    process.exit(1);
  }

  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      console.error(`❌ User with email ${email} not found`);
      process.exit(1);
    }

    // Update role
    const updatedUser = await prisma.user.update({
      where: { email: email.toLowerCase().trim() },
      data: { role },
    });

    console.log('✅ User role updated successfully!');
    console.log(`Email: ${updatedUser.email}`);
    console.log(`Name: ${updatedUser.name || 'N/A'}`);
    console.log(`Role: ${updatedUser.role}`);
  } catch (error: any) {
    console.error('❌ Failed to update user role:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

updateUserRole();

