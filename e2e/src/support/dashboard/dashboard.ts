import { By, WebDriver, WebElement, until } from 'selenium-webdriver';
import { elementDoesNotExist } from '../selenium-conditions.js';

export class DashboardPage {
  constructor(private driver: WebDriver) {}

  private readonly spinnerBy = By.id('loading-bar-spinner');

  private readonly widgetAreaBy = By.id('loading-bar-spinner');

  public async waitNotLoading(): Promise<void> {
    await this.driver.wait(elementDoesNotExist(this.spinnerBy));
  }

  public async waitWidgetAreaExists(): Promise<WebElement> {
    return await this.driver.wait(until.elementLocated(this.widgetAreaBy));
  }
}
