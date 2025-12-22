import { BasePage } from './BasePage';

export class EventDetailPage extends BasePage {
  async navigateToEvent(eventId: string): Promise<void> {
    await this.navigateTo(`/events/${eventId}`);
  }

  async clickEditEventButton(): Promise<void> {
    try {
      await this.clickElementByText('button', 'Edit');
    } catch {
      await this.clickElementByText('button', 'Edit Event');
    }
  }

  async clickArtistsTab(): Promise<void> {
    try {
      await this.clickElement('a[href*="/artists"]');
    } catch {
      await this.clickElementByText('button', 'Artists');
    }
  }

  async clickProductionTab(): Promise<void> {
    try {
      await this.clickElement('a[href*="/production"]');
    } catch {
      await this.clickElementByText('button', 'Production');
    }
  }

  async clickFinanceTab(): Promise<void> {
    try {
      await this.clickElement('a[href*="/finance"]');
    } catch {
      await this.clickElementByText('button', 'Finance');
    }
  }

  async getEventName(): Promise<string> {
    return await this.getText('h1, h2, [class*="event-name"]');
  }

  async isEventDetailsVisible(): Promise<boolean> {
    return await this.isElementVisible('[class*="event-details"], [class*="event-card"]');
  }
}

