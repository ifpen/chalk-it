import dotenv from 'dotenv';
import { Browser } from 'selenium-webdriver';
import { ScreenshotComparisonOptions } from './support/compare-screenshots.js';
dotenv.config();

export const config = {
  chalkitDir: process.env.CHALKIT_DIR,

  browsers: process.env.BROWSER_LIST?.split(',') ?? [Browser.CHROME, Browser.EDGE],
  headless: (process.env.HEADLESS ?? 'true') === 'true',
  width: parseInt(process.env.WIDTH ?? '1600', 10),
  height: parseInt(process.env.HEIGHT ?? '900', 10),

  outputsDir: process.env.OUTPUT_DIR ?? 'outputs',
  
  // Screenshot comparison settings
  visualComparison: {
    threshold: parseFloat(process.env.VISUAL_THRESHOLD ?? '0.1'),
    maxMismatchedPixels: parseInt(process.env.MAX_MISMATCHED_PIXELS ?? '2000', 10),
    maxMismatchedPercentage: parseFloat(process.env.MAX_MISMATCHED_PERCENTAGE ?? '1.0'), // 1% of pixels
  } as ScreenshotComparisonOptions,
};
