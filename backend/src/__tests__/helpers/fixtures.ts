import { ModuleType } from '@event-management/shared';
import { testPrisma } from '../setup';

/**
 * Create a test event
 */
export async function createTestEvent(data?: Partial<any>) {
  return await testPrisma.event.create({
    data: {
      name: data?.name || 'Test Event',
      description: data?.description || 'Test Description',
      startDate: data?.startDate || new Date('2024-01-01'),
      endDate: data?.endDate || new Date('2024-01-02'),
      location: data?.location || 'Test Location',
      status: data?.status || 'DRAFT',
    },
  });
}

/**
 * Create a test user
 */
export async function createTestUser(data?: Partial<any>) {
  return await testPrisma.user.create({
    data: {
      email: data?.email || 'test@example.com',
      name: data?.name || 'Test User',
      role: data?.role || 'ADMIN',
      emailVerified: data?.emailVerified || true,
    },
  });
}

/**
 * Create a test status
 */
export async function createTestStatus(moduleType: ModuleType, data?: Partial<any>) {
  return await testPrisma.status.create({
    data: {
      moduleType,
      name: data?.name || 'Test Status',
      color: data?.color || '#6B7280',
      order: data?.order || 0,
      isDefault: data?.isDefault || false,
      itemType: data?.itemType || 'main',
      eventId: null, // Global metadata
    },
  });
}

/**
 * Create a test category
 */
export async function createTestCategory(moduleType: ModuleType, data?: Partial<any>) {
  return await testPrisma.category.create({
    data: {
      moduleType,
      name: data?.name || 'Test Category',
      description: data?.description || 'Test Description',
      color: data?.color || '#3B82F6',
      eventId: null, // Global metadata
    },
  });
}

/**
 * Create a test tag
 */
export async function createTestTag(moduleType: ModuleType, data?: Partial<any>) {
  return await testPrisma.tag.create({
    data: {
      moduleType,
      name: data?.name || 'Test Tag',
      color: data?.color || '#10B981',
      eventId: null, // Global metadata
    },
  });
}

/**
 * Create a test sub-line item type
 */
export async function createTestSubLineItemType(moduleType: ModuleType, data?: Partial<any>) {
  return await testPrisma.subLineItemType.create({
    data: {
      moduleType,
      name: data?.name || 'Test Sub-Line Item Type',
      description: data?.description || 'Test Description',
      isDefault: data?.isDefault || false,
      order: data?.order || 0,
      categoryId: data?.categoryId || null,
      eventId: null, // Global metadata
    },
  });
}

/**
 * Create a test line item (artist)
 */
export async function createTestLineItem(eventId: string, moduleType: ModuleType, data?: Partial<any>) {
  return await testPrisma.lineItem.create({
    data: {
      eventId,
      moduleType,
      name: data?.name || 'Test Artist',
      plannedCost: data?.plannedCost || 1000,
      actualCost: data?.actualCost || null,
      totalPrice: data?.totalPrice || null,
      statusId: data?.statusId || null,
      categoryId: data?.categoryId || null,
      parentLineItemId: data?.parentLineItemId || null,
      metadata: data?.metadata ? JSON.stringify(data.metadata) : null,
    },
  });
}

