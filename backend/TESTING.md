# Testing Guide

This document describes the test suite for the Event Management 3000 backend, focusing on the Artists and Metadata modules.

## Test Coverage

The test suite aims for **80% coverage** based on criticality, focusing on:

- **CRUD Operations**: Create, Read, Update, Delete for all entities
- **Business Logic**: Status assignment, totals recalculation, parent-child relationships
- **Validation**: Input validation, duplicate prevention, foreign key constraints
- **Error Handling**: Invalid inputs, missing data, edge cases
- **Data Integrity**: Cascade deletes, relationship management

## Test Structure

```
backend/src/__tests__/
├── setup.ts                    # Test database setup and teardown
├── helpers/
│   ├── auth.ts                 # Mock authentication helpers
│   └── fixtures.ts             # Test data factories
└── routes/
    ├── metadata.test.ts        # Tests for statuses, categories, tags, sub-line-item-types
    ├── artists.test.ts         # Tests for artists module (line items)
    └── edge-cases.test.ts      # Edge cases and error handling
```

## Running Tests

### Prerequisites

1. Install dependencies:
```bash
cd backend
npm install
```

2. Generate Prisma Client:
```bash
npm run prisma:generate
```

3. Run migrations on test database:
```bash
DATABASE_URL="file:./prisma/test.db" npx prisma migrate deploy
```

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

### Run Specific Test File

```bash
npm test -- metadata.test.ts
npm test -- artists.test.ts
npm test -- edge-cases.test.ts
```

## Test Database

Tests use a separate SQLite database (`prisma/test.db`) to avoid affecting development data.

- Database is cleaned before all tests (in `beforeAll`)
- Each test suite cleans its own data (in `beforeEach`)
- Database is disconnected after all tests (in `afterAll`)

## Test Categories

### Metadata Module Tests (`metadata.test.ts`)

**Statuses:**
- ✅ Fetch statuses by module type
- ✅ Filter by itemType (main/sub)
- ✅ Create status with validation
- ✅ Prevent duplicate statuses
- ✅ Update status
- ✅ Delete status

**Categories:**
- ✅ Fetch categories by module type
- ✅ Create category
- ✅ Prevent duplicate categories
- ✅ Update category
- ✅ Delete category

**Tags:**
- ✅ Fetch tags by module type
- ✅ Create tag
- ✅ Prevent duplicate tags
- ✅ Update tag
- ✅ Delete tag

**Sub-Line Item Types:**
- ✅ Fetch sub-line item types by module type
- ✅ Filter by categoryId
- ✅ Create sub-line item type
- ✅ Create with categoryId
- ✅ Prevent duplicates
- ✅ Update sub-line item type
- ✅ Delete sub-line item type

### Artists Module Tests (`artists.test.ts`)

**Line Items:**
- ✅ Fetch line items for event/module
- ✅ Include sub-line items in response
- ✅ Create line item
- ✅ Create with status, category, tags
- ✅ Calculate totalPrice from quantity/unitPrice
- ✅ Create sub-line item
- ✅ Recalculate parent totals
- ✅ Update line item
- ✅ Update status, category, tags
- ✅ Recalculate totals on update
- ✅ Delete line item
- ✅ Cascade delete sub-items
- ✅ Recalculate totals on delete

**Business Logic:**
- ✅ Preserve parent plannedCost when sub-items added
- ✅ Calculate actualCost from sub-items
- ✅ Handle totals recalculation

### Edge Cases Tests (`edge-cases.test.ts`)

**Invalid Input:**
- ✅ Missing required fields
- ✅ Invalid moduleType
- ✅ Negative costs
- ✅ Very large numbers
- ✅ Empty strings for optional fields

**Concurrent Operations:**
- ✅ Concurrent status creation
- ✅ Rapid status updates

**Data Integrity:**
- ✅ Prevent orphaned sub-line items
- ✅ Handle circular references

**Metadata Parsing:**
- ✅ Invalid JSON metadata
- ✅ Null metadata

**Status Default Assignment:**
- ✅ Assign default status
- ✅ Assign first status when no default

**Relationships:**
- ✅ Delete category in use
- ✅ Delete tag in use

**Totals Recalculation:**
- ✅ Handle null values
- ✅ Handle zero totals

## Coverage Goals

- **Lines**: 70%+
- **Functions**: 70%+
- **Branches**: 70%+
- **Statements**: 70%+

Focus areas for 80% coverage:
1. **Critical Paths**: All CRUD operations (100% coverage)
2. **Business Logic**: Status assignment, totals calculation (90%+ coverage)
3. **Error Handling**: Validation, edge cases (70%+ coverage)
4. **Edge Cases**: Concurrent operations, data integrity (60%+ coverage)

## Writing New Tests

### Test Template

```typescript
import request from 'supertest';
import express from 'express';
import { yourRoutes } from '../../routes/your-route';
import { mockRequireAuth } from '../helpers/auth';
import { testPrisma } from '../setup';
import { createTestEntity } from '../helpers/fixtures';

const app = express();
app.use(express.json());
app.use('/api/your-route', mockRequireAuth, yourRoutes);

describe('Your Module', () => {
  beforeEach(async () => {
    // Clean up before each test
    await testPrisma.yourTable.deleteMany();
  });

  describe('GET /api/your-route', () => {
    it('should do something', async () => {
      // Arrange
      const entity = await createTestEntity();
      
      // Act
      const res = await request(app)
        .get(`/api/your-route/${entity.id}`)
        .expect(200);
      
      // Assert
      expect(res.body).toHaveProperty('id');
    });
  });
});
```

### Best Practices

1. **Arrange-Act-Assert**: Structure tests clearly
2. **Isolation**: Each test should be independent
3. **Cleanup**: Always clean up test data
4. **Descriptive Names**: Use clear test descriptions
5. **Test Critical Paths First**: Focus on most important functionality
6. **Edge Cases**: Test error conditions and boundary cases

## Continuous Integration

Tests should run automatically on:
- Pull requests
- Before merging to main
- On deployment

## Troubleshooting

### Database Locked Error

If you see "database is locked" errors:
1. Make sure no other process is using the test database
2. Close Prisma Studio if it's open
3. Delete `prisma/test.db` and `prisma/test.db-journal`

### Tests Failing

1. Check that migrations are up to date: `DATABASE_URL="file:./prisma/test.db" npx prisma migrate deploy`
2. Verify Prisma Client is generated: `npm run prisma:generate`
3. Check test database exists: `ls -la prisma/test.db`
4. Review error messages for specific issues

### Coverage Not Meeting Goals

1. Identify uncovered lines: `npm run test:coverage`
2. Add tests for critical paths first
3. Focus on business logic and error handling
4. Review edge cases

## Future Improvements

- [ ] Add integration tests for full request/response cycles
- [ ] Add performance tests for large datasets
- [ ] Add tests for authentication and authorization
- [ ] Add tests for rate limiting
- [ ] Add tests for file uploads (documents)
- [ ] Add frontend component tests

