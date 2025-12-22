import request from 'supertest';
import express from 'express';
import { moduleRoutes } from '../../routes/modules';
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
  createTestSubLineItemType,
} from '../helpers/fixtures';

const app = express();
app.use(express.json());
app.use('/api/modules', mockRequireAuth, moduleRoutes);
app.use('/api/line-items', mockRequireAuth, lineItemRoutes);

describe('Artists Module', () => {
  let testEvent: any;
  const moduleType = ModuleType.ARTISTS;

  beforeEach(async () => {
    // Clean up before each test with error handling
    const cleanup = [
      () => testPrisma.lineItem.deleteMany(),
      () => testPrisma.status.deleteMany(),
      () => testPrisma.category.deleteMany(),
      () => testPrisma.tag.deleteMany(),
      () => testPrisma.event.deleteMany(),
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

    // Create test event
    testEvent = await createTestEvent({ name: 'Test Event' });
  });

  describe('GET /api/modules/:eventId/:moduleType', () => {
    it('should fetch all line items for an event module', async () => {
      await createTestLineItem(testEvent.id, moduleType, { name: 'Artist 1' });
      await createTestLineItem(testEvent.id, moduleType, { name: 'Artist 2' });

      const res = await request(app)
        .get(`/api/modules/${testEvent.id}/${moduleType}`)
        .expect(200);

      expect(res.body).toHaveLength(2);
      expect(res.body[0]).toHaveProperty('name');
      expect(res.body[0]).toHaveProperty('moduleType', moduleType);
    });

    it('should include sub-line items in response', async () => {
      const parent = await createTestLineItem(testEvent.id, moduleType, { name: 'Parent Artist' });
      await createTestLineItem(testEvent.id, moduleType, {
        name: 'Sub Item',
        parentLineItemId: parent.id,
      });

      const res = await request(app)
        .get(`/api/modules/${testEvent.id}/${moduleType}`)
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].subLineItems).toHaveLength(1);
      expect(res.body[0].subLineItems[0].name).toBe('Sub Item');
    });

    it('should return empty array when no line items exist', async () => {
      const res = await request(app)
        .get(`/api/modules/${testEvent.id}/${moduleType}`)
        .expect(200);

      expect(res.body).toEqual([]);
    });

    it('should only return top-level items (no parent)', async () => {
      const parent = await createTestLineItem(testEvent.id, moduleType, { name: 'Parent' });
      await createTestLineItem(testEvent.id, moduleType, {
        name: 'Child',
        parentLineItemId: parent.id,
      });

      const res = await request(app)
        .get(`/api/modules/${testEvent.id}/${moduleType}`)
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe('Parent');
    });
  });

  describe('POST /api/line-items', () => {
    it('should create a new line item', async () => {
      const res = await request(app)
        .post('/api/line-items')
        .send({
          eventId: testEvent.id,
          moduleType,
          name: 'New Artist',
          plannedCost: 5000,
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('New Artist');
      expect(res.body.plannedCost).toBe(5000);
      expect(res.body.eventId).toBe(testEvent.id);
    });

    it('should create line item with status', async () => {
      const status = await createTestStatus(moduleType, { name: 'Confirmed', itemType: 'main' });

      const res = await request(app)
        .post('/api/line-items')
        .send({
          eventId: testEvent.id,
          moduleType,
          name: 'Artist with Status',
          statusId: status.id,
        })
        .expect(201);

      expect(res.body.status).toHaveProperty('id', status.id);
    });

    it('should create line item with category', async () => {
      const category = await createTestCategory(moduleType);

      const res = await request(app)
        .post('/api/line-items')
        .send({
          eventId: testEvent.id,
          moduleType,
          name: 'Categorized Artist',
          categoryId: category.id,
        })
        .expect(201);

      expect(res.body.category).toHaveProperty('id', category.id);
    });

    it('should create line item with tags', async () => {
      const tag1 = await createTestTag(moduleType, { name: 'Tag 1' });
      const tag2 = await createTestTag(moduleType, { name: 'Tag 2' });

      const res = await request(app)
        .post('/api/line-items')
        .send({
          eventId: testEvent.id,
          moduleType,
          name: 'Tagged Artist',
          tagIds: [tag1.id, tag2.id],
        })
        .expect(201);

      expect(res.body.tags).toHaveLength(2);
    });

    it('should calculate totalPrice from quantity and unitPrice', async () => {
      const res = await request(app)
        .post('/api/line-items')
        .send({
          eventId: testEvent.id,
          moduleType,
          name: 'Calculated Price',
          quantity: 2,
          unitPrice: 1500,
        })
        .expect(201);

      expect(res.body.totalPrice).toBe(3000);
    });

    it('should create sub-line item and recalculate parent totals', async () => {
      const parent = await createTestLineItem(testEvent.id, moduleType, {
        name: 'Parent Artist',
        plannedCost: 0,
      });

      const res = await request(app)
        .post('/api/line-items')
        .send({
          eventId: testEvent.id,
          moduleType,
          name: 'Sub Item',
          parentLineItemId: parent.id,
          plannedCost: 1000,
        })
        .expect(201);

      expect(res.body.parentLineItemId).toBe(parent.id);

      // Verify parent totals were recalculated
      const updatedParent = await testPrisma.lineItem.findUnique({
        where: { id: parent.id },
      });
      expect(updatedParent?.plannedCost).toBe(1000);
    });

    it('should return 404 for invalid eventId', async () => {
      await request(app)
        .post('/api/line-items')
        .send({
          eventId: 'non-existent-id',
          moduleType,
          name: 'Invalid Event',
        })
        .expect(404);
    });

    it('should return 404 for invalid statusId', async () => {
      await request(app)
        .post('/api/line-items')
        .send({
          eventId: testEvent.id,
          moduleType,
          name: 'Invalid Status',
          statusId: 'non-existent-id',
        })
        .expect(404);
    });
  });

  describe('PUT /api/line-items/:id', () => {
    it('should update an existing line item', async () => {
      const lineItem = await createTestLineItem(testEvent.id, moduleType, {
        name: 'Original Name',
        plannedCost: 1000,
      });

      const res = await request(app)
        .put(`/api/line-items/${lineItem.id}`)
        .send({
          name: 'Updated Name',
          plannedCost: 2000,
        })
        .expect(200);

      expect(res.body.name).toBe('Updated Name');
      expect(res.body.plannedCost).toBe(2000);
    });

    it('should update status', async () => {
      const status1 = await createTestStatus(moduleType, { name: 'Status 1', itemType: 'main' });
      const status2 = await createTestStatus(moduleType, { name: 'Status 2', itemType: 'main' });
      const lineItem = await createTestLineItem(testEvent.id, moduleType, {
        statusId: status1.id,
      });

      const res = await request(app)
        .put(`/api/line-items/${lineItem.id}`)
        .send({
          statusId: status2.id,
        })
        .expect(200);

      expect(res.body.status.id).toBe(status2.id);
    });

    it('should update category', async () => {
      const category1 = await createTestCategory(moduleType, { name: 'Category 1' });
      const category2 = await createTestCategory(moduleType, { name: 'Category 2' });
      const lineItem = await createTestLineItem(testEvent.id, moduleType, {
        categoryId: category1.id,
      });

      const res = await request(app)
        .put(`/api/line-items/${lineItem.id}`)
        .send({
          categoryId: category2.id,
        })
        .expect(200);

      expect(res.body.category.id).toBe(category2.id);
    });

    it('should update tags', async () => {
      const tag1 = await createTestTag(moduleType, { name: 'Tag 1' });
      const tag2 = await createTestTag(moduleType, { name: 'Tag 2' });
      const tag3 = await createTestTag(moduleType, { name: 'Tag 3' });
      const lineItem = await createTestLineItem(testEvent.id, moduleType);

      // First, add tags via update
      await testPrisma.lineItem.update({
        where: { id: lineItem.id },
        data: {
          Tag: {
            connect: [{ id: tag1.id }, { id: tag2.id }],
          },
        },
      });

      const res = await request(app)
        .put(`/api/line-items/${lineItem.id}`)
        .send({
          tagIds: [tag2.id, tag3.id],
        })
        .expect(200);

      expect(res.body.tags).toHaveLength(2);
      expect(res.body.tags.map((t: any) => t.id)).toContain(tag2.id);
      expect(res.body.tags.map((t: any) => t.id)).toContain(tag3.id);
    });

    it('should recalculate totalPrice when quantity/unitPrice updated', async () => {
      const lineItem = await createTestLineItem(testEvent.id, moduleType, {
        quantity: 2,
        unitPrice: 1000,
      });

      const res = await request(app)
        .put(`/api/line-items/${lineItem.id}`)
        .send({
          quantity: 3,
          unitPrice: 1500,
        })
        .expect(200);

      expect(res.body.totalPrice).toBe(4500);
    });

    it('should recalculate parent totals when sub-item updated', async () => {
      const parent = await createTestLineItem(testEvent.id, moduleType, {
        name: 'Parent',
        plannedCost: 0,
      });
      const subItem = await createTestLineItem(testEvent.id, moduleType, {
        name: 'Sub Item',
        parentLineItemId: parent.id,
        plannedCost: 1000,
      });

      await request(app)
        .put(`/api/line-items/${subItem.id}`)
        .send({
          plannedCost: 2000,
        })
        .expect(200);

      const updatedParent = await testPrisma.lineItem.findUnique({
        where: { id: parent.id },
      });
      expect(updatedParent?.plannedCost).toBe(2000);
    });

    it('should return 404 for non-existent line item', async () => {
      await request(app)
        .put('/api/line-items/non-existent-id')
        .send({
          name: 'Updated',
        })
        .expect(404);
    });
  });

  describe('DELETE /api/line-items/:id', () => {
    it('should delete an existing line item', async () => {
      const lineItem = await createTestLineItem(testEvent.id, moduleType);

      await request(app)
        .delete(`/api/line-items/${lineItem.id}`)
        .expect(204);

      const deleted = await testPrisma.lineItem.findUnique({
        where: { id: lineItem.id },
      });
      expect(deleted).toBeNull();
    });

    it('should delete sub-line items when parent is deleted', async () => {
      const parent = await createTestLineItem(testEvent.id, moduleType);
      const subItem = await createTestLineItem(testEvent.id, moduleType, {
        parentLineItemId: parent.id,
      });

      await request(app)
        .delete(`/api/line-items/${parent.id}`)
        .expect(204);

      const deletedSub = await testPrisma.lineItem.findUnique({
        where: { id: subItem.id },
      });
      expect(deletedSub).toBeNull();
    });

    it('should recalculate parent totals when sub-item deleted', async () => {
      const parent = await createTestLineItem(testEvent.id, moduleType, {
        plannedCost: 0,
      });
      
      // Create sub-items via API to trigger recalculation
      const subItem1Res = await request(app)
        .post('/api/line-items')
        .send({
          eventId: testEvent.id,
          moduleType,
          name: 'Sub Item 1',
          parentLineItemId: parent.id,
          plannedCost: 1000,
        })
        .expect(201);
      
      const subItem2Res = await request(app)
        .post('/api/line-items')
        .send({
          eventId: testEvent.id,
          moduleType,
          name: 'Sub Item 2',
          parentLineItemId: parent.id,
          plannedCost: 2000,
        })
        .expect(201);

      // Verify parent total is 3000 (recalculated by API)
      let parentData = await testPrisma.lineItem.findUnique({
        where: { id: parent.id },
      });
      expect(parentData?.plannedCost).toBe(3000);

      // Delete one sub-item
      await request(app)
        .delete(`/api/line-items/${subItem1Res.body.id}`)
        .expect(204);

      // Verify parent total is recalculated
      parentData = await testPrisma.lineItem.findUnique({
        where: { id: parent.id },
      });
      expect(parentData?.plannedCost).toBe(2000);
    });

    it('should return 404 for non-existent line item', async () => {
      await request(app)
        .delete('/api/line-items/non-existent-id')
        .expect(404);
    });
  });

  describe('Business Logic - Totals Recalculation', () => {
    it('should preserve parent plannedCost when sub-items are added', async () => {
      const parent = await createTestLineItem(testEvent.id, moduleType, {
        name: 'Parent with Budget',
        plannedCost: 10000, // Manually set budget
      });

      // Add sub-item
      await request(app)
        .post('/api/line-items')
        .send({
          eventId: testEvent.id,
          moduleType,
          name: 'Sub Item',
          parentLineItemId: parent.id,
          plannedCost: 2000,
        })
        .expect(201);

      // Parent's plannedCost should be preserved (not overwritten by sum)
      const updatedParent = await testPrisma.lineItem.findUnique({
        where: { id: parent.id },
      });
      expect(updatedParent?.plannedCost).toBe(10000);
    });

    it('should calculate actualCost from sub-items', async () => {
      const parent = await createTestLineItem(testEvent.id, moduleType, {
        actualCost: null,
      });

      // Create sub-items via API to trigger recalculation
      await request(app)
        .post('/api/line-items')
        .send({
          eventId: testEvent.id,
          moduleType,
          name: 'Sub Item 1',
          parentLineItemId: parent.id,
          actualCost: 500,
        })
        .expect(201);
      
      await request(app)
        .post('/api/line-items')
        .send({
          eventId: testEvent.id,
          moduleType,
          name: 'Sub Item 2',
          parentLineItemId: parent.id,
          actualCost: 300,
        })
        .expect(201);

      const updatedParent = await testPrisma.lineItem.findUnique({
        where: { id: parent.id },
      });
      expect(updatedParent?.actualCost).toBe(800);
    });
  });
});

