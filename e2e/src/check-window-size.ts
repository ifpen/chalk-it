import { Builder } from 'selenium-webdriver';
import 'chromedriver';

async function checkWindowSize() {
    const driver = await new Builder().forBrowser('chrome').build();

    try {
        // Get the window size
        const windowSize = await driver.manage().window().getRect();

        console.log(`Current window size: width=${windowSize.width}, height=${windowSize.height}`);
    } finally {
        await driver.quit();
    }
}

checkWindowSize();
