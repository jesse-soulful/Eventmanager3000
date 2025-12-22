import { BasePage } from './BasePage';

export class SignupPage extends BasePage {
  async navigateToSignup(): Promise<void> {
    await this.navigateTo('/signup');
  }

  async enterName(name: string): Promise<void> {
    await this.typeText('input[name="name"]', name);
  }

  async enterEmail(email: string): Promise<void> {
    await this.typeText('input[type="email"]', email);
  }

  async enterPassword(password: string): Promise<void> {
    // Try multiple selectors for password field
    try {
      await this.typeText('input[name="password"]', password);
    } catch {
      await this.typeText('input[type="password"]', password);
    }
  }

  async enterConfirmPassword(password: string): Promise<void> {
    // Try multiple selectors for confirm password field
    try {
      await this.typeText('input[name="confirmPassword"]', password);
    } catch {
      // Find all password inputs and use the second one
      await this.init();
      const passwordInputs = await this.driver.findElements(this.By.css('input[type="password"]'));
      if (passwordInputs.length >= 2) {
        await passwordInputs[1].clear();
        await passwordInputs[1].sendKeys(password);
      } else {
        throw new Error('Confirm password field not found');
      }
    }
  }

  async clickSignupButton(): Promise<void> {
    await this.clickElement('button[type="submit"]');
  }

  async signup(name: string, email: string, password: string): Promise<void> {
    await this.navigateToSignup();
    await this.enterName(name);
    await this.enterEmail(email);
    await this.enterPassword(password);
    await this.enterConfirmPassword(password);
    await this.clickSignupButton();
    // Wait for redirect to events page
    await this.waitForUrl('/events', 15000);
  }

  async getErrorMessage(): Promise<string> {
    try {
      return await this.getText('.alert-error');
    } catch {
      return '';
    }
  }
}

