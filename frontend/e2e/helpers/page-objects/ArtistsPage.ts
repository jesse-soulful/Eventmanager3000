import { BasePage } from './BasePage';

export class ArtistsPage extends BasePage {
  async navigateToArtists(eventId: string): Promise<void> {
    await this.navigateTo(`/events/${eventId}/artists`);
  }

  async clickCreateArtistButton(): Promise<void> {
    // Try multiple ways to find create button
    try {
      await this.clickElementByText('button', 'Add Artist');
    } catch {
      try {
        await this.clickElementByText('button', 'New Artist');
      } catch {
        try {
          await this.clickElement('.btn-primary');
        } catch {
          // Last resort: find any button with "Add" or "Create"
          await this.clickElementByXPath('//button[contains(text(), "Add") or contains(text(), "Create")]');
        }
      }
    }
  }

  async waitForArtistCard(artistName: string): Promise<void> {
    await this.waitForText('*', artistName);
  }

  async clickArtistCard(artistName: string): Promise<void> {
    await this.init();
    const artistCards = await this.driver.findElements(
      this.By.xpath(`//*[contains(text(), "${artistName}")]`)
    );
    if (artistCards.length > 0) {
      await this.driver.executeScript('arguments[0].scrollIntoView(true);', artistCards[0]);
      await this.sleep(200);
      await artistCards[0].click();
    }
  }

  async getArtistCount(): Promise<number> {
    await this.init();
    const cards = await this.driver.findElements(this.By.css('.line-item-card, [class*="artist-card"]'));
    return cards.length;
  }

  async expandArtist(artistName: string): Promise<void> {
    await this.init();
    // Find the artist card and click expand button
    const expandButtons = await this.driver.findElements(
      this.By.xpath(`//*[contains(text(), "${artistName}")]/ancestor::*[contains(@class, "card")]//button[contains(@class, "expand") or contains(@aria-label, "expand")]`)
    );
    if (expandButtons.length > 0) {
      await expandButtons[0].click();
      await this.sleep(500);
    }
  }

  async addSubLineItem(artistName: string): Promise<void> {
    await this.expandArtist(artistName);
    await this.init();
    const addButtons = await this.driver.findElements(
      this.By.xpath(`//*[contains(text(), "${artistName}")]/ancestor::*[contains(@class, "card")]//button[contains(text(), "Add") or contains(text(), "Sub")]`)
    );
    if (addButtons.length > 0) {
      await addButtons[0].click();
    }
  }

  async changeStatus(artistName: string, status: string): Promise<void> {
    await this.expandArtist(artistName);
    await this.init();
    const statusDropdowns = await this.driver.findElements(
      this.By.xpath(`//*[contains(text(), "${artistName}")]/ancestor::*[contains(@class, "card")]//select, //*[contains(text(), "${artistName}")]/ancestor::*[contains(@class, "card")]//button[contains(@class, "status")]`)
    );
    if (statusDropdowns.length > 0) {
      await statusDropdowns[0].click();
      await this.sleep(300);
      const statusOption = await this.driver.findElement(
        this.By.xpath(`//*[contains(text(), "${status}")]`)
      );
      await statusOption.click();
    }
  }
}
