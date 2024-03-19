import * as fs from 'fs';
import path from 'node:path';
import { Browser, Builder, WebDriver } from 'selenium-webdriver';
import { Options as ChromeOptions } from 'selenium-webdriver/chrome.js';
import { Options as FirefoxOptions } from 'selenium-webdriver/firefox.js';
import { Options as EdgeOptions } from 'selenium-webdriver/edge.js';
import { ChalkitServer } from '../support/basic-server.js';
import { config } from '../test-config.js';
import { PNG } from 'pngjs';
import { diffScreenshots } from '../support/compare-screenshots.js';
import { pipeline } from 'node:stream/promises';
import assert from 'assert';

type TestCase = string | { dashboard: string; referenceDirectory: string };

const TEST_CASES: TestCase[] = ['resources/list-js.xprjson'];

function getDashboardFile(testCase: TestCase) {
  return typeof testCase === 'string' ? testCase : testCase.dashboard;
}

function screenshotName(testcase: string, browser: string) {
  const filename = path.basename(testcase, '.xprjson');
  return `${filename}-${browser}.png`;
}

function diffName(testcase: string, browser: string) {
  const filename = path.basename(testcase, '.xprjson');
  return `${filename}-${browser}-diff.png`;
}

function screenshotReference(testcase: TestCase, browser: string) {
  const testFile = getDashboardFile(testcase);
  const directory = path.dirname(testFile);
  return path.join(directory, screenshotName(testFile, browser));
}

function screenshotResult(dir: string, testcase: string, browser: string) {
  return path.join(dir, screenshotName(testcase, browser));
}

function logFile(dir: string, testcase: string, browser: string, logType: string) {
  const filename = path.basename(testcase, '.xprjson');
  return path.join(dir, `${filename}-${browser}-${logType}.log`);
}

function delay(time: number) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

describe('Visual Tests', function () {
  // TODO factor
  const server = new ChalkitServer({
    staticDir: config.chalkitDir,
  });
  before(async () => {
    await server.start();

    const missing = TEST_CASES.filter(function (testCase) {
      const testFile = getDashboardFile(testCase);
      return !fs.existsSync(testFile) || !fs.statSync(testFile).isFile();
    });
    if (missing.length) {
      throw new Error(`Resources are missing or are not files: ${missing.join(', ')}`);
    }

    TEST_CASES.forEach((testCase, idx) => server.registerDashboardFile(getDashboardFile(testCase), idx.toString()));

    if (config.outputsDir) {
      if (fs.existsSync(config.outputsDir)) {
        const files = await fs.promises.readdir(config.outputsDir);
        await Promise.all(files.map((file) => fs.promises.unlink(path.join(config.outputsDir, file))));
      } else {
        fs.mkdirSync(config.outputsDir, { recursive: true });
      }
    }
  });

  after(async () => {
    await server.stop();
  });

  // TODO factor
  config.browsers.forEach((browser) => {
    describe(`Using ${browser}`, function () {
      let driver: WebDriver | undefined;
      beforeEach(async () => {
        const width = config.width;
        const height = config.height;

        // TODO factor
        const builder = new Builder().forBrowser(browser);
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

      TEST_CASES.forEach((testCase, idx) => {
        const testCaseFile = getDashboardFile(testCase);
        it(testCaseFile, async () => {
          const expectedBuffer = fs.promises.readFile(screenshotReference(testCase, browser));

          await driver!.get(server.getDashboardUrl(idx.toString()));

          // TODO find proper condition
          await delay(5000);

          const encodedString = await driver!.takeScreenshot();

          if (config.outputsDir) {
            await fs.promises.writeFile(
              screenshotResult(config.outputsDir, testCaseFile, browser),
              encodedString,
              'base64',
            );
          }

          const actualPng = PNG.sync.read(Buffer.from(encodedString, 'base64'));
          const expectedPng = PNG.sync.read(await expectedBuffer);

          const result = diffScreenshots(expectedPng, actualPng);
          if (result) {
            const [diff, mismatchedPixels] = result;
            if (config.outputsDir) {
              await pipeline(
                diff.pack(),
                fs.createWriteStream(path.join(config.outputsDir, diffName(testCaseFile, browser))),
              );
            }
            assert.equal(mismatchedPixels, 0);
          }
        });
      });
    });
  });
});
