import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

export function diffScreenshots(expected: PNG, actual: PNG, threshold: number = 0.1): [PNG, number] | null {
  const { width, height } = actual;
  const diff = new PNG({ width, height });

  const mismatchedPixels = pixelmatch(actual.data, expected.data, diff.data, width, height, { threshold });
  return mismatchedPixels ? [diff, mismatchedPixels] : null;
}
