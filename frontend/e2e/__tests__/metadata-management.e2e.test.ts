import { ManageMetadataPage } from '../helpers/page-objects/ManageMetadataPage';
import { Modal } from '../helpers/page-objects/Modal';
import { BasePage } from '../helpers/page-objects/BasePage';
import { loginAsUser, logout } from '../helpers/auth';

describe('Metadata Management', () => {
  let metadataPage: ManageMetadataPage;
  let modal: Modal;
  let basePage: BasePage;

  beforeAll(async () => {
    await loginAsUser();
  });

  afterAll(async () => {
    await logout();
  });

  beforeEach(async () => {
    metadataPage = new ManageMetadataPage();
    modal = new Modal();
    basePage = new BasePage();
    await basePage.init();
  });

  describe('Statuses Management', () => {
    it('should display statuses tab', async () => {
      await metadataPage.navigateToMetadata();
      await metadataPage.clickStatusesTab();
      await basePage.sleep(1000);
      
      const currentUrl = await basePage.getCurrentUrl();
      expect(currentUrl).toContain('/manage-metadata');
    });

    it('should create a new main status', async () => {
      await metadataPage.navigateToMetadata();
      await metadataPage.clickStatusesTab();
      await basePage.sleep(1000);
      await metadataPage.selectModule('ARTISTS');
      await basePage.sleep(1000);
      
      await metadataPage.clickCreateStatusButton('main');
      await modal.waitForModal();
      
      const statusName = `Test Status ${Date.now()}`;
      await modal.enterTextInField('name', statusName);
      await modal.enterTextInField('color', '#FF5733');
      await modal.selectOption('itemType', 'main');
      
      await modal.clickSaveButton();
      await basePage.sleep(2000);
      
      // Verify status was created
      await metadataPage.navigateToMetadata();
      await metadataPage.clickStatusesTab();
      await basePage.sleep(2000);
      const statusCount = await metadataPage.getStatusCount();
      expect(statusCount).toBeGreaterThan(0);
    });

    it('should create a new sub status', async () => {
      await metadataPage.navigateToMetadata();
      await metadataPage.clickStatusesTab();
      await basePage.sleep(1000);
      await metadataPage.selectModule('ARTISTS');
      await basePage.sleep(1000);
      
      await metadataPage.clickCreateStatusButton('sub');
      await modal.waitForModal();
      
      const statusName = `Test Sub Status ${Date.now()}`;
      await modal.enterTextInField('name', statusName);
      await modal.selectOption('itemType', 'sub');
      
      await modal.clickSaveButton();
      await basePage.sleep(2000);
      
      // Verify status was created
      const statusCount = await metadataPage.getStatusCount();
      expect(statusCount).toBeGreaterThan(0);
    });

    it('should prevent duplicate status names', async () => {
      await metadataPage.navigateToMetadata();
      await metadataPage.clickStatusesTab();
      await basePage.sleep(1000);
      await metadataPage.selectModule('ARTISTS');
      await basePage.sleep(1000);
      
      const statusName = `Duplicate Status ${Date.now()}`;
      
      // Create first status
      await metadataPage.clickCreateStatusButton('main');
      await modal.waitForModal();
      await modal.enterTextInField('name', statusName);
      await modal.selectOption('itemType', 'main');
      await modal.clickSaveButton();
      await basePage.sleep(2000);
      
      // Try to create duplicate
      await metadataPage.clickCreateStatusButton('main');
      await modal.waitForModal();
      await modal.enterTextInField('name', statusName);
      await modal.selectOption('itemType', 'main');
      await modal.clickSaveButton();
      await basePage.sleep(2000);
      
      const errorMessage = await modal.getErrorMessage();
      expect(errorMessage.length).toBeGreaterThan(0);
    });
  });

  describe('Categories Management', () => {
    it('should display categories tab', async () => {
      await metadataPage.navigateToMetadata();
      await metadataPage.clickCategoriesTab();
      await basePage.sleep(1000);
      
      const currentUrl = await basePage.getCurrentUrl();
      expect(currentUrl).toContain('/manage-metadata');
    });

    it('should create a new category', async () => {
      await metadataPage.navigateToMetadata();
      await metadataPage.clickCategoriesTab();
      await basePage.sleep(1000);
      await metadataPage.selectModule('ARTISTS');
      await basePage.sleep(1000);
      
      await metadataPage.clickCreateCategoryButton();
      await modal.waitForModal();
      
      const categoryName = `Test Category ${Date.now()}`;
      await modal.enterTextInField('name', categoryName);
      await modal.enterTextInField('description', 'Test Description');
      await modal.enterTextInField('color', '#3B82F6');
      
      await modal.clickSaveButton();
      await basePage.sleep(2000);
      
      // Verify category was created
      await metadataPage.navigateToMetadata();
      await metadataPage.clickCategoriesTab();
      await basePage.sleep(2000);
      const categoryCount = await metadataPage.getCategoryCount();
      expect(categoryCount).toBeGreaterThan(0);
    });

    it('should prevent duplicate category names', async () => {
      await metadataPage.navigateToMetadata();
      await metadataPage.clickCategoriesTab();
      await basePage.sleep(1000);
      await metadataPage.selectModule('ARTISTS');
      await basePage.sleep(1000);
      
      const categoryName = `Duplicate Category ${Date.now()}`;
      
      // Create first category
      await metadataPage.clickCreateCategoryButton();
      await modal.waitForModal();
      await modal.enterTextInField('name', categoryName);
      await modal.clickSaveButton();
      await basePage.sleep(2000);
      
      // Try to create duplicate
      await metadataPage.clickCreateCategoryButton();
      await modal.waitForModal();
      await modal.enterTextInField('name', categoryName);
      await modal.clickSaveButton();
      await basePage.sleep(2000);
      
      const errorMessage = await modal.getErrorMessage();
      expect(errorMessage.length).toBeGreaterThan(0);
    });
  });

  describe('Tags Management', () => {
    it('should display tags tab', async () => {
      await metadataPage.navigateToMetadata();
      await metadataPage.clickTagsTab();
      await basePage.sleep(1000);
      
      const currentUrl = await basePage.getCurrentUrl();
      expect(currentUrl).toContain('/manage-metadata');
    });

    it('should create a new tag', async () => {
      await metadataPage.navigateToMetadata();
      await metadataPage.clickTagsTab();
      await basePage.sleep(1000);
      await metadataPage.selectModule('ARTISTS');
      await basePage.sleep(1000);
      
      await metadataPage.clickCreateTagButton();
      await modal.waitForModal();
      
      const tagName = `Test Tag ${Date.now()}`;
      await modal.enterTextInField('name', tagName);
      await modal.enterTextInField('color', '#10B981');
      
      await modal.clickSaveButton();
      await basePage.sleep(2000);
      
      // Verify tag was created
      await metadataPage.navigateToMetadata();
      await metadataPage.clickTagsTab();
      await basePage.sleep(2000);
      const tagCount = await metadataPage.getTagCount();
      expect(tagCount).toBeGreaterThan(0);
    });
  });

  describe('Sub-Line Item Types Management', () => {
    it('should display sub-line item types tab', async () => {
      await metadataPage.navigateToMetadata();
      await metadataPage.clickSubLineItemTypesTab();
      await basePage.sleep(1000);
      
      const currentUrl = await basePage.getCurrentUrl();
      expect(currentUrl).toContain('/manage-metadata');
    });

    it('should create a new sub-line item type', async () => {
      await metadataPage.navigateToMetadata();
      await metadataPage.clickSubLineItemTypesTab();
      await basePage.sleep(1000);
      await metadataPage.selectModule('ARTISTS');
      await basePage.sleep(1000);
      
      await metadataPage.clickCreateSubLineItemTypeButton();
      await modal.waitForModal();
      
      const typeName = `Test Type ${Date.now()}`;
      await modal.enterTextInField('name', typeName);
      await modal.enterTextInField('description', 'Test Description');
      
      await modal.clickSaveButton();
      await basePage.sleep(2000);
      
      // Verify type was created
      const types = await basePage.driver.findElements(basePage.By.css('[class*="type"], [class*="sub-line-item-type"]'));
      expect(types.length).toBeGreaterThan(0);
    });
  });
});

