import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

export interface ScreenshotComparisonOptions {
  threshold: number;
  maxMismatchedPixels: number;
  maxMismatchedPercentage: number;
}

export function diffScreenshots(
  expected: PNG,
  actual: PNG,
  options: ScreenshotComparisonOptions = {
    threshold: 0.1,
    maxMismatchedPixels: 1000,
    maxMismatchedPercentage: 0.5, // 0.5% of total pixels
  }
): [PNG, number, boolean] | null {
  const { width, height } = actual;
  const diff = new PNG({ width, height });

  const mismatchedPixels = pixelmatch(actual.data, expected.data, diff.data, width, height, { threshold: options.threshold });
  
  if (mismatchedPixels === 0) {
    return null; // Perfect match
  }
  
  const totalPixels = width * height;
  const mismatchedPercentage = (mismatchedPixels / totalPixels) * 100;
  
  const isAcceptable = 
    mismatchedPixels <= options.maxMismatchedPixels && 
    mismatchedPercentage <= options.maxMismatchedPercentage;
  
  return [diff, mismatchedPixels, isAcceptable];
}
