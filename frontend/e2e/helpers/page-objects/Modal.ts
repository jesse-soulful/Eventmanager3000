import { BasePage } from './BasePage';

export class Modal extends BasePage {
  async waitForModal(): Promise<void> {
    await this.waitForElementVisible('.modal-overlay, [class*="modal"]', 5000);
  }

  async isModalVisible(): Promise<boolean> {
    return await this.isElementVisible('.modal-overlay, [class*="modal"]');
  }

  async enterTextInField(fieldName: string, text: string): Promise<void> {
    const field = await this.waitForElement(`input[name="${fieldName}"], textarea[name="${fieldName}"]`);
    await field.clear();
    await field.sendKeys(text);
  }

  async selectOption(fieldName: string, optionValue: string): Promise<void> {
    const select = await this.waitForElement(`select[name="${fieldName}"]`);
    await select.click();
    await this.init();
    const option = await this.driver.findElement(
      this.By.xpath(`//option[contains(text(), "${optionValue}") or @value="${optionValue}"]`)
    );
    await option.click();
  }

  async clickSaveButton(): Promise<void> {
    // Try multiple ways to find save button
    try {
      await this.clickElementByText('button', 'Save');
    } catch {
      try {
        await this.clickElement('button[type="submit"]');
      } catch {
        await this.clickElement('.btn-primary');
      }
    }
    await this.sleep(1000); // Wait for save to complete
  }

  async clickCancelButton(): Promise<void> {
    try {
      await this.clickElementByText('button', 'Cancel');
    } catch {
      await this.clickElementByText('button', 'Close');
    }
  }

  async clickCloseButton(): Promise<void> {
    try {
      await this.clickElement('.modal-close-btn, button[aria-label="Close"]');
    } catch {
      await this.clickElementByXPath('//button[contains(text(), "×")]');
    }
  }

  async closeModal(): Promise<void> {
    // Try clicking outside modal or close button
    try {
      await this.clickCloseButton();
    } catch {
      // If close button not found, click outside
      await this.driver.actions().move({ x: 0, y: 0 }).click().perform();
    }
    await this.sleep(500);
  }

  async getErrorMessage(): Promise<string> {
    try {
      return await this.getText('.alert-error, [class*="error"]');
    } catch {
      return '';
    }
  }

  async getSuccessMessage(): Promise<string> {
    try {
      return await this.getText('.alert-success, [class*="success"]');
    } catch {
      return '';
    }
  }
}
