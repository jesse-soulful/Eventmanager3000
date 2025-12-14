import { prisma } from '../lib/prisma';
import { auth } from '../lib/auth';

/**
 * Script to create an admin user
 * Usage: tsx src/utils/createAdminUser.ts
 */
async function createAdminUser() {
  const email = process.env.ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD || 'admin123456';
  const name = process.env.ADMIN_NAME || 'Admin User';

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log(`User with email ${email} already exists.`);
      console.log('Updating role to ADMIN...');
      
      await prisma.user.update({
        where: { email },
        data: { role: 'ADMIN' },
      });
      
      console.log('✅ User role updated to ADMIN');
      return;
    }

    // Create user using betterAuth API
    const result = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      },
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    // Update role to ADMIN
    if (result.data?.user) {
      await prisma.user.update({
        where: { id: result.data.user.id },
        data: { role: 'ADMIN' },
      });
    }

    console.log('✅ Admin user created successfully!');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('\n⚠️  Please change the default password after first login!');
  } catch (error: any) {
    console.error('❌ Failed to create admin user:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();

