import * as fs from 'fs';
import path from 'node:path';
import { Browser, Builder, WebDriver, Capability } from 'selenium-webdriver';
import { Options as ChromeOptions } from 'selenium-webdriver/chrome.js';
import { Options as FirefoxOptions } from 'selenium-webdriver/firefox.js';
import { Options as EdgeOptions } from 'selenium-webdriver/edge.js';
import { config } from '../test-config.js';

function logFile(dir: string, testcase: string, browser: string, logType: string) {
  // TODO sanitize
  const filename = path.basename(testcase, '.xprjson');
  return path.join(dir, `${filename}-${browser}-${logType}.log`);
}

export function perBrowser(
  testSuite: (browser: string, driverFixture: () => WebDriver) => void,
  browsers = config.browsers,
) {
  browsers.forEach((browser) => {
    describe(`Using ${browser}`, function () {
      const driverFixture = webDriverFixture(browser);

      testSuite(browser, driverFixture);
    });
  });
}

export function webDriverFixture(browser: string): () => WebDriver {
  let driver: WebDriver | undefined;
  beforeEach(async function () {
    const width = config.width;
    const height = config.height;

    const builder = new Builder().withCapabilities({
      [Capability.LOGGING_PREFS]: { browser: 'ALL' },
      [Capability.BROWSER_NAME]: browser,
    });
    switch (browser) {
      case Browser.CHROME:
        let chromeOptions = new ChromeOptions().windowSize({ width, height });
        if (config.headless) {
          chromeOptions = chromeOptions.addArguments('--headless=new');
        }
        builder.setChromeOptions(chromeOptions);
        break;

      case Browser.FIREFOX:
        let ffOptions = new FirefoxOptions().windowSize({ width, height });
        if (config.headless) {
          ffOptions = ffOptions.addArguments('--headless');
        }
        builder.setFirefoxOptions(ffOptions);
        break;

      case Browser.EDGE:
        let edgeOptions = new EdgeOptions().windowSize({ width, height });
        if (config.headless) {
          edgeOptions = edgeOptions.addArguments('--headless');
        }
        builder.setEdgeOptions(edgeOptions);
        break;

      default:
        throw new Error(`Unknown browser ${browser}`);
    }
    driver = await builder.build();
  });

  afterEach(async function () {
    if (driver) {
      const logTypes = await driver.manage().logs().getAvailableLogTypes();
      for (const logType of logTypes) {
        const log = await driver.manage().logs().get(logType);
        if (log.length) {
          const targetFile = logFile(config.outputsDir, (<any>this).currentTest.title, browser, logType);
          const fh = await fs.promises.open(targetFile, 'w');
          const stream = fh.createWriteStream({ encoding: 'utf8' });
          for (const entry of log) {
            stream.write(JSON.stringify(entry.toJSON()));
            stream.write('\n');
          }
          stream.end();
          await fh.close();
        }
      }
    }

    await driver?.close();
    driver = undefined;
  });

  return () => {
    if (driver) {
      return driver;
    } else {
      throw new Error('Not inside a test');
    }
  };
}
