import request from 'supertest';
import express from 'express';
import { statusRoutes } from '../../routes/statuses';
import { categoryRoutes } from '../../routes/categories';
import { tagRoutes } from '../../routes/tags';
import { subLineItemTypeRoutes } from '../../routes/sub-line-item-types';
import { mockRequireAuth } from '../helpers/auth';
import { testPrisma } from '../setup';
import { ModuleType } from '@event-management/shared';
import {
  createTestStatus,
  createTestCategory,
  createTestTag,
  createTestSubLineItemType,
} from '../helpers/fixtures';

const app = express();
app.use(express.json());
app.use('/api/statuses', mockRequireAuth, statusRoutes);
app.use('/api/categories', mockRequireAuth, categoryRoutes);
app.use('/api/tags', mockRequireAuth, tagRoutes);
app.use('/api/sub-line-item-types', mockRequireAuth, subLineItemTypeRoutes);

describe('Metadata Module - Statuses', () => {
  const moduleType = ModuleType.ARTISTS;

  beforeEach(async () => {
    // Clean up before each test with error handling
    try {
      await testPrisma.status.deleteMany({ where: { moduleType } });
    } catch (e: any) {
      // Ignore errors about missing tables
    }
  });

  describe('GET /api/statuses/:moduleType', () => {
    it('should fetch all statuses for a module', async () => {
      // Clean up first to ensure fresh state
      await testPrisma.status.deleteMany({ where: { moduleType } });
      
      const status1 = await createTestStatus(moduleType, { name: 'Draft', itemType: 'main' });
      const status2 = await createTestStatus(moduleType, { name: 'Confirmed', itemType: 'main' });

      const res = await request(app)
        .get(`/api/statuses/${moduleType}`)
        .expect(200);

      expect(res.body.length).toBeGreaterThanOrEqual(2);
      const statusNames = res.body.map((s: any) => s.name);
      expect(statusNames).toContain('Draft');
      expect(statusNames).toContain('Confirmed');
      expect(res.body[0]).toHaveProperty('name');
      expect(res.body[0]).toHaveProperty('itemType');
    });

    it('should filter by itemType when provided', async () => {
      // Clean up first
      await testPrisma.status.deleteMany({ where: { moduleType } });
      
      await createTestStatus(moduleType, { name: 'Main Status', itemType: 'main' });
      await createTestStatus(moduleType, { name: 'Sub Status', itemType: 'sub' });

      const res = await request(app)
        .get(`/api/statuses/${moduleType}?itemType=main`)
        .expect(200);

      expect(res.body.length).toBeGreaterThanOrEqual(1);
      const mainStatuses = res.body.filter((s: any) => s.itemType === 'main');
      expect(mainStatuses.length).toBeGreaterThanOrEqual(1);
      expect(mainStatuses[0].itemType).toBe('main');
    });

    it('should return empty array when no statuses exist', async () => {
      const res = await request(app)
        .get(`/api/statuses/${moduleType}`)
        .expect(200);

      expect(res.body).toEqual([]);
    });
  });

  describe('POST /api/statuses', () => {
    it('should create a new status', async () => {
      const res = await request(app)
        .post('/api/statuses')
        .send({
          moduleType,
          name: 'New Status',
          color: '#FF5733',
          order: 1,
          isDefault: false,
          itemType: 'main',
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('New Status');
      expect(res.body.itemType).toBe('main');
      expect(res.body.eventId).toBeNull();
    });

    it('should reject duplicate status names for same itemType', async () => {
      await createTestStatus(moduleType, { name: 'Duplicate', itemType: 'main' });

      await request(app)
        .post('/api/statuses')
        .send({
          moduleType,
          name: 'Duplicate',
          itemType: 'main',
        })
        .expect(409);
    });

    it('should allow same name for different itemTypes', async () => {
      await createTestStatus(moduleType, { name: 'Same Name', itemType: 'main' });

      const res = await request(app)
        .post('/api/statuses')
        .send({
          moduleType,
          name: 'Same Name',
          itemType: 'sub',
        })
        .expect(201);

      expect(res.body.itemType).toBe('sub');
    });

    it('should require itemType', async () => {
      await request(app)
        .post('/api/statuses')
        .send({
          moduleType,
          name: 'No ItemType',
        })
        .expect(400);
    });

    it('should validate itemType values', async () => {
      await request(app)
        .post('/api/statuses')
        .send({
          moduleType,
          name: 'Invalid',
          itemType: 'invalid',
        })
        .expect(400);
    });
  });

  describe('PUT /api/statuses/:id', () => {
    it('should update an existing status', async () => {
      // Clean up first
      await testPrisma.status.deleteMany({ where: { moduleType } });
      
      const status = await createTestStatus(moduleType, { name: 'Original', itemType: 'main' });

      const res = await request(app)
        .put(`/api/statuses/${status.id}`)
        .send({
          name: 'Updated',
          color: '#00FF00',
        })
        .expect(200);

      expect(res.body.name).toBe('Updated');
      expect(res.body.color).toBe('#00FF00');
    });

    it('should return 500 for non-existent status', async () => {
      await request(app)
        .put('/api/statuses/non-existent-id')
        .send({ name: 'Updated' })
        .expect(500);
    });
  });

  describe('DELETE /api/statuses/:id', () => {
    it('should delete an existing status', async () => {
      const status = await createTestStatus(moduleType);

      await request(app)
        .delete(`/api/statuses/${status.id}`)
        .expect(204);

      const deleted = await testPrisma.status.findUnique({
        where: { id: status.id },
      });
      expect(deleted).toBeNull();
    });
  });
});

describe('Metadata Module - Categories', () => {
  const moduleType = ModuleType.ARTISTS;

  beforeEach(async () => {
    await testPrisma.category.deleteMany({ where: { moduleType } });
  });

  describe('GET /api/categories/:moduleType', () => {
    it('should fetch all categories for a module', async () => {
      // Clean up first
      await testPrisma.category.deleteMany({ where: { moduleType } });
      
      await createTestCategory(moduleType, { name: 'Category 1' });
      await createTestCategory(moduleType, { name: 'Category 2' });

      const res = await request(app)
        .get(`/api/categories/${moduleType}`)
        .expect(200);

      expect(res.body.length).toBeGreaterThanOrEqual(2);
      const categoryNames = res.body.map((c: any) => c.name);
      expect(categoryNames).toContain('Category 1');
      expect(categoryNames).toContain('Category 2');
      expect(res.body[0]).toHaveProperty('name');
    });
  });

  describe('POST /api/categories', () => {
    it('should create a new category', async () => {
      const res = await request(app)
        .post('/api/categories')
        .send({
          moduleType,
          name: 'New Category',
          description: 'Test Description',
          color: '#3B82F6',
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('New Category');
      expect(res.body.eventId).toBeNull();
    });

    it('should reject duplicate category names', async () => {
      await createTestCategory(moduleType, { name: 'Duplicate' });

      await request(app)
        .post('/api/categories')
        .send({
          moduleType,
          name: 'Duplicate',
        })
        .expect(409);
    });
  });

  describe('PUT /api/categories/:id', () => {
    it('should update an existing category', async () => {
      const category = await createTestCategory(moduleType, { name: 'Original' });

      const res = await request(app)
        .put(`/api/categories/${category.id}`)
        .send({
          name: 'Updated',
          color: '#FF0000',
        })
        .expect(200);

      expect(res.body.name).toBe('Updated');
    });
  });

  describe('DELETE /api/categories/:id', () => {
    it('should delete an existing category', async () => {
      const category = await createTestCategory(moduleType);

      await request(app)
        .delete(`/api/categories/${category.id}`)
        .expect(204);
    });
  });
});

describe('Metadata Module - Tags', () => {
  const moduleType = ModuleType.ARTISTS;

  beforeEach(async () => {
    try {
      await testPrisma.tag.deleteMany({ where: { moduleType } });
    } catch (e: any) {
      if (!e.message?.includes('does not exist')) {
        throw e;
      }
    }
  });

  describe('GET /api/tags/:moduleType', () => {
    it('should fetch all tags for a module', async () => {
      await createTestTag(moduleType, { name: 'Tag 1' });
      await createTestTag(moduleType, { name: 'Tag 2' });

      const res = await request(app)
        .get(`/api/tags/${moduleType}`)
        .expect(200);

      expect(res.body).toHaveLength(2);
    });
  });

  describe('POST /api/tags', () => {
    it('should create a new tag', async () => {
      const res = await request(app)
        .post('/api/tags')
        .send({
          moduleType,
          name: 'New Tag',
          color: '#10B981',
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('New Tag');
    });

    it('should reject duplicate tag names', async () => {
      await createTestTag(moduleType, { name: 'Duplicate' });

      await request(app)
        .post('/api/tags')
        .send({
          moduleType,
          name: 'Duplicate',
        })
        .expect(409);
    });
  });

  describe('PUT /api/tags/:id', () => {
    it('should update an existing tag', async () => {
      // Clean up first
      await testPrisma.tag.deleteMany({ where: { moduleType } });
      
      const tag = await createTestTag(moduleType, { name: 'Original' });

      const res = await request(app)
        .put(`/api/tags/${tag.id}`)
        .send({
          name: 'Updated',
        })
        .expect(200);

      expect(res.body.name).toBe('Updated');
    });
  });

  describe('DELETE /api/tags/:id', () => {
    it('should delete an existing tag', async () => {
      const tag = await createTestTag(moduleType);

      await request(app)
        .delete(`/api/tags/${tag.id}`)
        .expect(204);
    });
  });
});

describe('Metadata Module - Sub-Line Item Types', () => {
  const moduleType = ModuleType.ARTISTS;

  beforeEach(async () => {
    const cleanup = [
      () => testPrisma.subLineItemType.deleteMany({ where: { moduleType } }),
      () => testPrisma.category.deleteMany({ where: { moduleType } }),
    ];
    
    for (const op of cleanup) {
      try {
        await op();
      } catch (e: any) {
        if (!e.message?.includes('does not exist')) {
          throw e;
        }
      }
    }
  });

  describe('GET /api/sub-line-item-types/:moduleType', () => {
    it('should fetch all sub-line item types for a module', async () => {
      await createTestSubLineItemType(moduleType, { name: 'Type 1' });
      await createTestSubLineItemType(moduleType, { name: 'Type 2' });

      const res = await request(app)
        .get(`/api/sub-line-item-types/${moduleType}`)
        .expect(200);

      expect(res.body).toHaveLength(2);
      expect(res.body[0]).toHaveProperty('name');
    });

    it('should filter by categoryId when provided', async () => {
      const category = await createTestCategory(moduleType);
      await createTestSubLineItemType(moduleType, { name: 'With Category', categoryId: category.id });
      await createTestSubLineItemType(moduleType, { name: 'Without Category' });

      const res = await request(app)
        .get(`/api/sub-line-item-types/${moduleType}?categoryId=${category.id}`)
        .expect(200);

      // Should return both category-specific and global types
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('POST /api/sub-line-item-types', () => {
    it('should create a new sub-line item type', async () => {
      const res = await request(app)
        .post('/api/sub-line-item-types')
        .send({
          moduleType,
          name: 'New Type',
          description: 'Test Description',
          isDefault: false,
          order: 0,
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('New Type');
      expect(res.body.eventId).toBeNull();
    });

    it('should create with categoryId', async () => {
      const category = await createTestCategory(moduleType);

      const res = await request(app)
        .post('/api/sub-line-item-types')
        .send({
          moduleType,
          name: 'Categorized Type',
          categoryId: category.id,
        })
        .expect(201);

      expect(res.body.categoryId).toBe(category.id);
    });

    it('should reject duplicate names for same category', async () => {
      await createTestSubLineItemType(moduleType, { name: 'Duplicate' });

      await request(app)
        .post('/api/sub-line-item-types')
        .send({
          moduleType,
          name: 'Duplicate',
        })
        .expect(409);
    });

    it('should return 404 for invalid categoryId', async () => {
      await request(app)
        .post('/api/sub-line-item-types')
        .send({
          moduleType,
          name: 'Invalid Category',
          categoryId: 'non-existent-id',
        })
        .expect(404);
    });
  });

  describe('PUT /api/sub-line-item-types/:id', () => {
    it('should update an existing sub-line item type', async () => {
      const type = await createTestSubLineItemType(moduleType, { name: 'Original' });

      const res = await request(app)
        .put(`/api/sub-line-item-types/${type.id}`)
        .send({
          name: 'Updated',
          order: 5,
        })
        .expect(200);

      expect(res.body.name).toBe('Updated');
      expect(res.body.order).toBe(5);
    });

    it('should update categoryId', async () => {
      const category = await createTestCategory(moduleType);
      const type = await createTestSubLineItemType(moduleType);

      const res = await request(app)
        .put(`/api/sub-line-item-types/${type.id}`)
        .send({
          categoryId: category.id,
        })
        .expect(200);

      expect(res.body.categoryId).toBe(category.id);
    });
  });

  describe('DELETE /api/sub-line-item-types/:id', () => {
    it('should delete an existing sub-line item type', async () => {
      const type = await createTestSubLineItemType(moduleType);

      await request(app)
        .delete(`/api/sub-line-item-types/${type.id}`)
        .expect(204);
    });
  });
});

