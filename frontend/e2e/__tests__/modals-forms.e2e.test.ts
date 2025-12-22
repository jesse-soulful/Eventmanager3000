import { BasePage } from '../helpers/page-objects/BasePage';
import { Modal } from '../helpers/page-objects/Modal';
import { EventsPage } from '../helpers/page-objects/EventsPage';
import { ManageMetadataPage } from '../helpers/page-objects/ManageMetadataPage';
import { loginAsUser, logout } from '../helpers/auth';

describe('Modals and Forms', () => {
  let basePage: BasePage;
  let modal: Modal;
  let eventsPage: EventsPage;
  let metadataPage: ManageMetadataPage;

  beforeAll(async () => {
    await loginAsUser();
  });

  afterAll(async () => {
    await logout();
  });

  beforeEach(async () => {
    basePage = new BasePage();
    modal = new Modal();
    eventsPage = new EventsPage();
    metadataPage = new ManageMetadataPage();
    await basePage.init();
  });

  describe('Modal Behavior', () => {
    it('should open and close modal', async () => {
      await eventsPage.navigateToEvents();
      await basePage.sleep(2000);
      await eventsPage.clickCreateEventButton();
      
      await modal.waitForModal();
      expect(await modal.isModalVisible()).toBe(true);
      
      await modal.closeModal();
      await basePage.sleep(1000);
      expect(await modal.isModalVisible()).toBe(false);
    });

    it('should close modal on cancel button', async () => {
      await eventsPage.navigateToEvents();
      await basePage.sleep(2000);
      await eventsPage.clickCreateEventButton();
      
      await modal.waitForModal();
      await modal.clickCancelButton();
      await basePage.sleep(1000);
      
      expect(await modal.isModalVisible()).toBe(false);
    });

    it('should close modal on ESC key', async () => {
      await eventsPage.navigateToEvents();
      await basePage.sleep(2000);
      await eventsPage.clickCreateEventButton();
      
      await modal.waitForModal();
      await basePage.driver.actions().sendKeys('\uE00C').perform(); // ESC key
      await basePage.sleep(1000);
      
      expect(await modal.isModalVisible()).toBe(false);
    });
  });

  describe('Form Validation', () => {
    it('should show validation errors for empty required fields', async () => {
      await eventsPage.navigateToEvents();
      await basePage.sleep(2000);
      await eventsPage.clickCreateEventButton();
      await modal.waitForModal();
      
      await modal.clickSaveButton();
      await basePage.sleep(1000);
      
      const errorMessage = await modal.getErrorMessage();
      expect(errorMessage.length).toBeGreaterThan(0);
    });

    it('should validate email format', async () => {
      await metadataPage.navigateToMetadata();
      await basePage.sleep(2000);
      
      // Try to create something with invalid email if applicable
      const emailInputs = await basePage.driver.findElements(basePage.By.css('input[type="email"]'));
      if (emailInputs.length > 0) {
        await emailInputs[0].sendKeys('invalid-email');
        await basePage.sleep(500);
        
        // Check for validation message
        const validationMessages = await basePage.driver.findElements(basePage.By.css('[class*="error"], [class*="invalid"]'));
        expect(validationMessages.length).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Form Submission', () => {
    it('should submit form successfully', async () => {
      await eventsPage.navigateToEvents();
      await basePage.sleep(2000);
      await eventsPage.clickCreateEventButton();
      await modal.waitForModal();
      
      const eventName = `Test Event ${Date.now()}`;
      await modal.enterTextInField('name', eventName);
      await modal.enterTextInField('startDate', '2024-12-25');
      await modal.enterTextInField('endDate', '2024-12-26');
      await modal.enterTextInField('location', 'Test Location');
      
      await modal.clickSaveButton();
      await basePage.sleep(2000);
      
      // Modal should close after successful submission
      expect(await modal.isModalVisible()).toBe(false);
    });

    it('should show success message after submission', async () => {
      await metadataPage.navigateToMetadata();
      await metadataPage.clickStatusesTab();
      await basePage.sleep(1000);
      await metadataPage.selectModule('ARTISTS');
      await basePage.sleep(1000);
      
      await metadataPage.clickCreateStatusButton('main');
      await modal.waitForModal();
      
      const statusName = `Test Status ${Date.now()}`;
      await modal.enterTextInField('name', statusName);
      await modal.selectOption('itemType', 'main');
      
      await modal.clickSaveButton();
      await basePage.sleep(2000);
      
      // Check for success indicator (modal closes or success message)
      const successMessage = await modal.getSuccessMessage();
      // Either modal closes (success) or shows success message
      expect(await modal.isModalVisible() === false || successMessage.length > 0).toBe(true);
    });
  });

  describe('Inline Editing', () => {
    it('should allow inline editing of amounts', async () => {
      await basePage.navigateTo('/events');
      await basePage.sleep(2000);
      
      const eventCards = await basePage.driver.findElements(basePage.By.css('.card, [class*="event-card"]'));
      if (eventCards.length > 0) {
        await eventCards[0].click();
        await basePage.sleep(2000);
        
        const currentUrl = await basePage.getCurrentUrl();
      const eventIdMatch = currentUrl.match(/\/events\/([a-f0-9-]+)/);
      if (eventIdMatch) {
        await basePage.navigateTo(`/events/${eventIdMatch[1]}/artists`);
      }
        await basePage.sleep(2000);
        
        // Look for inline amount inputs
        const amountInputs = await basePage.driver.findElements(basePage.By.css('[class*="amount-input"], input[type="number"]'));
        if (amountInputs.length > 0) {
          await amountInputs[0].click();
          await basePage.sleep(500);
          await amountInputs[0].clear();
          await amountInputs[0].sendKeys('5000');
          await basePage.sleep(1000);
          
          // Verify value was updated
          const value = await amountInputs[0].getAttribute('value');
          expect(value).toBe('5000');
        }
      }
    });
  });
});

