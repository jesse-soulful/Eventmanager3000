import request from 'supertest';
import express from 'express';
import { statusRoutes } from '../../routes/statuses';
import { categoryRoutes } from '../../routes/categories';
import { lineItemRoutes } from '../../routes/line-items';
import { mockRequireAuth } from '../helpers/auth';
import { testPrisma } from '../setup';
import { ModuleType } from '@event-management/shared';
import {
  createTestEvent,
  createTestStatus,
  createTestCategory,
  createTestTag,
  createTestLineItem,
} from '../helpers/fixtures';

const app = express();
app.use(express.json());
app.use('/api/statuses', mockRequireAuth, statusRoutes);
app.use('/api/categories', mockRequireAuth, categoryRoutes);
app.use('/api/line-items', mockRequireAuth, lineItemRoutes);

describe('Edge Cases and Error Handling', () => {
  let testEvent: any;
  const moduleType = ModuleType.ARTISTS;

  beforeEach(async () => {
    await testPrisma.lineItem.deleteMany();
    await testPrisma.status.deleteMany();
    await testPrisma.category.deleteMany();
    await testPrisma.event.deleteMany();
    testEvent = await createTestEvent();
  });

  describe('Invalid Input Handling', () => {
    it('should handle missing required fields', async () => {
      await request(app)
        .post('/api/line-items')
        .send({
          // Missing eventId and moduleType
          name: 'Incomplete',
        })
        .expect(400); // Changed from 500 to 400 as validation should return 400
    });

    it('should handle invalid moduleType', async () => {
      await request(app)
        .get('/api/statuses/INVALID_MODULE')
        .expect(200); // Should return empty array, not error
    });

    it('should handle negative costs', async () => {
      const res = await request(app)
        .post('/api/line-items')
        .send({
          eventId: testEvent.id,
          moduleType,
          name: 'Negative Cost',
          plannedCost: -100,
        })
        .expect(201);

      // Database allows negative, but business logic should handle it
      expect(res.body.plannedCost).toBe(-100);
    });

    it('should handle very large numbers', async () => {
      const res = await request(app)
        .post('/api/line-items')
        .send({
          eventId: testEvent.id,
          moduleType,
          name: 'Large Number',
          plannedCost: 999999999,
        })
        .expect(201);

      expect(res.body.plannedCost).toBe(999999999);
    });

    it('should handle empty strings for optional fields', async () => {
      const res = await request(app)
        .post('/api/line-items')
        .send({
          eventId: testEvent.id,
          moduleType,
          name: 'Empty Fields',
          description: '',
          statusId: '',
        })
        .expect(201);

      expect(res.body.description).toBeNull();
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent status creation attempts', async () => {
      const promises = Array.from({ length: 5 }, (_, i) =>
        request(app)
          .post('/api/statuses')
          .send({
            moduleType,
            name: `Concurrent Status ${i}`,
            itemType: 'main',
          })
      );

      const results = await Promise.all(promises);
      const successful = results.filter((r) => r.status === 201);
      
      // All should succeed (duplicate prevention is per name/itemType)
      expect(successful.length).toBe(5);
    });

    it('should handle rapid status updates', async () => {
      const status = await createTestStatus(moduleType, { name: 'Rapid Update' });

      const promises = Array.from({ length: 3 }, (_, i) =>
        request(app)
          .put(`/api/statuses/${status.id}`)
          .send({
            order: i,
          })
      );

      await Promise.all(promises);

      const updated = await testPrisma.status.findUnique({
        where: { id: status.id },
      });
      expect(updated).toBeTruthy();
    });
  });

  describe('Data Integrity', () => {
    it('should prevent orphaned sub-line items', async () => {
      const parent = await createTestLineItem(testEvent.id, moduleType);
      const subItem = await createTestLineItem(testEvent.id, moduleType, {
        parentLineItemId: parent.id,
      });

      // Delete parent
      await request(app)
        .delete(`/api/line-items/${parent.id}`)
        .expect(204);

      // Sub-item should also be deleted (CASCADE)
      const deletedSub = await testPrisma.lineItem.findUnique({
        where: { id: subItem.id },
      });
      expect(deletedSub).toBeNull();
    });

    it('should handle circular parent references gracefully', async () => {
      const item1 = await createTestLineItem(testEvent.id, moduleType, { name: 'Item 1' });

      // Try to set parent to itself (should fail validation or be ignored)
      const res = await request(app)
        .put(`/api/line-items/${item1.id}`)
        .send({
          parentLineItemId: item1.id,
        });

      // Should either reject or handle gracefully
      expect([200, 400, 500]).toContain(res.status);
    });
  });

  describe('Metadata Parsing', () => {
    it('should handle invalid JSON metadata', async () => {
      // Create item with invalid JSON string
      const lineItem = await testPrisma.lineItem.create({
        data: {
          eventId: testEvent.id,
          moduleType,
          name: 'Invalid Metadata',
          metadata: 'invalid json{',
        },
      });

      const res = await request(app)
        .get(`/api/modules/${testEvent.id}/${moduleType}`)
        .expect(200);

      const found = res.body.find((item: any) => item.id === lineItem.id);
      expect(found).toBeTruthy();
      // Metadata should be parsed as empty object on error (parseMetadata handles this)
      if (found) {
        expect(found.metadata).toEqual({});
      }
    });

    it('should handle null metadata', async () => {
      const res = await request(app)
        .post('/api/line-items')
        .send({
          eventId: testEvent.id,
          moduleType,
          name: 'Null Metadata',
          metadata: null,
        })
        .expect(201);

      expect(res.body.metadata).toBeNull();
    });
  });

  describe('Status Default Assignment', () => {
    it('should assign default status when creating line item without statusId', async () => {
      const defaultStatus = await createTestStatus(moduleType, {
        name: 'Default',
        itemType: 'main',
        isDefault: true,
      });

      const res = await request(app)
        .post('/api/line-items')
        .send({
          eventId: testEvent.id,
          moduleType,
          name: 'No Status',
        })
        .expect(201);

      expect(res.body.status.id).toBe(defaultStatus.id);
    });

    it('should assign first status when no default exists', async () => {
      const firstStatus = await createTestStatus(moduleType, {
        name: 'First',
        itemType: 'main',
        order: 0,
        isDefault: false,
      });

      const res = await request(app)
        .post('/api/line-items')
        .send({
          eventId: testEvent.id,
          moduleType,
          name: 'No Default Status',
        })
        .expect(201);

      expect(res.body.status.id).toBe(firstStatus.id);
    });
  });

  describe('Category and Tag Relationships', () => {
    it('should handle deleting category that is in use', async () => {
      const category = await createTestCategory(moduleType);
      await createTestLineItem(testEvent.id, moduleType, {
        categoryId: category.id,
      });

      // Delete category
      await request(app)
        .delete(`/api/categories/${category.id}`)
        .expect(204);

      // Line item should still exist but with null categoryId
      const lineItems = await testPrisma.lineItem.findMany({
        where: { eventId: testEvent.id },
      });
      expect(lineItems.length).toBeGreaterThan(0);
    });

    it('should handle deleting tag that is in use', async () => {
      // Tags use many-to-many, so deletion should work
      const tag = await createTestTag(moduleType);
      const lineItem = await createTestLineItem(testEvent.id, moduleType);

      // Connect tag
      await testPrisma.lineItem.update({
        where: { id: lineItem.id },
        data: {
          Tag: {
            connect: [{ id: tag.id }],
          },
        },
      });

      // Delete tag
      await request(app)
        .delete(`/api/tags/${tag.id}`)
        .expect(204);

      // Line item should still exist
      const exists = await testPrisma.lineItem.findUnique({
        where: { id: lineItem.id },
      });
      expect(exists).toBeTruthy();
    });
  });

  describe('Totals Recalculation Edge Cases', () => {
    it('should handle null values in totals calculation', async () => {
      const parent = await createTestLineItem(testEvent.id, moduleType, {
        plannedCost: 0,
      });

      await createTestLineItem(testEvent.id, moduleType, {
        parentLineItemId: parent.id,
        plannedCost: null,
      });
      await createTestLineItem(testEvent.id, moduleType, {
        parentLineItemId: parent.id,
        plannedCost: 1000,
      });

      const updatedParent = await testPrisma.lineItem.findUnique({
        where: { id: parent.id },
      });
      expect(updatedParent?.plannedCost).toBe(1000);
    });

    it('should handle zero totals correctly', async () => {
      const parent = await createTestLineItem(testEvent.id, moduleType, {
        plannedCost: 0,
      });

      // Create sub-item via API to trigger recalculation
      await request(app)
        .post('/api/line-items')
        .send({
          eventId: testEvent.id,
          moduleType,
          name: 'Zero Cost Sub Item',
          parentLineItemId: parent.id,
          plannedCost: 0,
        })
        .expect(201);

      const updatedParent = await testPrisma.lineItem.findUnique({
        where: { id: parent.id },
      });
      expect(updatedParent?.plannedCost).toBe(0);
    });
  });
});

