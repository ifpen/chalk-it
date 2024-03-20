import * as fs from 'fs';
import path from 'node:path';
import { ChalkitServer } from '../support/basic-server.js';
import { config } from '../test-config.js';
import { PNG } from 'pngjs';
import { diffScreenshots } from '../support/compare-screenshots.js';
import { pipeline } from 'node:stream/promises';
import assert from 'assert';
import { perBrowser } from '../fixtures/web-driver-fixture.js';

/** The more complicated form allows to grab a reference dashboard from the documentation and keep the screenshot here.  */
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

function delay(time: number) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

describe('Visual Tests', function () {
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

  perBrowser((browser, driverFixture) => {
    TEST_CASES.forEach((testCase, idx) => {
      const testCaseFile = getDashboardFile(testCase);
      it(testCaseFile, async () => {
        const expectedBuffer = fs.promises.readFile(screenshotReference(testCase, browser));

        await driverFixture().get(server.getDashboardUrl(idx.toString()));

        // TODO find proper condition
        await delay(5000);

        const encodedString = await driverFixture().takeScreenshot();

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
