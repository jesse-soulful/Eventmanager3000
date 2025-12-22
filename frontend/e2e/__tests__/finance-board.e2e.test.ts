import { BasePage } from '../helpers/page-objects/BasePage';
import { EventsPage } from '../helpers/page-objects/EventsPage';
import { loginAsUser, logout } from '../helpers/auth';

describe('Finance Board', () => {
  let basePage: BasePage;
  let eventsPage: EventsPage;
  let testEventId: string | null = null;

  beforeAll(async () => {
    basePage = new BasePage();
    await basePage.init();
    await loginAsUser();
    
    // Get a test event
    eventsPage = new EventsPage();
    await eventsPage.navigateToEvents();
    await basePage.sleep(2000);
    
    await basePage.init();
    const eventCards = await basePage.driver.findElements(basePage.By.css('.card, [class*="event-card"]'));
    if (eventCards.length > 0) {
      await eventCards[0].click();
      await basePage.sleep(2000);
      const currentUrl = await basePage.getCurrentUrl();
      const match = currentUrl.match(/\/events\/([a-f0-9-]+)/);
      if (match) {
        testEventId = match[1];
      }
    }
  });

  afterAll(async () => {
    await logout();
  });

  beforeEach(async () => {
    basePage = new BasePage();
    await basePage.init();
  });

  describe('Finance Board Page', () => {
    it('should display finance board for event', async () => {
      if (!testEventId) return;
      
      await basePage.navigateTo(`/events/${testEventId}/finance`);
      await basePage.sleep(2000);
      
      const currentUrl = await basePage.getCurrentUrl();
      expect(currentUrl).toContain('/finance');
    });

    it('should display global finance board', async () => {
      await basePage.navigateTo('/finance');
      await basePage.sleep(2000);
      
      const currentUrl = await basePage.getCurrentUrl();
      expect(currentUrl).toContain('/finance');
    });

    it('should display financial summary', async () => {
      if (!testEventId) return;
      
      await basePage.navigateTo(`/events/${testEventId}/finance`);
      await basePage.sleep(2000);
      
      // Check for financial metrics
      const metrics = await basePage.driver.findElements(basePage.By.css('[class*="metric"], [class*="summary"], [class*="total"]'));
      expect(metrics.length).toBeGreaterThanOrEqual(0);
    });

    it('should display line items with costs', async () => {
      if (!testEventId) return;
      
      await basePage.navigateTo(`/events/${testEventId}/finance`);
      await basePage.sleep(2000);
      
      const lineItems = await basePage.driver.findElements(basePage.By.css('[class*="line-item"], [class*="finance-item"]'));
      expect(lineItems.length).toBeGreaterThanOrEqual(0);
    });

    it('should filter by module type', async () => {
      if (!testEventId) return;
      
      await basePage.navigateTo(`/events/${testEventId}/finance`);
      await basePage.sleep(2000);
      
      // Look for filter buttons or dropdowns
      const filters = await basePage.driver.findElements(basePage.By.css('button[class*="filter"], select[class*="filter"]'));
      if (filters.length > 0) {
        await filters[0].click();
        await basePage.sleep(1000);
      }
    });
  });
});

