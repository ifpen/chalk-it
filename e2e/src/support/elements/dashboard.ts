import assert from 'assert';
import { By, WebDriver, WebElement, WebElementPromise, until, Actions } from 'selenium-webdriver';
import { elementDoesNotExist } from '../selenium-conditions.js';

export class WidgetToolbox {
  constructor(private driver: WebDriver) {}

  public readonly basicWidgetsHeaderBy = By.id('collapse-basic');
  public readonly flatUiTextInputWidgetBy = By.id('flatUiTextInput');

  public readonly flatUiHorizontalSliderWidgetBy = By.id('flatUiHorizontalSlider');
  public readonly buttonWebElt = By.className('btn btn-rounded-fill primary');

  public async createFlatUiTextInput(): Promise<void> {
    const button = await this.driver.findElement(this.flatUiTextInputWidgetBy);
    await this.driver.wait(until.elementIsVisible(button),5000);
    return button.click();
  }

  public async createFlatUiHorizontalSlider(): Promise<void> {
    const button = await this.driver.findElement(this.flatUiHorizontalSliderWidgetBy);
    await this.driver.wait(until.elementIsVisible(button),5000);
    return button.click();
  }

  public async getWidgetByClassAndId(className:string, idName:string):Promise<WebElement|undefined>{
     
    const eltArray = await this.driver.findElements(By.css(className));
        for (const elt of eltArray) {
            let id = await elt.getAttribute("id");
            //console.log(id);            
            if (id === idName) {
                return elt;
            }
        }
        // If no element is found, return undefined
        return undefined;
  }

  private async findWebElementByTitle(title: string, webElt: WebElement[]): Promise<WebElement | undefined> {
    for (const elt of webElt) {           
      let buttonText = await elt.getText();
      //console.log(buttonText);            
      if (buttonText === title) {
        return elt;
      }
    }
    // If no element is found, return undefined
    return undefined;
  }
  
  
  public async moveWidget(widget:  WebElement|undefined, offsetX: number, offsetY:number): Promise<void>{

    await this.driver.actions()
        .move({ origin: widget })     // move to webElement
        .press()                       // press left button mouse
        .move({ x: offsetX, y: offsetY }) // move from origin with offset
        .release()                     // release button mouse
        .perform();
  }

  public async connectWidget(datanodeName:string,variableName:string) {
        
    const connectWidgetId = await this.driver.findElement(By.css('i.specific.icn-data-connection.right-panel-toggle'));

    
    if (connectWidgetId != undefined)
        connectWidgetId.click();

    //Waiting for panel datanodes connect display:
    this.driver.wait(until.elementIsVisible(await this.driver.findElement(By.id('dataconnection__wrap1'))),5000);
    //Select datanode in list and apply
    const selectDatanodeElt = await this.driver.findElement(By.id('DSvalue'));
    await this.driver.wait(until.elementIsVisible(selectDatanodeElt),5000);
    selectDatanodeElt.click();
    selectDatanodeElt.sendKeys(datanodeName);
    selectDatanodeElt.click();

    //Waiting for updated Gui WebElement:
    const element = await this.driver.wait(until.elementLocated(By.id('DF_0_value')), 5000);
    await this.driver.wait(until.elementIsVisible(element), 5000);        
    
    //Select variable in list and apply
    const variableNodeElt = await this.driver.findElement(By.id('DF_0_value'));
    await this.driver.wait(until.elementIsVisible(variableNodeElt),5000);
    variableNodeElt.click();
    variableNodeElt.sendKeys(variableName);
    variableNodeElt.click();

    //Save datanode connection:        
    //Find save button form:
    const btnWebElt = await this.driver.findElements(this.buttonWebElt);
    const btnSave = await this.findWebElementByTitle("Save", btnWebElt);        
    assert.notEqual(btnSave, undefined);
    btnSave?.click();

  }

  public async setValue(widget:  WebElement, val:string): Promise<void>{

    await widget.clear();
    await widget.sendKeys(val+'\n');

  }

  public async getValue(widget:  WebElement) : Promise<string>{        
    return await widget.getAttribute('value');    
  }

  public async showWidgetMenu(widget:  WebElement): Promise<void>{

    await this.driver.wait(until.elementIsVisible(widget),5000);
    if(widget != undefined)
      widget.click();
    
  }


}

export class DataNodesPanel {
  constructor(private driver: WebDriver) {}

  public readonly dataNodesToolboxBy = By.id('editor-datanodes-list');
  public readonly closeButtonToolboxBy = By.id('panel_left_title');
  public readonly datanodesAreaBy = By.id('new--datanode--panel');

  public async openDataNodesbox(): Promise<DataNodesBox> {

    const button = await this.driver.findElement(this.dataNodesToolboxBy);
    //assert.notEqual( button, None);    
    await this.driver.wait(until.elementIsVisible(button),5000);
    await button.click();
    
    return new DataNodesBox(this.driver);
  }

  public async closeDatanodesBox(): Promise<DataNodesBox> {
    await this.driver.findElement(this.closeButtonToolboxBy).click();
    // TODO probably needs a wait for the animation
    return new DataNodesBox(this.driver);
  }  

  public async waitDatanodesBoxExist(): Promise<WebElement> {
    return await this.driver.wait(until.elementLocated(this.datanodesAreaBy));
  }


}

export class DataNodesBox {
  constructor(private driver: WebDriver) {}
    
  public readonly btnNewDatanode = By.className('btn__new ng-scope');  
  public readonly listJSONVar =  By.xpath('//*[@title="Open JSON : Variable dataNode"]');
  public readonly inputJSONName = By.xpath(".//div[@id='setting-value-container-name']//input[@type='text']");
  public readonly inputJSONVar = By.xpath(".//div[@id='setting-value-container-json_var']//input[@type='text']");
  public readonly formJSONVar =  By.id('datanode-type');
  public readonly buttonWebElt =  By.className('btn btn-rounded-fill primary');


  public async showDatanodesPanel(): Promise<void> {
    const button = await this.driver.findElement(this.btnNewDatanode);
    await this.driver.wait(until.elementIsVisible(button),5000);
    return button.click();
  }
  
  private async fillDatanode(Name:string, Value:string): Promise<void> {
      
    const inputJsonName = await this.driver.findElements(this.inputJSONName);
    assert.equal((await this.driver.findElements(this.inputJSONName)).length, 1);
    const elt = inputJsonName[0];
    elt.sendKeys(Name);
    
    const inputJsonVar = await this.driver.findElements(this.inputJSONVar);
    assert.equal((await this.driver.findElements(this.inputJSONVar)).length, 1);    
    inputJsonVar[0].sendKeys(Value); 
  
  }

  private async findWebElementByTitle(title: string, webElt: WebElement[]): Promise<WebElement | undefined> {
    for (const elt of webElt) {           
      let buttonText = await elt.getText();
      //console.log(buttonText);            
      if (buttonText === title) {
        return elt;
      }
    }
    // If no element is found, return undefined
    return undefined;
  }
  
   
  public async createJSONVar(Name:string, Value:string): Promise<void> {
    const button = await this.driver.findElement(this.listJSONVar);
    await this.driver.wait(until.elementIsVisible(button),5000);
    button.click();
    const form = await this.driver.findElement(this.formJSONVar);
    await this.driver.wait(until.elementIsVisible(form),5000);
    await this.fillDatanode(Name,Value);
    
    //Find save button form:
    const btnWebElt =  await this.driver.findElements(this.buttonWebElt);
    const btnSave = await this.findWebElementByTitle("Save",btnWebElt);
    //if "save button" form founded: Click it
    assert.notEqual(btnSave, undefined);    
    btnSave?.click();
  }

}

export class ToolboxPanel {
  constructor(private driver: WebDriver) {}

  public readonly widgetToolboxBy = By.id('editor-widget-toolbox');
  public readonly closeButtonToolboxBy = By.id('panel_left_title');

  public async openWidgetToolbox(): Promise<WidgetToolbox> {
    await this.driver.findElement(this.widgetToolboxBy).click();
    // TODO probably needs a wait for the animation
    return new WidgetToolbox(this.driver);
  }

  public async closeWidgetToolbox(): Promise<WidgetToolbox> {
    await this.driver.findElement(this.closeButtonToolboxBy).click();
    // TODO probably needs a wait for the animation
    return new WidgetToolbox(this.driver);
  }

}

export class DashboardPage {
  constructor(private driver: WebDriver) {}

  public readonly widgetAreaBy = By.id('DropperDroite');
  public readonly buttonExecute = By.className('switch__wrapper ng-scope');

  public async waitWidgetAreaExists(): Promise<WebElement> {
    return await this.driver.wait(until.elementLocated(this.widgetAreaBy));
  }

  public get toolboxPanel(): ToolboxPanel {
    return new ToolboxPanel(this.driver);
  }

  public get dataNodesPanel(): DataNodesPanel {
    return new DataNodesPanel(this.driver);
  }

  public async runDashBoard(){
    const btnExecute =this.driver.findElement(this.buttonExecute);
    assert.notEqual(btnExecute, undefined);
    await btnExecute.click();
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
