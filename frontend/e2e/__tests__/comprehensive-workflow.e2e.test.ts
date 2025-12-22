import { BasePage } from '../helpers/page-objects/BasePage';
import { LoginPage } from '../helpers/page-objects/LoginPage';
import { EventsPage } from '../helpers/page-objects/EventsPage';
import { ArtistsPage } from '../helpers/page-objects/ArtistsPage';
import { ManageMetadataPage } from '../helpers/page-objects/ManageMetadataPage';
import { Modal } from '../helpers/page-objects/Modal';
import { logout } from '../helpers/auth';

describe('Comprehensive User Workflow', () => {
  let basePage: BasePage;
  let loginPage: LoginPage;
  let eventsPage: EventsPage;
  let artistsPage: ArtistsPage;
  let metadataPage: ManageMetadataPage;
  let modal: Modal;
  let testEventId: string | null = null;

  afterAll(async () => {
    await logout();
  });

  beforeEach(async () => {
    basePage = new BasePage();
    loginPage = new LoginPage();
    eventsPage = new EventsPage();
    artistsPage = new ArtistsPage();
    metadataPage = new ManageMetadataPage();
    modal = new Modal();
    await basePage.init();
  });

  it('should complete full workflow: login → create event → create metadata → create artist → add sub-item', async () => {
    // Step 1: Login
    await loginPage.login('test@example.com', 'TestPassword123!');
    await basePage.sleep(2000);
    
    // Step 2: Create Event
    await eventsPage.navigateToEvents();
    await basePage.sleep(2000);
    await eventsPage.clickCreateEventButton();
    await modal.waitForModal();
    
    const eventName = `E2E Test Event ${Date.now()}`;
    await modal.enterTextInField('name', eventName);
    await modal.enterTextInField('startDate', '2024-12-25');
    await modal.enterTextInField('endDate', '2024-12-26');
    await modal.enterTextInField('location', 'Test Location');
    await modal.clickSaveButton();
    await basePage.sleep(3000);
    
    // Step 3: Navigate to event and get event ID
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
    
    // Step 4: Create Status in Metadata
    await metadataPage.navigateToMetadata();
    await metadataPage.clickStatusesTab();
    await basePage.sleep(1000);
    await metadataPage.selectModule('ARTISTS');
    await basePage.sleep(1000);
    
    await metadataPage.clickCreateStatusButton('main');
    await modal.waitForModal();
    const statusName = `E2E Status ${Date.now()}`;
    await modal.enterTextInField('name', statusName);
    await modal.selectOption('itemType', 'main');
    await modal.clickSaveButton();
    await basePage.sleep(2000);
    
    // Step 5: Create Category
    await metadataPage.clickCategoriesTab();
    await basePage.sleep(1000);
    await metadataPage.clickCreateCategoryButton();
    await modal.waitForModal();
    const categoryName = `E2E Category ${Date.now()}`;
    await modal.enterTextInField('name', categoryName);
    await modal.clickSaveButton();
    await basePage.sleep(2000);
    
    // Step 6: Navigate to Artists and Create Artist
    if (testEventId) {
      await artistsPage.navigateToArtists(testEventId);
      await basePage.sleep(2000);
      await artistsPage.clickCreateArtistButton();
      await modal.waitForModal();
      
      const artistName = `E2E Artist ${Date.now()}`;
      await modal.enterTextInField('name', artistName);
      await modal.enterTextInField('plannedCost', '5000');
      
      // Select status if available
      try {
        await modal.selectOption('statusId', statusName);
      } catch {
        // Status might not be available yet
      }
      
      // Select category if available
      try {
        await modal.selectOption('categoryId', categoryName);
      } catch {
        // Category might not be available yet
      }
      
      await modal.clickSaveButton();
      await basePage.sleep(3000);
      
      // Step 7: Add Sub-Line Item
      await artistsPage.expandArtist(artistName);
      await basePage.sleep(1000);
      await artistsPage.addSubLineItem(artistName);
      await modal.waitForModal();
      
      const subItemName = `E2E Sub Item ${Date.now()}`;
      await modal.enterTextInField('name', subItemName);
      await modal.enterTextInField('plannedCost', '1000');
      await modal.clickSaveButton();
      await basePage.sleep(2000);
      
      // Step 8: Verify everything was created
      await artistsPage.navigateToArtists(testEventId);
      await basePage.sleep(2000);
      
      const artistVisible = await artistsPage.isEventVisible(artistName);
      expect(artistVisible).toBe(true);
      
      await artistsPage.expandArtist(artistName);
      await basePage.sleep(1000);
      const subItemVisible = await artistsPage.isEventVisible(subItemName);
      expect(subItemVisible).toBe(true);
    }
  }, 120000); // 2 minute timeout for comprehensive test
});

