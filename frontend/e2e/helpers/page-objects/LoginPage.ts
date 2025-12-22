import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  async navigateToLogin(): Promise<void> {
    await this.navigateTo('/login');
  }

  async enterEmail(email: string): Promise<void> {
    await this.typeText('input[type="email"]', email);
  }

  async enterPassword(password: string): Promise<void> {
    await this.typeText('input[type="password"]', password);
  }

  async clickLoginButton(): Promise<void> {
    await this.clickElement('button[type="submit"]');
  }

  async login(email: string, password: string): Promise<void> {
    await this.navigateToLogin();
    await this.enterEmail(email);
    await this.enterPassword(password);
    await this.clickLoginButton();
    
    // Wait for login to process and redirect
    // The login page uses navigate('/events') after successful login
    // We need to wait for the navigation to complete
    let redirected = false;
    const maxWait = 30000; // 30 seconds max wait
    const startTime = Date.now();
    
    while (!redirected && (Date.now() - startTime) < maxWait) {
      try {
        await this.sleep(1000); // Check every second
        const currentUrl = await this.driver.getCurrentUrl();
        
        // Check for error message first
        try {
          const errorMessage = await this.getErrorMessage();
          if (errorMessage && errorMessage.length > 0 && !currentUrl.includes('/events')) {
            throw new Error(`Login failed with error: ${errorMessage}`);
          }
        } catch (e: any) {
          if (e.message && e.message.includes('Login failed')) {
            throw e;
          }
        }
        
        // Success: We're on events page or dashboard
        if (currentUrl.includes('/events') || 
            currentUrl.includes('/dashboard') ||
            (currentUrl === `${process.env.FRONTEND_URL || 'http://localhost:5173'}/` && !currentUrl.includes('/login'))) {
          redirected = true;
          break;
        }
        
        // If we're still on login page after 5 seconds, check for errors
        if (currentUrl.includes('/login') && (Date.now() - startTime) > 5000) {
          const errorMsg = await this.getErrorMessage();
          if (errorMsg && errorMsg.length > 0) {
            throw new Error(`Login failed with error: ${errorMsg}`);
          }
          // If no error but still on login, wait a bit more
          if ((Date.now() - startTime) > 15000) {
            throw new Error(`Login did not redirect after 15 seconds. Still on: ${currentUrl}`);
          }
        }
        
        // Ignore /logout - it's not a valid route, might be a transient state
        if (currentUrl.includes('/logout')) {
          await this.sleep(2000); // Wait for redirect
          continue;
        }
        
      } catch (e: any) {
        // If it's our error, throw it
        if (e.message && (e.message.includes('Login failed') || e.message.includes('did not redirect'))) {
          throw e;
        }
        // Otherwise, continue waiting
      }
    }
    
    if (!redirected) {
      const finalUrl = await this.driver.getCurrentUrl();
      const errorMsg = await this.getErrorMessage();
      throw new Error(`Login did not redirect. Final URL: ${finalUrl}. Error: ${errorMsg || 'None'}`);
    }
    
    // Wait a bit more for page to fully load
    await this.sleep(1000);
  }

  async getErrorMessage(): Promise<string> {
    try {
      return await this.getText('.alert-error');
    } catch {
      return '';
    }
  }

  async clickForgotPasswordLink(): Promise<void> {
    await this.clickElement('a[href="/forgot-password"]');
  }

  async isLoginFormVisible(): Promise<boolean> {
    return await this.isElementVisible('form');
  }
}

