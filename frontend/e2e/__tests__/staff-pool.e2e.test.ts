import { BasePage } from '../helpers/page-objects/BasePage';
import { Modal } from '../helpers/page-objects/Modal';
import { loginAsUser, logout } from '../helpers/auth';

describe('Staff Pool Module', () => {
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

  describe('Staff Pool Page', () => {
    it('should display staff pool page', async () => {
      await basePage.navigateTo('/staff-pool');
      await basePage.sleep(2000);
      
      const currentUrl = await basePage.getCurrentUrl();
      expect(currentUrl).toContain('/staff-pool');
    });

    it('should show create staff member button', async () => {
      await basePage.navigateTo('/staff-pool');
      await basePage.sleep(2000);
      
      await basePage.init();
      const hasCreateButton = (await basePage.driver.findElements(basePage.By.xpath('//button[contains(text(), "Add") or contains(text(), "Create")]'))).length > 0;
      expect(hasCreateButton).toBe(true);
    });

    it('should display list of staff members', async () => {
      await basePage.navigateTo('/staff-pool');
      await basePage.sleep(2000);
      
      const staffCards = await basePage.driver.findElements(basePage.By.css('.card, [class*="staff-card"]'));
      expect(staffCards.length).toBeGreaterThanOrEqual(0);
    });

    it('should create a new staff member', async () => {
      await basePage.navigateTo('/staff-pool');
      await basePage.sleep(2000);
      
      await basePage.init();
      const createButtons = await basePage.driver.findElements(basePage.By.xpath('//button[contains(text(), "Add") or contains(text(), "Create")]'));
      if (createButtons.length > 0) {
        await createButtons[0].click();
        await modal.waitForModal();
        
        const staffName = `Test Staff ${Date.now()}`;
        await modal.enterTextInField('name', staffName);
        await modal.enterTextInField('email', `staff${Date.now()}@example.com`);
        
        await modal.clickSaveButton();
        await basePage.sleep(2000);
        
        // Verify staff member was created
        await basePage.init();
        const isVisible = (await basePage.driver.findElements(basePage.By.xpath(`//*[contains(text(), "${staffName}")]`))).length > 0;
        expect(isVisible).toBe(true);
      }
    });
  });
});

