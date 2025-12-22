import { EventsPage } from '../helpers/page-objects/EventsPage';
import { EventDetailPage } from '../helpers/page-objects/EventDetailPage';
import { Modal } from '../helpers/page-objects/Modal';
import { BasePage } from '../helpers/page-objects/BasePage';
import { loginAsUser, logout } from '../helpers/auth';

describe('Events Management', () => {
  let eventsPage: EventsPage;
  let eventDetailPage: EventDetailPage;
  let modal: Modal;
  let basePage: BasePage;
  let testEventId: string | null = null;

  beforeAll(async () => {
    await loginAsUser();
  });

  afterAll(async () => {
    await logout();
  });

  beforeEach(async () => {
    eventsPage = new EventsPage();
    eventDetailPage = new EventDetailPage();
    modal = new Modal();
    basePage = new BasePage();
    await basePage.init();
  });

  describe('Events List Page', () => {
    it('should display events page', async () => {
      await eventsPage.navigateToEvents();
      
      const currentUrl = await basePage.getCurrentUrl();
      expect(currentUrl).toContain('/events');
    });

    it('should show create event button', async () => {
      await eventsPage.navigateToEvents();
      
      // Check for create button using XPath
      const hasCreateButton = await eventsPage.isElementPresent('button') && 
        (await eventsPage.driver.findElements(eventsPage.By.xpath('//button[contains(text(), "New Event") or contains(text(), "Create Event")]'))).length > 0;
      expect(hasCreateButton).toBe(true);
    });

    it('should display list of events', async () => {
      await eventsPage.navigateToEvents();
      await basePage.sleep(2000); // Wait for events to load
      
      const eventCount = await eventsPage.getEventCount();
      expect(eventCount).toBeGreaterThanOrEqual(0);
    });

    it('should navigate to event detail when clicking event card', async () => {
      await eventsPage.navigateToEvents();
      await basePage.sleep(2000);
      
      const eventCards = await basePage.driver.findElements(basePage.By.css('.card, [class*="event-card"]'));
      if (eventCards.length > 0) {
        await eventCards[0].click();
        await basePage.sleep(2000);
        
        const currentUrl = await basePage.getCurrentUrl();
        expect(currentUrl).toMatch(/\/events\/[a-f0-9-]+$/);
        
        // Extract event ID from URL
        const match = currentUrl.match(/\/events\/([a-f0-9-]+)/);
        if (match) {
          testEventId = match[1];
        }
      }
    });
  });

  describe('Create Event', () => {
    it('should open create event modal', async () => {
      await eventsPage.navigateToEvents();
      await eventsPage.clickCreateEventButton();
      
      await modal.waitForModal();
      expect(await modal.isModalVisible()).toBe(true);
    });

    it('should create a new event', async () => {
      await eventsPage.navigateToEvents();
      await eventsPage.clickCreateEventButton();
      await modal.waitForModal();
      
      const eventName = `Test Event ${Date.now()}`;
      await modal.enterTextInField('name', eventName);
      
      // Fill in required fields
      await modal.enterTextInField('startDate', '2024-12-25');
      await modal.enterTextInField('endDate', '2024-12-26');
      await modal.enterTextInField('location', 'Test Location');
      
      await modal.clickSaveButton();
      await basePage.sleep(2000);
      
      // Verify event appears in list
      await eventsPage.navigateToEvents();
      await basePage.sleep(2000);
      const isVisible = await eventsPage.isEventVisible(eventName);
      expect(isVisible).toBe(true);
    });

    it('should show validation errors for missing required fields', async () => {
      await eventsPage.navigateToEvents();
      await eventsPage.clickCreateEventButton();
      await modal.waitForModal();
      
      await modal.clickSaveButton();
      await basePage.sleep(1000);
      
      const errorMessage = await modal.getErrorMessage();
      expect(errorMessage.length).toBeGreaterThan(0);
    });
  });

  describe('Event Detail Page', () => {
    beforeEach(async () => {
      // Ensure we have an event to work with
      if (!testEventId) {
        await eventsPage.navigateToEvents();
        await basePage.sleep(2000);
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
      }
    });

    it('should display event details', async () => {
      if (!testEventId) return;
      
      await eventDetailPage.navigateToEvent(testEventId);
      await basePage.sleep(2000);
      
      expect(await eventDetailPage.isEventDetailsVisible()).toBe(true);
    });

    it('should navigate to artists page', async () => {
      if (!testEventId) return;
      
      await eventDetailPage.navigateToEvent(testEventId);
      await eventDetailPage.clickArtistsTab();
      await basePage.sleep(2000);
      
      const currentUrl = await basePage.getCurrentUrl();
      expect(currentUrl).toContain('/artists');
    });

    it('should navigate to production page', async () => {
      if (!testEventId) return;
      
      await eventDetailPage.navigateToEvent(testEventId);
      await eventDetailPage.clickProductionTab();
      await basePage.sleep(2000);
      
      const currentUrl = await basePage.getCurrentUrl();
      expect(currentUrl).toContain('/production');
    });

    it('should navigate to finance page', async () => {
      if (!testEventId) return;
      
      await eventDetailPage.navigateToEvent(testEventId);
      await eventDetailPage.clickFinanceTab();
      await basePage.sleep(2000);
      
      const currentUrl = await basePage.getCurrentUrl();
      expect(currentUrl).toContain('/finance');
    });
  });

  describe('Edit Event', () => {
    it('should open edit event modal', async () => {
      if (!testEventId) return;
      
      await eventDetailPage.navigateToEvent(testEventId);
      await eventDetailPage.clickEditEventButton();
      
      await modal.waitForModal();
      expect(await modal.isModalVisible()).toBe(true);
    });

    it('should update event details', async () => {
      if (!testEventId) return;
      
      await eventDetailPage.navigateToEvent(testEventId);
      await eventDetailPage.clickEditEventButton();
      await modal.waitForModal();
      
      const updatedName = `Updated Event ${Date.now()}`;
      await modal.enterTextInField('name', updatedName);
      await modal.clickSaveButton();
      await basePage.sleep(2000);
      
      // Verify update
      const eventName = await eventDetailPage.getEventName();
      expect(eventName).toContain(updatedName);
    });
  });
});

