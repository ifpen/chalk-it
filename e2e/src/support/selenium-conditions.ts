import { Locator, Condition } from 'selenium-webdriver';

export function elementDoesNotExist(locator: Locator, msg = 'Element still exists'): Condition<true> {
  return new Condition(msg, async (driver) => {
    const elements = await driver.findElements(locator);
    if (elements.length) {
      // Element found, continue waiting
      return null;
    } else {
      return true;
    }
  });
}
