import * as fs from 'fs';
import assert from 'assert';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { PNG } from 'pngjs';
import { sanitize } from 'sanitize-filename-ts';
import { Suite } from 'mocha';
import { createModuleLogger } from '../logging.js';
import { config } from '../test-config.js';
import { ChalkitServer } from '../support/basic-server.js';
import { diffScreenshots } from '../support/compare-screenshots.js';
import { perBrowserAlt } from '../fixtures/web-driver-fixture.js';
import { DashboardEditor } from '../support/elements/dashboard.js';
import { describeWithServer } from '../fixtures/e2e-tests.js';

const logger = createModuleLogger('dashboard-display.spec');

/** The more complicated form allows to grab a reference dashboard from the documentation and keep the screenshot here.  */
type TestCase = string | { dashboard: string; referenceDirectory: string };

const TEST_CASES: TestCase[] = [
  'resources/bar-chart.xprjson',
  'resources/combo-box-js.xprjson',
  'resources/date-picker.xprjson',
  'resources/generic-html-js.xprjson',
  'resources/line-chart.xprjson',
  'resources/list-js.xprjson',
  'resources/markdown-js.xprjson',
  'resources/multi-select-js.xprjson',
  'resources/pie-chart.xprjson',
  'resources/progress-bar.xprjson',
  'resources/table.xprjson',
  'resources/time-picker.xprjson',
];

async function retryScreenshotComparison(
  driver: any, 
  server: any, 
  idx: number, 
  expectedBuffer: Promise<Buffer>,
  testCaseFile: string,
  browser: string,
  maxRetries: number = 2
): Promise<void> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      logger.debug(`Screenshot comparison attempt ${attempt + 1}/${maxRetries + 1} for ${testCaseFile}`);
      
      await driver.get(server.getDashboardUrl(idx.toString()));

      const dashboardEditor = new DashboardEditor(driver);
      await dashboardEditor.dashboardPage.waitWidgetAreaExists();
      await dashboardEditor.waitNotLoading();

      // Set window size before taking screenshot
      await driver.manage().window().setRect({ width: config.width, height: config.height });
      
      // Wait for any animations or dynamic content to settle
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Wait for fonts to load by checking if a common font-dependent element is rendered
      await driver.executeScript(`
        return new Promise((resolve) => {
          if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => resolve());
          } else {
            setTimeout(() => resolve(), 1000);
          }
        });
      `);
      
      // Additional wait for any lazy-loaded content
      await new Promise(resolve => setTimeout(resolve, 1000));

      const encodedString = await driver.takeScreenshot();

      if (config.outputsDir) {
        await fs.promises.writeFile(
          screenshotResult(config.outputsDir, testCaseFile, browser),
          encodedString,
          'base64',
        );
      }

      const actualPng = PNG.sync.read(Buffer.from(encodedString, 'base64'));
      logger.debug('actualPng ok');
      const expectedPng = PNG.sync.read(await expectedBuffer);
      logger.debug('expectedPng ok');

      const result = diffScreenshots(expectedPng, actualPng, config.visualComparison);
      if (result) {
        const [diff, mismatchedPixels, isAcceptable] = result;
        if (config.outputsDir) {
          await pipeline(
            diff.pack(),
            fs.createWriteStream(path.join(config.outputsDir, diffName(testCaseFile, browser))),
          );
        }
        
        if (!isAcceptable) {
          const totalPixels = actualPng.width * actualPng.height;
          const mismatchedPercentage = (mismatchedPixels / totalPixels) * 100;
          
          const errorMessage = 
            `Screenshot comparison failed for ${testCaseFile} in ${browser} (attempt ${attempt + 1}):\n` +
            `  Mismatched pixels: ${mismatchedPixels} (${mismatchedPercentage.toFixed(2)}%)\n` +
            `  Threshold: ${config.visualComparison.threshold}\n` +
            `  Max allowed pixels: ${config.visualComparison.maxMismatchedPixels}\n` +
            `  Max allowed percentage: ${config.visualComparison.maxMismatchedPercentage}%\n` +
            `  Diff image saved to: ${diffName(testCaseFile, browser)}`;
          
          if (attempt < maxRetries) {
            logger.debug(`${errorMessage}\nRetrying...`);
            lastError = new Error(errorMessage);
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          } else {
            assert.fail(errorMessage);
          }
        } else {
          logger.debug(
            `Screenshot comparison passed with ${mismatchedPixels} mismatched pixels ` +
            `(${((mismatchedPixels / (actualPng.width * actualPng.height)) * 100).toFixed(2)}%) for ${testCaseFile}`
          );
        }
      }
      
      // If we get here, the test passed
      return;
      
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries) {
        logger.debug(`Error in screenshot comparison attempt ${attempt + 1}: ${error}. Retrying...`);
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        throw lastError;
      }
    }
  }
}

function getDashboardFile(testCase: TestCase): string {
  return typeof testCase === 'string' ? testCase : testCase.dashboard;
}

function screenshotName(testcase: string, browser: string): string {
  const filename = path.basename(testcase, '.xprjson');
  return `${filename}-${browser}.png`;
}

function diffName(testcase: string, browser: string): string {
  const filename = path.basename(testcase, '.xprjson');
  return `${filename}-${browser}-diff.png`;
}

function screenshotReference(testcase: TestCase, browser: string): string {
  const testFile = getDashboardFile(testcase);
  const directory = path.dirname(testFile);
  return path.join(directory, screenshotName(testFile, browser));
}

function screenshotResult(dir: string, testcase: string, browser: string): string {
  return path.join(dir, screenshotName(testcase, browser));
}

function logFile(testcase: Suite, browser: string, logType: string): string {
  const filename = sanitize(path.basename(testcase.title, '.xprjson'));
  return path.join(config.outputsDir, `${filename}-${browser}-${logType}.log`);
}

describeWithServer('Visual Tests', function (server: ChalkitServer) {
  before(async () => {
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

  perBrowserAlt(config.browsers, logFile, (browser, driverFixture) => {
    TEST_CASES.forEach((testCase, idx) => {
      const testCaseFile = getDashboardFile(testCase);
      it(testCaseFile, async () => {
        const driver = driverFixture();

        const referenceScreenshot = screenshotReference(testCase, browser);
        logger.debug(`referenceScreenshot=${referenceScreenshot}`);
        const expectedBuffer = fs.promises.readFile(referenceScreenshot);

        await retryScreenshotComparison(driver, server, idx, expectedBuffer, testCaseFile, browser);
      });
    });
  });
});
