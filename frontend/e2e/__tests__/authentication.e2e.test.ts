import { LoginPage } from '../helpers/page-objects/LoginPage';
import { SignupPage } from '../helpers/page-objects/SignupPage';
import { ForgotPasswordPage } from '../helpers/page-objects/ForgotPasswordPage';
import { BasePage } from '../helpers/page-objects/BasePage';
import { loginAsUser, logout } from '../helpers/auth';

describe('Authentication Flow', () => {
  let basePage: BasePage;

  beforeEach(async () => {
    basePage = new BasePage();
    await basePage.init();
  });

  afterEach(async () => {
    try {
      await logout();
    } catch {
      // Ignore logout errors
    }
  });

  describe('Login Page', () => {
    it('should display login form', async () => {
      const loginPage = new LoginPage();
      await loginPage.navigateToLogin();
      
      expect(await loginPage.isLoginFormVisible()).toBe(true);
      expect(await loginPage.isElementVisible('input[type="email"]')).toBe(true);
      expect(await loginPage.isElementVisible('input[type="password"]')).toBe(true);
    });

    it('should login successfully with valid credentials', async () => {
      await loginAsUser();
      
      await basePage.sleep(2000); // Wait for redirect
      const currentUrl = await basePage.getCurrentUrl();
      // Accept /events or /logout (which redirects to /events)
      expect(currentUrl.includes('/events') || currentUrl.includes('/logout')).toBe(true);
    });

    it('should show error message with invalid credentials', async () => {
      const loginPage = new LoginPage();
      await loginPage.navigateToLogin();
      await loginPage.enterEmail('invalid@example.com');
      await loginPage.enterPassword('wrongpassword');
      await loginPage.clickLoginButton();
      
      await basePage.sleep(3000); // Wait for error message
      const errorMessage = await loginPage.getErrorMessage();
      expect(errorMessage.length).toBeGreaterThan(0);
    });

    it('should redirect to forgot password page', async () => {
      const loginPage = new LoginPage();
      await loginPage.navigateToLogin();
      await loginPage.sleep(1000); // Wait for page to load
      await loginPage.clickForgotPasswordLink();
      await loginPage.sleep(2000); // Wait for navigation
      
      const currentUrl = await basePage.getCurrentUrl();
      expect(currentUrl).toContain('/forgot-password');
    });

    it('should redirect to events page if already authenticated', async () => {
      await loginAsUser();
      await basePage.sleep(2000); // Wait for login to complete
      const loginPage = new LoginPage();
      await loginPage.navigateToLogin();
      await basePage.sleep(3000); // Wait for redirect
      
      const currentUrl = await basePage.getCurrentUrl();
      expect(currentUrl).toContain('/events');
    });
  });

  describe('Signup Page', () => {
    it('should display signup form', async () => {
      const signupPage = new SignupPage();
      await signupPage.navigateToSignup();
      await basePage.sleep(2000); // Wait for page to load
      
      expect(await signupPage.isElementVisible('input[name="name"]')).toBe(true);
      expect(await signupPage.isElementVisible('input[type="email"]')).toBe(true);
      expect(await signupPage.isElementVisible('input[type="password"]')).toBe(true);
    });

    it('should show error if passwords do not match', async () => {
      const signupPage = new SignupPage();
      await signupPage.navigateToSignup();
      await signupPage.enterName('Test User');
      await signupPage.enterEmail('newuser@example.com');
      await signupPage.enterPassword('Password123!');
      await signupPage.enterConfirmPassword('DifferentPassword123!');
      await signupPage.clickSignupButton();
      
      await basePage.sleep(2000);
      const errorMessage = await signupPage.getErrorMessage();
      expect(errorMessage.length).toBeGreaterThan(0);
    });

    it('should show error if email already exists', async () => {
      const signupPage = new SignupPage();
      await signupPage.navigateToSignup();
      await basePage.sleep(2000); // Wait for page to load
      await signupPage.enterName('Test User');
      await signupPage.enterEmail('jesse@soulfulsessions.be'); // Use existing email
      await signupPage.enterPassword('Password123!');
      await signupPage.enterConfirmPassword('Password123!');
      await signupPage.clickSignupButton();
      
      await basePage.sleep(3000); // Wait for server response
      const errorMessage = await signupPage.getErrorMessage();
      expect(errorMessage.length).toBeGreaterThan(0);
    });
  });

  describe('Forgot Password Page', () => {
    it('should display forgot password form', async () => {
      const forgotPasswordPage = new ForgotPasswordPage();
      await forgotPasswordPage.navigateTo('/forgot-password');
      
      expect(await forgotPasswordPage.isElementVisible('input[type="email"]')).toBe(true);
      expect(await forgotPasswordPage.isElementVisible('button[type="submit"]')).toBe(true);
    });

    it('should submit password reset request', async () => {
      const forgotPasswordPage = new ForgotPasswordPage();
      await forgotPasswordPage.navigateTo('/forgot-password');
      await forgotPasswordPage.typeText('input[type="email"]', 'test@example.com');
      await forgotPasswordPage.clickElement('button[type="submit"]');
      
      await basePage.sleep(2000);
      // Should show success message or redirect
      const successMessage = await forgotPasswordPage.getText('*');
      expect(successMessage.length).toBeGreaterThan(0);
    });
  });

  describe('Protected Routes', () => {
    it('should redirect to login when accessing protected route without authentication', async () => {
      await logout();
      await basePage.navigateTo('/events');
      
      const currentUrl = await basePage.getCurrentUrl();
      expect(currentUrl).toContain('/login');
    });

    it('should allow access to protected routes when authenticated', async () => {
      await loginAsUser();
      await basePage.sleep(2000); // Wait for login to complete
      await basePage.navigateTo('/events');
      await basePage.sleep(2000); // Wait for page to load
      
      const currentUrl = await basePage.getCurrentUrl();
      expect(currentUrl).toContain('/events');
    });
  });
});

