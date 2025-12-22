import { Builder, WebDriver } from 'selenium-webdriver';
import * as chrome from 'selenium-webdriver/chrome';
import * as firefox from 'selenium-webdriver/firefox';

let driver: WebDriver | null = null;

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const BROWSER = process.env.BROWSER || 'chrome';
const HEADLESS = process.env.HEADLESS !== 'false';

export async function getDriver(): Promise<WebDriver> {
  if (driver) {
    return driver;
  }

  if (BROWSER === 'firefox') {
    const options = new firefox.Options();
    if (HEADLESS) {
      options.addArguments('--headless');
    }
    driver = await new Builder()
      .forBrowser('firefox')
      .setFirefoxOptions(options)
      .build();
  } else {
    const options = new chrome.Options();
    if (HEADLESS) {
      options.addArguments('--headless', '--no-sandbox', '--disable-dev-shm-usage');
    }
    options.addArguments('--window-size=1920,1080');
    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
  }

  // Set timeouts
  await driver.manage().setTimeouts({
    implicit: 10000, // 10 seconds
    pageLoad: 30000, // 30 seconds
    script: 30000, // 30 seconds
  });

  return driver;
}

export async function quitDriver(): Promise<void> {
  if (driver) {
    await driver.quit();
    driver = null;
  }
}

export { FRONTEND_URL, BACKEND_URL };

// Cleanup after all tests
afterAll(async () => {
  await quitDriver();
});

