import { WebDriver, By, until, WebElement } from 'selenium-webdriver';
import { getDriver, FRONTEND_URL } from '../../__tests__/setup';

export class BasePage {
  protected driver: WebDriver;
  protected By = By;
  protected until = until;

  constructor() {
    this.driver = null as any; // Will be set in init()
  }

  async init() {
    this.driver = await getDriver();
  }

  async navigateTo(path: string): Promise<void> {
    await this.init();
    await this.driver.get(`${FRONTEND_URL}${path}`);
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    await this.driver.wait(
      async () => {
        const readyState = await this.driver.executeScript('return document.readyState');
        return readyState === 'complete';
      },
      10000,
      'Page did not load'
    );
  }

  async waitForElement(selector: string, timeout: number = 10000): Promise<WebElement> {
    await this.init();
    return await this.driver.wait(
      until.elementLocated(this.By.css(selector)),
      timeout,
      `Element ${selector} not found`
    );
  }

  async waitForElementVisible(selector: string, timeout: number = 10000): Promise<WebElement> {
    const element = await this.waitForElement(selector, timeout);
    await this.driver.wait(until.elementIsVisible(element), timeout);
    return element;
  }

  async clickElement(selector: string): Promise<void> {
    const element = await this.waitForElementVisible(selector);
    // Scroll element into view before clicking
    await this.driver.executeScript('arguments[0].scrollIntoView(true);', element);
    await this.sleep(200);
    await element.click();
  }

  async clickElementByXPath(xpath: string): Promise<void> {
    await this.init();
    const element = await this.driver.wait(
      until.elementLocated(this.By.xpath(xpath)),
      10000,
      `Element with xpath ${xpath} not found`
    );
    await this.driver.executeScript('arguments[0].scrollIntoView(true);', element);
    await this.sleep(200);
    await element.click();
  }

  async clickElementByText(tagName: string, text: string): Promise<void> {
    await this.clickElementByXPath(`//${tagName}[contains(text(), "${text}")]`);
  }

  async typeText(selector: string, text: string): Promise<void> {
    const element = await this.waitForElementVisible(selector);
    await element.clear();
    await element.sendKeys(text);
  }

  async getText(selector: string): Promise<string> {
    const element = await this.waitForElementVisible(selector);
    return await element.getText();
  }

  async getAttribute(selector: string, attribute: string): Promise<string> {
    const element = await this.waitForElementVisible(selector);
    return await element.getAttribute(attribute);
  }

  async isElementPresent(selector: string): Promise<boolean> {
    try {
      await this.init();
      await this.driver.findElement(this.By.css(selector));
      return true;
    } catch {
      return false;
    }
  }

  async isElementVisible(selector: string): Promise<boolean> {
    try {
      const element = await this.waitForElement(selector);
      return await element.isDisplayed();
    } catch {
      return false;
    }
  }

  async waitForText(selector: string, text: string, timeout: number = 10000): Promise<void> {
    await this.driver.wait(
      async () => {
        const elementText = await this.getText(selector);
        return elementText.includes(text);
      },
      timeout,
      `Text "${text}" not found in ${selector}`
    );
  }

  async waitForUrl(url: string | RegExp, timeout: number = 10000): Promise<void> {
    await this.init();
    await this.driver.wait(
      async () => {
        try {
          const currentUrl = await this.driver.getCurrentUrl();
          if (typeof url === 'string') {
            return currentUrl.includes(url);
          }
          return url.test(currentUrl);
        } catch (e) {
          return false;
        }
      },
      timeout,
      `URL did not match ${url}`
    );
  }

  async getCurrentUrl(): Promise<string> {
    await this.init();
    return await this.driver.getCurrentUrl();
  }

  async refresh(): Promise<void> {
    await this.driver.navigate().refresh();
    await this.waitForPageLoad();
  }

  async executeScript(script: string, ...args: any[]): Promise<any> {
    await this.init();
    return await this.driver.executeScript(script, ...args);
  }

  async sleep(ms: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  async takeScreenshot(name: string): Promise<void> {
    const screenshot = await this.driver.takeScreenshot();
    const fs = await import('fs');
    const path = await import('path');
    const screenshotPath = path.join(process.cwd(), 'e2e', 'screenshots', `${name}.png`);
    await fs.promises.mkdir(path.dirname(screenshotPath), { recursive: true });
    await fs.promises.writeFile(screenshotPath, screenshot, 'base64');
  }
}
