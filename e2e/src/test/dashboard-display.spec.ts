import * as fs from 'fs';
import assert from 'assert';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { PNG } from 'pngjs';
import { sanitize } from 'sanitize-filename-ts';
import { Suite } from 'mocha';
import { config } from '../test-config.js';
import { ChalkitServer } from '../support/basic-server.js';
import { diffScreenshots } from '../support/compare-screenshots.js';
import { perBrowserAlt } from '../fixtures/web-driver-fixture.js';
import { DashboardEditor } from '../support/elements/dashboard.js';
import { describeWithServer } from '../fixtures/e2e-tests.js';

/** The more complicated form allows to grab a reference dashboard from the documentation and keep the screenshot here.  */
type TestCase = string | { dashboard: string; referenceDirectory: string };

const TEST_CASES: TestCase[] = ['resources/list-js.xprjson'];

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

        const expectedBuffer = fs.promises.readFile(screenshotReference(testCase, browser));

        await driver.get(server.getDashboardUrl(idx.toString()));

        const dashboardEditor = new DashboardEditor(driver);
        await dashboardEditor.dashboardPage.waitWidgetAreaExists();
        // If not reliable, add small safety wait.
        await dashboardEditor.waitNotLoading();

        const encodedString = await driver.takeScreenshot();

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
