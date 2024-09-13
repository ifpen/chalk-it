import { Builder } from 'selenium-webdriver';
import * as chrome from 'selenium-webdriver/chrome.js';

(async () => {
  async function checkWindowSize() {
      const options = new chrome.Options();
      options.addArguments('--headless');
      options.addArguments('--disable-gpu');
      options.addArguments('--no-sandbox');
      options.addArguments('--disable-dev-shm-usage');

      const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();

      try {
          const windowSize = await driver.manage().window().getRect();
          console.log(`Current window size: width=${windowSize.width}, height=${windowSize.height}`);
      } finally {
          await driver.quit();
      }
  }

  await checkWindowSize();
})();
