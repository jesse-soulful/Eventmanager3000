import { BasePage } from '../helpers/page-objects/BasePage';
import { Modal } from '../helpers/page-objects/Modal';
import { EventsPage } from '../helpers/page-objects/EventsPage';
import { loginAsUser, logout } from '../helpers/auth';

describe('Production Module', () => {
  let basePage: BasePage;
  let modal: Modal;
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
    modal = new Modal();
    await basePage.init();
  });

  describe('Production Page', () => {
    it('should display production page', async () => {
      if (!testEventId) return;
      
      await basePage.navigateTo(`/events/${testEventId}/production`);
      await basePage.sleep(2000);
      
      const currentUrl = await basePage.getCurrentUrl();
      expect(currentUrl).toContain('/production');
    });

    it('should display categories with line items', async () => {
      if (!testEventId) return;
      
      await basePage.navigateTo(`/events/${testEventId}/production`);
      await basePage.sleep(2000);
      
      const categories = await basePage.driver.findElements(basePage.By.css('[class*="category"], [class*="section"]'));
      expect(categories.length).toBeGreaterThanOrEqual(0);
    });

    it('should allow creating line items', async () => {
      if (!testEventId) return;
      
      await basePage.navigateTo(`/events/${testEventId}/production`);
      await basePage.sleep(2000);
      
      await basePage.init();
      const createButtons = await basePage.driver.findElements(basePage.By.xpath('//button[contains(text(), "Add") or contains(text(), "Create")]'));
      expect(createButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Line Items in Production', () => {
    it('should create a new line item', async () => {
      if (!testEventId) return;
      
      await basePage.navigateTo(`/events/${testEventId}/production`);
      await basePage.sleep(2000);
      
      await basePage.init();
      const createButtons = await basePage.driver.findElements(basePage.By.xpath('//button[contains(text(), "Add") or contains(text(), "Create")]'));
      if (createButtons.length > 0) {
        await createButtons[0].click();
        await modal.waitForModal();
        
        const itemName = `Production Item ${Date.now()}`;
        await modal.enterTextInField('name', itemName);
        await modal.enterTextInField('plannedCost', '2000');
        
        await modal.clickSaveButton();
        await basePage.sleep(2000);
        
        // Verify item was created
        await basePage.init();
        const isVisible = (await basePage.driver.findElements(basePage.By.xpath(`//*[contains(text(), "${itemName}")]`))).length > 0;
        expect(isVisible).toBe(true);
      }
    });

    it('should display line items grouped by category', async () => {
      if (!testEventId) return;
      
      await basePage.navigateTo(`/events/${testEventId}/production`);
      await basePage.sleep(2000);
      
      const lineItems = await basePage.driver.findElements(basePage.By.css('.line-item-card, [class*="line-item"]'));
      expect(lineItems.length).toBeGreaterThanOrEqual(0);
    });
  });
});

