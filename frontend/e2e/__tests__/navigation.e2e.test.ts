import { BasePage } from '../helpers/page-objects/BasePage';
import { loginAsUser, logout } from '../helpers/auth';

describe('Navigation', () => {
  let basePage: BasePage;

  beforeAll(async () => {
    await loginAsUser();
  });

  afterAll(async () => {
    await logout();
  });

  beforeEach(async () => {
    basePage = new BasePage();
    await basePage.init();
  });

  describe('Main Navigation', () => {
    it('should navigate to events page', async () => {
      await basePage.navigateTo('/events');
      await basePage.sleep(2000);
      
      const currentUrl = await basePage.getCurrentUrl();
      expect(currentUrl).toContain('/events');
    });

    it('should navigate to vendors-suppliers page', async () => {
      await basePage.navigateTo('/vendors-suppliers');
      await basePage.sleep(2000);
      
      const currentUrl = await basePage.getCurrentUrl();
      expect(currentUrl).toContain('/vendors-suppliers');
    });

    it('should navigate to materials-stock page', async () => {
      await basePage.navigateTo('/materials-stock');
      await basePage.sleep(2000);
      
      const currentUrl = await basePage.getCurrentUrl();
      expect(currentUrl).toContain('/materials-stock');
    });

    it('should navigate to staff-pool page', async () => {
      await basePage.navigateTo('/staff-pool');
      await basePage.sleep(2000);
      
      const currentUrl = await basePage.getCurrentUrl();
      expect(currentUrl).toContain('/staff-pool');
    });

    it('should navigate to finance board', async () => {
      await basePage.navigateTo('/finance');
      await basePage.sleep(2000);
      
      const currentUrl = await basePage.getCurrentUrl();
      expect(currentUrl).toContain('/finance');
    });

    it('should navigate to manage metadata page', async () => {
      await basePage.navigateTo('/manage-metadata');
      await basePage.sleep(2000);
      
      const currentUrl = await basePage.getCurrentUrl();
      expect(currentUrl).toContain('/manage-metadata');
    });
  });

  describe('Breadcrumbs', () => {
    it('should display breadcrumbs on event detail page', async () => {
      await basePage.navigateTo('/events');
      await basePage.sleep(2000);
      
      const eventCards = await basePage.driver.findElements(basePage.By.css('.card, [class*="event-card"]'));
      if (eventCards.length > 0) {
        await eventCards[0].click();
        await basePage.sleep(2000);
        
        const breadcrumbs = await basePage.driver.findElements(basePage.By.css('[class*="breadcrumb"], nav[aria-label="Breadcrumb"]'));
        expect(breadcrumbs.length).toBeGreaterThan(0);
      }
    });

    it('should navigate via breadcrumbs', async () => {
      await basePage.navigateTo('/events');
      await basePage.sleep(2000);
      
      const eventCards = await basePage.driver.findElements(basePage.By.css('.card, [class*="event-card"]'));
      if (eventCards.length > 0) {
        await eventCards[0].click();
        await basePage.sleep(2000);
        
        const breadcrumbLinks = await basePage.driver.findElements(basePage.By.css('[class*="breadcrumb"] a'));
        if (breadcrumbLinks.length > 0) {
          await breadcrumbLinks[0].click();
          await basePage.sleep(2000);
          
          const currentUrl = await basePage.getCurrentUrl();
          expect(currentUrl).toContain('/events');
        }
      }
    });
  });

  describe('User Menu', () => {
    it('should display user menu', async () => {
      await basePage.navigateTo('/events');
      await basePage.sleep(2000);
      
      const userMenu = await basePage.driver.findElements(basePage.By.css('[aria-label="User menu"], button[class*="user-menu"]'));
      expect(userMenu.length).toBeGreaterThan(0);
    });

    it('should open profile modal from user menu', async () => {
      await basePage.navigateTo('/events');
      await basePage.sleep(2000);
      
      const userMenuButtons = await basePage.driver.findElements(basePage.By.css('[aria-label="User menu"], button[class*="user-menu"]'));
      if (userMenuButtons.length > 0) {
        await userMenuButtons[0].click();
        await basePage.sleep(1000);
        
        await basePage.init();
        const profileLinks = await basePage.driver.findElements(basePage.By.xpath('//a[contains(text(), "Profile")] | //button[contains(text(), "Profile")]'));
        if (profileLinks.length > 0) {
          await profileLinks[0].click();
          await basePage.sleep(2000);
          
          const modal = await basePage.driver.findElements(basePage.By.css('.modal-overlay, [class*="modal"]'));
          expect(modal.length).toBeGreaterThan(0);
        }
      }
    });
  });
});

