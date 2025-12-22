import { BasePage } from './BasePage';

export class EventsPage extends BasePage {
  async navigateToEvents(): Promise<void> {
    await this.navigateTo('/events');
  }

  async clickCreateEventButton(): Promise<void> {
    // Try multiple selectors for create event button
    try {
      await this.clickElementByText('button', 'New Event');
    } catch {
      try {
        await this.clickElementByText('button', 'Create Event');
      } catch {
        // Fallback to CSS selector
        await this.clickElement('.btn-primary');
      }
    }
  }

  async waitForEventCard(eventName: string): Promise<void> {
    await this.waitForText('*', eventName);
  }

  async clickEventCard(eventName: string): Promise<void> {
    await this.init();
    // Find event card by name and click
    const eventCards = await this.driver.findElements(
      this.By.xpath(`//*[contains(text(), "${eventName}")]`)
    );
    if (eventCards.length > 0) {
      await this.driver.executeScript('arguments[0].scrollIntoView(true);', eventCards[0]);
      await this.sleep(200);
      await eventCards[0].click();
    }
  }

  async getEventCount(): Promise<number> {
    await this.init();
    const cards = await this.driver.findElements(this.By.css('.card, [class*="event-card"]'));
    return cards.length;
  }

  async isEventVisible(eventName: string): Promise<boolean> {
    try {
      await this.waitForText('*', eventName, 5000);
      return true;
    } catch {
      return false;
    }
  }

  async searchEvents(searchTerm: string): Promise<void> {
    await this.init();
    const searchInput = await this.waitForElement('input[type="search"], input[placeholder*="Search"]');
    await searchInput.clear();
    await searchInput.sendKeys(searchTerm);
    await this.sleep(500); // Wait for search to filter
  }
}
