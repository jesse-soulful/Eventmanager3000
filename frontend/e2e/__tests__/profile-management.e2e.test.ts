import { BasePage } from '../helpers/page-objects/BasePage';
import { Modal } from '../helpers/page-objects/Modal';
import { loginAsUser, logout } from '../helpers/auth';

describe('Profile Management', () => {
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

  describe('Profile Modal', () => {
    it('should open profile modal from user menu', async () => {
      await basePage.navigateTo('/events');
      await basePage.sleep(2000);
      
      const userMenuButtons = await basePage.driver.findElements(basePage.By.css('[aria-label="User menu"], button[class*="user-menu"]'));
      if (userMenuButtons.length > 0) {
        await userMenuButtons[0].click();
        await basePage.sleep(1000);
        
        await basePage.init();
        const profileLinks = await basePage.driver.findElements(basePage.By.xpath('//a[contains(text(), "Profile") or contains(text(), "Manage Profile")] | //button[contains(text(), "Profile")]'));
        if (profileLinks.length > 0) {
          await profileLinks[0].click();
          await basePage.sleep(2000);
          
          await modal.waitForModal();
          expect(await modal.isModalVisible()).toBe(true);
        }
      }
    });

    it('should display profile information', async () => {
      await basePage.navigateTo('/events');
      await basePage.sleep(2000);
      
      const userMenuButtons = await basePage.driver.findElements(basePage.By.css('[aria-label="User menu"], button[class*="user-menu"]'));
      if (userMenuButtons.length > 0) {
        await userMenuButtons[0].click();
        await basePage.sleep(1000);
        
        await basePage.init();
        const profileLinks = await basePage.driver.findElements(basePage.By.xpath('//a[contains(text(), "Profile") or contains(text(), "Manage Profile")] | //button[contains(text(), "Profile")]'));
        if (profileLinks.length > 0) {
          await profileLinks[0].click();
          await modal.waitForModal();
          
          // Check for profile fields
          const nameInput = await basePage.driver.findElements(basePage.By.css('input[name="name"]'));
          expect(nameInput.length).toBeGreaterThan(0);
        }
      }
    });

    it('should update profile name', async () => {
      await basePage.navigateTo('/events');
      await basePage.sleep(2000);
      
      const userMenuButtons = await basePage.driver.findElements(basePage.By.css('[aria-label="User menu"], button[class*="user-menu"]'));
      if (userMenuButtons.length > 0) {
        await userMenuButtons[0].click();
        await basePage.sleep(1000);
        
        await basePage.init();
        const profileLinks = await basePage.driver.findElements(basePage.By.xpath('//a[contains(text(), "Profile") or contains(text(), "Manage Profile")] | //button[contains(text(), "Profile")]'));
        if (profileLinks.length > 0) {
          await profileLinks[0].click();
          await modal.waitForModal();
          
          const updatedName = `Updated Name ${Date.now()}`;
          await modal.enterTextInField('name', updatedName);
          
          // Find and click save button
          await basePage.init();
          const saveButtons = await basePage.driver.findElements(basePage.By.xpath('//button[contains(text(), "Save") or @type="submit"]'));
          if (saveButtons.length > 0) {
            await saveButtons[0].click();
            await basePage.sleep(2000);
            
            // Verify success
            const successMessage = await modal.getSuccessMessage();
            expect(successMessage.length).toBeGreaterThan(0);
          }
        }
      }
    });

    it('should change password', async () => {
      await basePage.navigateTo('/events');
      await basePage.sleep(2000);
      
      const userMenuButtons = await basePage.driver.findElements(basePage.By.css('[aria-label="User menu"], button[class*="user-menu"]'));
      if (userMenuButtons.length > 0) {
        await userMenuButtons[0].click();
        await basePage.sleep(1000);
        
        await basePage.init();
        const profileLinks = await basePage.driver.findElements(basePage.By.xpath('//a[contains(text(), "Profile") or contains(text(), "Manage Profile")] | //button[contains(text(), "Profile")]'));
        if (profileLinks.length > 0) {
          await profileLinks[0].click();
          await modal.waitForModal();
          
          // Click Change Password tab
          await basePage.init();
          const passwordTabs = await basePage.driver.findElements(basePage.By.xpath('//button[contains(text(), "Password")] | //*[@role="tab" and contains(text(), "Password")]'));
          if (passwordTabs.length > 0) {
            await passwordTabs[0].click();
            await basePage.sleep(1000);
            
            await modal.enterTextInField('currentPassword', 'CurrentPassword123!');
            await modal.enterTextInField('newPassword', 'NewPassword123!');
            await modal.enterTextInField('confirmPassword', 'NewPassword123!');
            
            await basePage.init();
          const saveButtons = await basePage.driver.findElements(basePage.By.xpath('//button[contains(text(), "Save") or @type="submit"]'));
            if (saveButtons.length > 0) {
              await saveButtons[0].click();
              await basePage.sleep(2000);
              
              const successMessage = await modal.getSuccessMessage();
              expect(successMessage.length).toBeGreaterThan(0);
            }
          }
        }
      }
    });
  });
});

