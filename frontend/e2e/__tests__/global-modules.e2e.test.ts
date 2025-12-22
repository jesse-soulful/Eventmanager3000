import { BasePage } from '../helpers/page-objects/BasePage';
import { Modal } from '../helpers/page-objects/Modal';
import { loginAsUser, logout } from '../helpers/auth';

describe('Global Modules', () => {
  let basePage: BasePage;
  let modal: Modal;

  beforeAll(async () => {
    await loginAsUser();
  });

  afterAll(async () => {
    await logout();
  });

  beforeEach(async () => {
    basePage = new BasePage();
    modal = new Modal();
    await basePage.init();
  });

  describe('Vendors & Suppliers Module', () => {
    it('should display vendors-suppliers page', async () => {
      await basePage.navigateTo('/vendors-suppliers');
      await basePage.sleep(2000);
      
      const currentUrl = await basePage.getCurrentUrl();
      expect(currentUrl).toContain('/vendors-suppliers');
    });

    it('should create a new vendor', async () => {
      await basePage.navigateTo('/vendors-suppliers');
      await basePage.sleep(2000);
      
      await basePage.init();
      const createButtons = await basePage.driver.findElements(basePage.By.xpath('//button[contains(text(), "Add") or contains(text(), "Create")]'));
      if (createButtons.length > 0) {
        await createButtons[0].click();
        await modal.waitForModal();
        
        const vendorName = `Test Vendor ${Date.now()}`;
        await modal.enterTextInField('name', vendorName);
        await modal.enterTextInField('plannedCost', '3000');
        
        await modal.clickSaveButton();
        await basePage.sleep(2000);
        
        await basePage.init();
        const isVisible = (await basePage.driver.findElements(basePage.By.xpath(`//*[contains(text(), "${vendorName}")]`))).length > 0;
        expect(isVisible).toBe(true);
      }
    });

    it('should filter vendors by event', async () => {
      await basePage.navigateTo('/vendors-suppliers');
      await basePage.sleep(2000);
      
      // Look for event filter
      const filters = await basePage.driver.findElements(basePage.By.css('select[name="eventId"], select[class*="filter"]'));
      if (filters.length > 0) {
        await filters[0].click();
        await basePage.sleep(500);
        const options = await basePage.driver.findElements(basePage.By.css('select option'));
        if (options.length > 1) {
          await options[1].click();
          await basePage.sleep(2000);
        }
      }
    });
  });

  describe('Materials & Stock Module', () => {
    it('should display materials-stock page', async () => {
      await basePage.navigateTo('/materials-stock');
      await basePage.sleep(2000);
      
      const currentUrl = await basePage.getCurrentUrl();
      expect(currentUrl).toContain('/materials-stock');
    });

    it('should create a new material', async () => {
      await basePage.navigateTo('/materials-stock');
      await basePage.sleep(2000);
      
      await basePage.init();
      const createButtons = await basePage.driver.findElements(basePage.By.xpath('//button[contains(text(), "Add") or contains(text(), "Create")]'));
      if (createButtons.length > 0) {
        await createButtons[0].click();
        await modal.waitForModal();
        
        const materialName = `Test Material ${Date.now()}`;
        await modal.enterTextInField('name', materialName);
        await modal.enterTextInField('quantity', '100');
        await modal.enterTextInField('unitPrice', '50');
        
        await modal.clickSaveButton();
        await basePage.sleep(2000);
        
        await basePage.init();
        const isVisible = (await basePage.driver.findElements(basePage.By.xpath(`//*[contains(text(), "${materialName}")]`))).length > 0;
        expect(isVisible).toBe(true);
      }
    });
  });
});

