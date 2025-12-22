import { BasePage } from './BasePage';

export class ForgotPasswordPage extends BasePage {
  async navigateToForgotPassword(): Promise<void> {
    await this.navigateTo('/forgot-password');
  }

  async enterEmail(email: string): Promise<void> {
    await this.typeText('input[type="email"]', email);
  }

  async clickSubmitButton(): Promise<void> {
    await this.clickElement('button[type="submit"]');
  }

  async getSuccessMessage(): Promise<string> {
    try {
      return await this.getText('.alert-success, [class*="success"]');
    } catch {
      return '';
    }
  }
}

