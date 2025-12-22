import { BasePage } from './BasePage';

export class ManageMetadataPage extends BasePage {
  async navigateToMetadata(): Promise<void> {
    await this.navigateTo('/manage-metadata');
  }

  async clickStatusesTab(): Promise<void> {
    try {
      await this.clickElementByText('button', 'Statuses');
    } catch {
      await this.init();
      const tab = await this.driver.findElement(this.By.xpath('//*[@role="tab" and contains(text(), "Statuses")]'));
      await tab.click();
    }
  }

  async clickCategoriesTab(): Promise<void> {
    await this.clickElementByText('button', 'Categories');
  }

  async clickTagsTab(): Promise<void> {
    await this.clickElementByText('button', 'Tags');
  }

  async clickSubLineItemTypesTab(): Promise<void> {
    await this.clickElementByText('button', 'Sub-Line Item Types');
  }

  async clickCreateStatusButton(itemType: 'main' | 'sub'): Promise<void> {
    const buttonText = itemType === 'main' ? 'Add Main Status' : 'Add Sub Status';
    try {
      await this.clickElementByText('button', buttonText);
    } catch {
      await this.clickElementByText('button', 'Create Status');
    }
  }

  async clickCreateCategoryButton(): Promise<void> {
    try {
      await this.clickElementByText('button', 'Add Category');
    } catch {
      await this.clickElementByText('button', 'Create Category');
    }
  }

  async clickCreateTagButton(): Promise<void> {
    try {
      await this.clickElementByText('button', 'Add Tag');
    } catch {
      await this.clickElementByText('button', 'Create Tag');
    }
  }

  async clickCreateSubLineItemTypeButton(): Promise<void> {
    try {
      await this.clickElementByText('button', 'Add Type');
    } catch {
      await this.clickElementByText('button', 'Create Sub-Line Item Type');
    }
  }

  async selectModule(moduleType: string): Promise<void> {
    const select = await this.waitForElement('select[name="moduleType"], select');
    await select.click();
    await this.init();
    const option = await this.driver.findElement(
      this.By.xpath(`//option[contains(text(), "${moduleType}")]`)
    );
    await option.click();
  }

  async getStatusCount(): Promise<number> {
    await this.init();
    const statuses = await this.driver.findElements(this.By.css('[class*="status-card"], [class*="status-item"]'));
    return statuses.length;
  }

  async getCategoryCount(): Promise<number> {
    await this.init();
    const categories = await this.driver.findElements(this.By.css('[class*="category-card"], [class*="category-item"]'));
    return categories.length;
  }

  async getTagCount(): Promise<number> {
    await this.init();
    const tags = await this.driver.findElements(this.By.css('[class*="tag-card"], [class*="tag-item"]'));
    return tags.length;
  }
}
