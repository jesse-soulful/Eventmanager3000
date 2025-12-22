import { z } from 'zod';

/**
 * Common validation schemas
 */

// UUID validation
export const uuidSchema = z.string().uuid('Invalid ID format');

// Pagination
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

// User schemas
export const updateProfileSchema = z.object({
  name: z.string().min(1).max(255).nullable().optional(),
  image: z.string().url().nullable().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  role: z.enum(['ADMIN', 'USER', 'VIEWER']).optional(),
  emailVerified: z.boolean().optional(),
});

// Comment schemas
export const createCommentSchema = z.object({
  lineItemId: uuidSchema,
  content: z.string().min(1).max(5000, 'Comment too long'),
});

export const updateCommentSchema = z.object({
  content: z.string().min(1).max(5000, 'Comment too long'),
});

// Line item schemas
export const createLineItemSchema = z.object({
  moduleType: z.string().min(1),
  eventId: uuidSchema,
  name: z.string().min(1).max(255),
  description: z.string().max(5000).nullable().optional(),
  quantity: z.number().nonnegative().nullable().optional(),
  unitPrice: z.number().nonnegative().nullable().optional(),
  plannedCost: z.number().nullable().optional(),
  actualCost: z.number().nullable().optional(),
  statusId: uuidSchema.nullable().optional(),
  categoryId: uuidSchema.nullable().optional(),
  tagIds: z.array(uuidSchema).optional(),
  parentLineItemId: uuidSchema.nullable().optional(),
  metadata: z.record(z.any()).optional(),
});

export const updateLineItemSchema = createLineItemSchema.partial().extend({
  name: z.string().min(1).max(255).optional(),
});

// Event schemas
export const createEventSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(5000).nullable().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  location: z.string().max(255).nullable().optional(),
  eventLink: z.string().url().nullable().optional(),
  ticketshopLink: z.string().url().nullable().optional(),
  venueName: z.string().max(255).nullable().optional(),
  venueAddress: z.string().max(500).nullable().optional(),
  venueCapacity: z.coerce.number().int().positive().nullable().optional(),
  promotorName: z.string().max(255).nullable().optional(),
  promotorPhone: z.string().max(50).nullable().optional(),
  artistLiaisonName: z.string().max(255).nullable().optional(),
  artistLiaisonPhone: z.string().max(50).nullable().optional(),
  technicalName: z.string().max(255).nullable().optional(),
  technicalPhone: z.string().max(50).nullable().optional(),
  runningOrder: z.string().max(5000).nullable().optional(),
  bannerImageUrl: z.string().url().nullable().optional(),
  metadata: z.record(z.any()).optional(),
});

export const updateEventSchema = createEventSchema.partial();

// Status schemas
export const createStatusSchema = z.object({
  eventId: uuidSchema.nullable().optional(),
  moduleType: z.string().min(1),
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  order: z.number().int().optional(),
  isDefault: z.boolean().optional(),
  itemType: z.enum(['main', 'sub']),
});

export const updateStatusSchema = createStatusSchema.partial();

// Category schemas
export const createCategorySchema = z.object({
  eventId: uuidSchema.nullable().optional(),
  moduleType: z.string().min(1),
  name: z.string().min(1).max(100),
  description: z.string().max(500).nullable().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').nullable().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

// Tag schemas
export const createTagSchema = z.object({
  eventId: uuidSchema.nullable().optional(),
  moduleType: z.string().min(1),
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').nullable().optional(),
});

export const updateTagSchema = createTagSchema.partial();

// Finance query schemas
export const financeQuerySchema = z.object({
  eventIds: z.string().optional().transform((val) => 
    val ? val.split(',').map(id => id.trim()) : undefined
  ),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  moduleTypes: z.string().optional().transform((val) =>
    val ? val.split(',').map(type => type.trim()) : undefined
  ),
  includeSubItems: z.enum(['true', 'false']).optional().transform((val) => val === 'true'),
});




