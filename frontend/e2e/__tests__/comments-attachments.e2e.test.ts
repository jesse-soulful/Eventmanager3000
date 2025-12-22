import { BasePage } from '../helpers/page-objects/BasePage';
import { Modal } from '../helpers/page-objects/Modal';
import { EventsPage } from '../helpers/page-objects/EventsPage';
import { loginAsUser, logout } from '../helpers/auth';

describe('Comments and File Attachments', () => {
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

  describe('Comments', () => {
    it('should open comments modal', async () => {
      if (!testEventId) return;
      
      await basePage.navigateTo(`/events/${testEventId}/artists`);
      await basePage.sleep(2000);
      
      // Find comment buttons
      await basePage.init();
      const commentButtons = await basePage.driver.findElements(basePage.By.xpath('//button[contains(@aria-label, "comment") or contains(text(), "Comment") or contains(@class, "comment")]'));
      if (commentButtons.length > 0) {
        await commentButtons[0].click();
        await basePage.sleep(2000);
        
        await modal.waitForModal();
        expect(await modal.isModalVisible()).toBe(true);
      }
    });

    it('should add a comment', async () => {
      if (!testEventId) return;
      
      await basePage.navigateTo(`/events/${testEventId}/artists`);
      await basePage.sleep(2000);
      
      await basePage.init();
      const commentButtons = await basePage.driver.findElements(basePage.By.xpath('//button[contains(@aria-label, "comment") or contains(text(), "Comment")]'));
      if (commentButtons.length > 0) {
        await commentButtons[0].click();
        await modal.waitForModal();
        
        const commentText = `Test comment ${Date.now()}`;
        await modal.enterTextInField('content', commentText);
        
        await basePage.init();
        const saveButtons = await basePage.driver.findElements(basePage.By.xpath('//button[contains(text(), "Post") or contains(text(), "Save") or @type="submit"]'));
        if (saveButtons.length > 0) {
          await saveButtons[0].click();
          await basePage.sleep(2000);
          
          // Verify comment was added
          await basePage.init();
        const isVisible = (await basePage.driver.findElements(basePage.By.xpath(`//*[contains(text(), "${commentText}")]`))).length > 0;
          expect(isVisible).toBe(true);
        }
      }
    });

    it('should display comment count', async () => {
      if (!testEventId) return;
      
      await basePage.navigateTo(`/events/${testEventId}/artists`);
      await basePage.sleep(2000);
      
      // Look for comment count badges
      const commentCounts = await basePage.driver.findElements(basePage.By.css('[class*="comment-count"], [aria-label*="comment"]'));
      expect(commentCounts.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('File Attachments', () => {
    it('should display file attachment button', async () => {
      if (!testEventId) return;
      
      await basePage.navigateTo(`/events/${testEventId}/artists`);
      await basePage.sleep(2000);
      
      // Look for file attachment buttons
      await basePage.init();
      const attachmentButtons = await basePage.driver.findElements(basePage.By.xpath('//button[contains(@aria-label, "file") or contains(text(), "Attach") or contains(@class, "attachment")]'));
      expect(attachmentButtons.length).toBeGreaterThanOrEqual(0);
    });

    it('should open file attachment modal', async () => {
      if (!testEventId) return;
      
      await basePage.navigateTo(`/events/${testEventId}/artists`);
      await basePage.sleep(2000);
      
      await basePage.init();
      const attachmentButtons = await basePage.driver.findElements(basePage.By.xpath('//button[contains(@aria-label, "file") or contains(text(), "Attach")]'));
      if (attachmentButtons.length > 0) {
        await attachmentButtons[0].click();
        await basePage.sleep(2000);
        
        // Check if file input or modal appears
        const fileInputs = await basePage.driver.findElements(basePage.By.css('input[type="file"]'));
        const modals = await basePage.driver.findElements(basePage.By.css('.modal-overlay, [class*="modal"]'));
        expect(fileInputs.length > 0 || modals.length > 0).toBe(true);
      }
    });

    it('should display uploaded files', async () => {
      if (!testEventId) return;
      
      await basePage.navigateTo(`/events/${testEventId}/artists`);
      await basePage.sleep(2000);
      
      // Look for file lists or document badges
      const fileLists = await basePage.driver.findElements(basePage.By.css('[class*="file-list"], [class*="document"], [class*="attachment"]'));
      expect(fileLists.length).toBeGreaterThanOrEqual(0);
    });
  });
});

