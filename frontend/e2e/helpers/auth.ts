import { LoginPage } from '../helpers/page-objects/LoginPage';

const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'TestPassword123!';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'AdminPassword123!';

export async function loginAsUser(email: string = TEST_USER_EMAIL, password: string = TEST_USER_PASSWORD): Promise<void> {
  const loginPage = new LoginPage();
  await loginPage.login(email, password);
}

export async function loginAsAdmin(): Promise<void> {
  await loginAsUser(ADMIN_EMAIL, ADMIN_PASSWORD);
}

export async function logout(): Promise<void> {
  const loginPage = new LoginPage();
  await loginPage.init();
  
  // Try to click logout button via user menu
  try {
    // Click user menu button
    const userMenuButtons = await loginPage.driver.findElements(loginPage.By.css('[aria-label="User menu"], button[class*="user-menu"], button[class*="user"]'));
    if (userMenuButtons.length > 0) {
      await userMenuButtons[0].click();
      await loginPage.sleep(1000);
      
      // Click logout/sign out button
      const logoutButtons = await loginPage.driver.findElements(loginPage.By.xpath('//button[contains(text(), "Sign out") or contains(text(), "Logout")]'));
      if (logoutButtons.length > 0) {
        await logoutButtons[0].click();
        await loginPage.sleep(2000); // Wait for logout to complete
      }
    }
  } catch (e) {
    // If logout button not found, just navigate to login
    console.log('Logout button not found, navigating to login');
  }
  
  // Ensure we're on login page
  const currentUrl = await loginPage.getCurrentUrl();
  if (!currentUrl.includes('/login')) {
    await loginPage.navigateTo('/login');
    await loginPage.sleep(1000);
  }
}

export { TEST_USER_EMAIL, TEST_USER_PASSWORD, ADMIN_EMAIL, ADMIN_PASSWORD };

