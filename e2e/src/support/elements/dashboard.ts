import { By, WebDriver, WebElement, WebElementPromise, until } from 'selenium-webdriver';
import { elementDoesNotExist } from '../selenium-conditions.js';

export class WidgetToolbox {
  constructor(private driver: WebDriver) {}

  public readonly basicWidgetsHeaderBy = By.id('collapse-basic');

  public readonly flatUiTextInputWidgetBy = By.id('flatUiTextInput');

  public async createFlatUiTextInput(): Promise<void> {
    const button = await this.driver.findElement(this.flatUiTextInputWidgetBy);
    await this.driver.wait(until.elementIsVisible(button));
    return button.click();
  }
}

export class ToolboxPanel {
  constructor(private driver: WebDriver) {}

  public readonly widgetToolboxBy = By.id('editor-widget-toolbox');

  public async openWidgetToolbox(): Promise<WidgetToolbox> {
    await this.driver.findElement(this.widgetToolboxBy).click();
    // TODO probably needs a wait for the animation
    return new WidgetToolbox(this.driver);
  }
}

export class DashboardPage {
  constructor(private driver: WebDriver) {}

  public readonly widgetAreaBy = By.id('DropperDroite');

  public async waitWidgetAreaExists(): Promise<WebElement> {
    return await this.driver.wait(until.elementLocated(this.widgetAreaBy));
  }

  public get toolboxPanel(): ToolboxPanel {
    return new ToolboxPanel(this.driver);
  }
}

export class StartPage {
  constructor(private driver: WebDriver) {}

  private readonly myProjectButtonBy = By.xpath('//*[@title="My project"]');

  private readonly guidedTourTextBy = By.xpath(`//h3[contains(text(),'Start with a guided tour')]`);

  public get myProjectButton(): WebElementPromise {
    return this.driver.findElement(this.myProjectButtonBy);
  }

  public async toMyProject(): Promise<DashboardPage> {
    await this.myProjectButton.click();
    return new DashboardPage(this.driver);
  }

  public async isGuidedTourTextVisible(): Promise<boolean> {
    return this.driver.findElement(this.guidedTourTextBy).isDisplayed();
  }
}

export class DashboardEditor {
  constructor(private driver: WebDriver) {}

  private readonly spinnerBy = By.id('loading-bar-spinner');

  public async waitNotLoading(): Promise<void> {
    await this.driver.wait(elementDoesNotExist(this.spinnerBy));
  }

  public get startPage(): StartPage {
    return new StartPage(this.driver);
  }
  public get dashboardPage(): DashboardPage {
    return new DashboardPage(this.driver);
  }
}
