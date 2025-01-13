import assert from 'assert';
import { By ,until} from 'selenium-webdriver';
import { perBrowser } from '../fixtures/web-driver-fixture.js';
import { describeWithServer } from '../fixtures/e2e-tests.js';
import { openEditor } from '../support/elements/actions.js';
describeWithServer('Dynamic widget creation', function (server) {
    perBrowser((browser, driverFixture) => {
        it(`dynamic widget area`, async () => {
            const driver = driverFixture();
            const editor = await openEditor(server, driver);
            assert.ok(await editor.startPage.isGuidedTourTextVisible(), 'Not on welcome page');
            const dashboard = await editor.startPage.toMyProject();
            dashboard.waitWidgetAreaExists();
            const widgetToolbox = await dashboard.toolboxPanel.openWidgetToolbox();
            await widgetToolbox.createFlatUiTextInput();
            await widgetToolbox.createFlatUiHorizontalSlider();
            assert.equal((await driverFixture().findElements(By.id('flatUiTextInputA'))).length, 1);
            assert.equal((await driverFixture().findElements(By.id('flatUiHorizontalSliderA'))).length, 1);
            
            //Move horizontal widget slider:
            const hSlider = await widgetToolbox.getWidgetByClassAndId('.drsElement.drag-drop-move._cloned.widget.widget__layout--item.widget-selected.widget-selected-last', 'flatUiHorizontalSliderA');
            assert.notEqual(hSlider, undefined);
            await widgetToolbox.moveWidget(hSlider, 40, 250);
            
            //Close ToolboxPanel:
            await dashboard.toolboxPanel.closeWidgetToolbox();
           
            //Open Datanodes Panel:
            const datanodesBox = await dashboard.dataNodesPanel.openDataNodesbox();
           
            //Show datanodes panel box:
            await datanodesBox.showDatanodesPanel();
            await dashboard.dataNodesPanel.waitDatanodesBoxExist();
            
            //Create and select datanode "new json Variable":
            const datanodeName = 'var';
            const variable = '{"val":"0"}';
            await datanodesBox.createJSONVar(datanodeName, variable);

            //Edit  "horizontal slider" widget menu:
            const editWidgetSliderIcon = await driverFixture().findElement(By.css('#flatUiHorizontalSliderA .actions__list .icn-edit'));
            assert.notEqual(editWidgetSliderIcon, undefined);
            await widgetToolbox.showWidgetMenu(editWidgetSliderIcon);            
            
            //Connect datanode to horizontal slider widget 
            const variableName = 'val';
            await widgetToolbox.connectWidget(datanodeName,variableName);


            //Edit  "input text" widget menu:
            const editWidgetInputTextIcon = await driverFixture().findElement(By.css('#flatUiTextInputA .actions__list .icn-edit'));
            assert.notEqual(editWidgetInputTextIcon, undefined);
            await widgetToolbox.showWidgetMenu(editWidgetInputTextIcon);            
            
            //Connect datanode to "input text" widget             
            await widgetToolbox.connectWidget(datanodeName,variableName);
            
            await dashboard.toolboxPanel.openWidgetToolbox();
            //Start dashboard:
            await dashboard.runDashBoard();

            const element = await driverFixture().wait(until.elementLocated(By.id('flatUiTextInputA'+'c')), 10000);
            await driverFixture().wait(until.elementIsVisible(element), 10000);    

            //const inputTextWidget = await driverFixture().findElement(By.id('flatUiTextInputA'+'c'));
            
            const inputTextWidget = await driverFixture().findElement(By.css('#flatUiTextInputAc #WidgetContainer401c .value-widget-html #value-no-input-group .value-input'));
            
            
            await widgetToolbox.setValue(inputTextWidget, '5');


        });
    });
});
