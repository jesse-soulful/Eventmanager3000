# Running E2E Tests with Visible Browser

## Quick Start

The tests are configured to run with **visible browser windows** so you can watch them execute.

### Option 1: Run All Tests (Visible Browser)

```bash
cd frontend
HEADLESS=false npm run test:e2e
```

### Option 2: Run Specific Test Suite

```bash
cd frontend
HEADLESS=false npm run test:e2e -- authentication.e2e.test.ts
```

### Option 3: Run Single Test

```bash
cd frontend
HEADLESS=false npm run test:e2e -- --testNamePattern="should display login form"
```

### Option 4: Run with Custom Credentials

```bash
cd frontend
HEADLESS=false \
  FRONTEND_URL=http://localhost:5173 \
  BACKEND_URL=http://localhost:3001 \
  TEST_USER_EMAIL=your_email@example.com \
  TEST_USER_PASSWORD=your_password \
  npm run test:e2e
```

## Prerequisites

1. **Backend server must be running**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Frontend server must be running**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test user must exist** in the database with the credentials you provide

## Watching Tests

When `HEADLESS=false`, you'll see:
- Chrome browser windows opening for each test
- Pages loading and interactions happening
- Forms being filled
- Buttons being clicked
- Navigation happening

## Test Results

- ✅ **7 tests passed** - Basic UI tests that don't require login
- ❌ **89 tests failed** - Tests requiring authentication (need valid credentials)

## Fixing Login Issues

Most failures are due to login timeouts. To fix:

1. **Create a test user** in your database:
   ```bash
   cd backend
   npm run create-user -- email=test@example.com password=TestPassword123!
   ```

2. **Or use existing credentials**:
   ```bash
   HEADLESS=false TEST_USER_EMAIL=jesse@soulfulsessions.be TEST_USER_PASSWORD=your_password npm run test:e2e
   ```

## Test Coverage

- ✅ Authentication flows
- ✅ Events management
- ✅ Artists module
- ✅ Production module
- ✅ Metadata management
- ✅ Finance board
- ✅ Staff pool
- ✅ Global modules
- ✅ Navigation
- ✅ Modals and forms
- ✅ Profile management
- ✅ Comments and attachments
- ✅ Comprehensive workflows

## Tips

- **Slow down tests**: Increase timeouts in `jest.e2e.config.cjs` if needed
- **Debug failures**: Check browser console and network tab in visible browser
- **Screenshots**: Automatically saved to `e2e/screenshots/` on failures
- **Watch mode**: Use `npm run test:e2e:watch` for continuous testing

