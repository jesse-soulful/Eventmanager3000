import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create a sample event
  const event = await prisma.event.create({
    data: {
      name: 'Summer Music Festival 2024',
      description: 'Annual summer music festival featuring local and international artists',
      startDate: new Date('2024-07-15'),
      endDate: new Date('2024-07-17'),
      location: 'Central Park',
      status: 'PLANNING',
    },
  });

  console.log(`✅ Created event: ${event.name}`);

  // Create default statuses for each module
  const moduleTypes = ['ARTISTS', 'VENDORS', 'MATERIALS', 'FOOD_BEVERAGE', 'SPONSORS', 'MARKETING'];
  const defaultStatuses = [
    { name: 'Draft', color: '#9CA3AF', order: 0, isDefault: true },
    { name: 'Pending', color: '#F59E0B', order: 1, isDefault: false },
    { name: 'Confirmed', color: '#10B981', order: 2, isDefault: false },
    { name: 'In Progress', color: '#3B82F6', order: 3, isDefault: false },
    { name: 'Completed', color: '#8B5CF6', order: 4, isDefault: false },
    { name: 'Cancelled', color: '#EF4444', order: 5, isDefault: false },
  ];

  for (const moduleType of moduleTypes) {
    for (const status of defaultStatuses) {
      await prisma.status.create({
        data: {
          eventId: event.id,
          moduleType,
          name: status.name,
          color: status.color,
          order: status.order,
          isDefault: status.isDefault,
        },
      });
    }
  }

  console.log(`✅ Created default statuses for all modules`);

  // Create sample categories for Artists module
  const artistCategories = ['Headliner', 'Support Act', 'Local Artist', 'International'];
  for (const category of artistCategories) {
    await prisma.category.create({
      data: {
        eventId: event.id,
        moduleType: 'ARTISTS',
        name: category,
        color: '#8B5CF6',
      },
    });
  }

  // Create sample categories for Vendors module
  const vendorCategories = ['Equipment', 'Security', 'Catering', 'Transportation'];
  for (const category of vendorCategories) {
    await prisma.category.create({
      data: {
        eventId: event.id,
        moduleType: 'VENDORS',
        name: category,
        color: '#3B82F6',
      },
    });
  }

  console.log(`✅ Created sample categories`);

  // Create sample tags
  const tags = ['VIP', 'Backstage', 'Priority', 'Urgent'];
  for (const tagName of tags) {
    for (const moduleType of moduleTypes) {
      await prisma.tag.create({
        data: {
          eventId: event.id,
          moduleType,
          name: tagName,
          color: '#6B7280',
        },
      });
    }
  }

  console.log(`✅ Created sample tags`);

  // Create default sub-line item types for Artists module
  const artistSubLineItemTypes = [
    { name: 'Artist Fee', description: 'Performance fee for the artist', isDefault: true, order: 0 },
    { name: 'Booking Fee', description: 'Fee paid to booking agent', isDefault: true, order: 1 },
    { name: 'Travel Fee', description: 'Airfare and travel costs', isDefault: true, order: 2 },
    { name: 'Ground Transportation', description: 'Local transportation costs', isDefault: true, order: 3 },
    { name: 'Hotel Costs', description: 'Accommodation expenses', isDefault: true, order: 4 },
    { name: 'Hospitality Rider', description: 'Food and beverage requirements', isDefault: true, order: 5 },
    { name: 'Technical Rider', description: 'Sound and lighting requirements', isDefault: true, order: 6 },
  ];

  for (const type of artistSubLineItemTypes) {
    await prisma.subLineItemType.create({
      data: {
        eventId: event.id,
        moduleType: 'ARTISTS',
        name: type.name,
        description: type.description,
        isDefault: type.isDefault,
        order: type.order,
      },
    });
  }

  console.log(`✅ Created default sub-line item types for Artists module`);

  console.log('✨ Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

