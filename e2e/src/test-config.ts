import dotenv from 'dotenv';
import { Browser } from 'selenium-webdriver';
dotenv.config();

export const config = {
  chalkitDir: process.env.CHALKIT_DIR,

  browsers: process.env.BROWSER_LIST?.split(',') ?? [Browser.CHROME, Browser.EDGE],
  headless: (process.env.HEADLESS ?? 'true') === 'true',
  width: parseInt(process.env.WIDTH ?? '1920', 10),
  height: parseInt(process.env.HEIGHT ?? '1080', 10),

  outputsDir: process.env.OUTPUT_DIR ?? 'outputs',
  clearOutputsDir: (process.env.CLEAR_OUTPUT_DIR ?? 'true') === 'true',
};
