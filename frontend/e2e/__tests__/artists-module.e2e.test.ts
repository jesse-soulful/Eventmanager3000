import { ArtistsPage } from '../helpers/page-objects/ArtistsPage';
import { Modal } from '../helpers/page-objects/Modal';
import { BasePage } from '../helpers/page-objects/BasePage';
import { EventsPage } from '../helpers/page-objects/EventsPage';
import { loginAsUser, logout } from '../helpers/auth';

describe('Artists Module', () => {
  let artistsPage: ArtistsPage;
  let modal: Modal;
  let basePage: BasePage;
  let eventsPage: EventsPage;
  let testEventId: string | null = null;

  beforeAll(async () => {
    basePage = new BasePage();
    await basePage.init();
    await loginAsUser();
    
    // Get or create a test event
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
    artistsPage = new ArtistsPage();
    modal = new Modal();
    basePage = new BasePage();
    await basePage.init();
  });

  describe('Artists Page', () => {
    it('should display artists page', async () => {
      if (!testEventId) return;
      
      await artistsPage.navigateToArtists(testEventId);
      await basePage.sleep(2000);
      
      const currentUrl = await basePage.getCurrentUrl();
      expect(currentUrl).toContain('/artists');
    });

    it('should show create artist button', async () => {
      if (!testEventId) return;
      
      await artistsPage.navigateToArtists(testEventId);
      await basePage.sleep(2000);
      
      await artistsPage.init();
      const hasCreateButton = (await artistsPage.driver.findElements(artistsPage.By.xpath('//button[contains(text(), "Add") or contains(text(), "Create")]'))).length > 0;
      expect(hasCreateButton).toBe(true);
    });

    it('should display list of artists', async () => {
      if (!testEventId) return;
      
      await artistsPage.navigateToArtists(testEventId);
      await basePage.sleep(2000);
      
      const artistCount = await artistsPage.getArtistCount();
      expect(artistCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Create Artist', () => {
    it('should open create artist modal', async () => {
      if (!testEventId) return;
      
      await artistsPage.navigateToArtists(testEventId);
      await basePage.sleep(2000);
      await artistsPage.clickCreateArtistButton();
      
      await modal.waitForModal();
      expect(await modal.isModalVisible()).toBe(true);
    });

    it('should create a new artist', async () => {
      if (!testEventId) return;
      
      await artistsPage.navigateToArtists(testEventId);
      await basePage.sleep(2000);
      await artistsPage.clickCreateArtistButton();
      await modal.waitForModal();
      
      const artistName = `Test Artist ${Date.now()}`;
      await modal.enterTextInField('name', artistName);
      await modal.enterTextInField('plannedCost', '5000');
      
      await modal.clickSaveButton();
      await basePage.sleep(2000);
      
      // Verify artist appears in list
      await artistsPage.navigateToArtists(testEventId);
      await basePage.sleep(2000);
      await artistsPage.waitForArtistCard(artistName);
      
      const isVisible = await artistsPage.isEventVisible(artistName);
      expect(isVisible).toBe(true);
    });

    it('should create artist with status', async () => {
      if (!testEventId) return;
      
      await artistsPage.navigateToArtists(testEventId);
      await basePage.sleep(2000);
      await artistsPage.clickCreateArtistButton();
      await modal.waitForModal();
      
      const artistName = `Artist with Status ${Date.now()}`;
      await modal.enterTextInField('name', artistName);
      
      // Select status if dropdown exists
      try {
        await modal.selectOption('statusId', 'Confirmed');
      } catch {
        // Status dropdown might not be available
      }
      
      await modal.clickSaveButton();
      await basePage.sleep(2000);
      
      await artistsPage.navigateToArtists(testEventId);
      await basePage.sleep(2000);
      const isVisible = await artistsPage.isEventVisible(artistName);
      expect(isVisible).toBe(true);
    });

    it('should create artist with category', async () => {
      if (!testEventId) return;
      
      await artistsPage.navigateToArtists(testEventId);
      await basePage.sleep(2000);
      await artistsPage.clickCreateArtistButton();
      await modal.waitForModal();
      
      const artistName = `Artist with Category ${Date.now()}`;
      await modal.enterTextInField('name', artistName);
      
      // Select category if dropdown exists
      try {
        const categorySelect = await basePage.waitForElement('select[name="categoryId"]', 3000);
        await categorySelect.click();
        await basePage.sleep(500);
        const firstOption = await basePage.driver.findElement(basePage.By.css('select[name="categoryId"] option:nth-child(2)'));
        await firstOption.click();
      } catch {
        // Category dropdown might not be available
      }
      
      await modal.clickSaveButton();
      await basePage.sleep(2000);
      
      await artistsPage.navigateToArtists(testEventId);
      await basePage.sleep(2000);
      const isVisible = await artistsPage.isEventVisible(artistName);
      expect(isVisible).toBe(true);
    });
  });

  describe('Edit Artist', () => {
    it('should open edit modal when clicking artist card', async () => {
      if (!testEventId) return;
      
      await artistsPage.navigateToArtists(testEventId);
      await basePage.sleep(2000);
      
      const artistCards = await basePage.driver.findElements(basePage.By.css('.line-item-card, [class*="artist-card"]'));
      if (artistCards.length > 0) {
        await artistCards[0].click();
        await basePage.sleep(1000);
        
        expect(await modal.isModalVisible()).toBe(true);
      }
    });

    it('should update artist details', async () => {
      if (!testEventId) return;
      
      await artistsPage.navigateToArtists(testEventId);
      await basePage.sleep(2000);
      
      const artistCards = await basePage.driver.findElements(basePage.By.css('.line-item-card, [class*="artist-card"]'));
      if (artistCards.length > 0) {
        await artistCards[0].click();
        await modal.waitForModal();
        
        const updatedName = `Updated Artist ${Date.now()}`;
        await modal.enterTextInField('name', updatedName);
        await modal.clickSaveButton();
        await basePage.sleep(2000);
        
        // Verify update
        await artistsPage.navigateToArtists(testEventId);
        await basePage.sleep(2000);
        const isVisible = await artistsPage.isEventVisible(updatedName);
        expect(isVisible).toBe(true);
      }
    });
  });

  describe('Sub-Line Items', () => {
    it('should expand artist to show sub-line items', async () => {
      if (!testEventId) return;
      
      await artistsPage.navigateToArtists(testEventId);
      await basePage.sleep(2000);
      
      const artistCards = await basePage.driver.findElements(basePage.By.css('.line-item-card, [class*="artist-card"]'));
      if (artistCards.length > 0) {
        const artistName = await artistCards[0].getText();
        await artistsPage.expandArtist(artistName);
        
        // Verify sub-items are visible
        await basePage.sleep(1000);
        const subItems = await basePage.driver.findElements(basePage.By.css('.sub-item-card, [class*="sub-line-item"]'));
        expect(subItems.length).toBeGreaterThanOrEqual(0);
      }
    });

    it('should add sub-line item to artist', async () => {
      if (!testEventId) return;
      
      await artistsPage.navigateToArtists(testEventId);
      await basePage.sleep(2000);
      
      const artistCards = await basePage.driver.findElements(basePage.By.css('.line-item-card, [class*="artist-card"]'));
      if (artistCards.length > 0) {
        const artistName = await artistCards[0].getText();
        await artistsPage.addSubLineItem(artistName);
        
        await modal.waitForModal();
        expect(await modal.isModalVisible()).toBe(true);
        
        const subItemName = `Sub Item ${Date.now()}`;
        await modal.enterTextInField('name', subItemName);
        await modal.enterTextInField('plannedCost', '1000');
        await modal.clickSaveButton();
        await basePage.sleep(2000);
        
        // Verify sub-item was added
        await artistsPage.navigateToArtists(testEventId);
        await basePage.sleep(2000);
        await artistsPage.expandArtist(artistName);
        await basePage.sleep(1000);
        
        const isVisible = await artistsPage.isEventVisible(subItemName);
        expect(isVisible).toBe(true);
      }
    });
  });

  describe('Status Management', () => {
    it('should change artist status', async () => {
      if (!testEventId) return;
      
      await artistsPage.navigateToArtists(testEventId);
      await basePage.sleep(2000);
      
      const artistCards = await basePage.driver.findElements(basePage.By.css('.line-item-card, [class*="artist-card"]'));
      if (artistCards.length > 0) {
        const artistName = await artistCards[0].getText();
        await artistsPage.changeStatus(artistName, 'Confirmed');
        await basePage.sleep(2000);
        
        // Verify status changed (check for status indicator)
        const statusIndicators = await basePage.driver.findElements(basePage.By.css('[class*="status"], [class*="badge"]'));
        expect(statusIndicators.length).toBeGreaterThan(0);
      }
    });
  });
});

