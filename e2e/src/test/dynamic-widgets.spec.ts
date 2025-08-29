import assert from 'assert';
import { By, until, WebDriver } from 'selenium-webdriver';
import { perBrowser } from '../fixtures/web-driver-fixture.js';
import { describeWithServer } from '../fixtures/e2e-tests.js';
import { openEditor } from '../support/elements/actions.js';
describeWithServer('Dynamic widget creation', function (server) {
    perBrowser((browser, driverFixture) => {
        it(`dynamic widget area`, async () => {
            const driver = driverFixture();
            //Open editor:
            const editor = await openEditor(server, driver);
            assert.ok(await editor.startPage.isGuidedTourTextVisible(), 'Not on welcome page');
            //Create new project:
            const dashboard = await editor.startPage.toMyProject();
            dashboard.waitWidgetAreaExists();
            //Open widget toolbox:
            const widgetToolbox = await dashboard.toolboxPanel.openWidgetToolbox();
            //Create "input text" widget:
            await widgetToolbox.createFlatUiTextInput();
            //Pause 2s
            await new Promise(resolve => setTimeout(resolve, 2000));
            //Create "horizontal slider" widget:
            await widgetToolbox.createFlatUiHorizontalSlider();
            assert.equal((await driver.findElements(By.id('flatUiTextInputA'))).length, 1);
            assert.equal((await driver.findElements(By.id('flatUiHorizontalSliderA'))).length, 1);
            //Pause 2s
            await new Promise(resolve => setTimeout(resolve, 2000));
            //Move "horizontal slider" widget:
            // Wait for widget to be ready and selectable
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            let hSlider;
            // Try to find the widget with different selectors
            try {
              hSlider = await widgetToolbox.getWidgetByClassAndId('.drsElement.drag-drop-move._cloned.widget.widget__layout--item.widget-selected.widget-selected-last', 'flatUiHorizontalSliderA');
              if (!hSlider) {
                // Fallback: try finding by ID only
                hSlider = await driver.findElement(By.id('flatUiHorizontalSliderA'));
              }
            } catch (e) {
              // Final fallback: try finding by ID
              hSlider = await driver.findElement(By.id('flatUiHorizontalSliderA'));
            }
            
            assert.notEqual(hSlider, undefined, 'Could not find horizontal slider widget');
            //Move horizontal slider:
            await widgetToolbox.moveWidget(hSlider, 40, 250);
            //Pause 2s
            await new Promise(resolve => setTimeout(resolve, 2000));
            //Close ToolboxPanel:
            await dashboard.toolboxPanel.closeWidgetToolbox();
            //Open Datanodes Panel:
            const datanodesBox = await dashboard.dataNodesPanel.openDataNodesbox();
            //Pause 2s
            await new Promise(resolve => setTimeout(resolve, 2000));
            //Show datanodes panel box:
            await datanodesBox.showDatanodesPanel();
            await dashboard.dataNodesPanel.waitDatanodesBoxExist();
            //Create and select datanode "new json Variable":
            const datanodeName = 'var';
            const variable = '{"val":"0"}';
            await datanodesBox.createJSONVar(datanodeName, variable);
            //Edit  "horizontal slider" widget menu:
            const editWidgetSliderIcon = await driver.findElement(By.css('#flatUiHorizontalSliderA .actions__list .icn-edit'));
            assert.notEqual(editWidgetSliderIcon, undefined);
            await widgetToolbox.showWidgetMenu(editWidgetSliderIcon);
            //Connect datanode to horizontal slider widget 
            const variableName = 'val';
            await widgetToolbox.connectWidget(datanodeName, variableName);
            //Pause 2s
            await new Promise(resolve => setTimeout(resolve, 2000));
            //Edit "input text" widget menu:
            const editWidgetInputTextIcon = await driver.findElement(By.css('#flatUiTextInputA .actions__list .icn-edit'));
            assert.notEqual(editWidgetInputTextIcon, undefined);
            await widgetToolbox.showWidgetMenu(editWidgetInputTextIcon);
            //Connect datanode to "input text" widget             
            await widgetToolbox.connectWidget(datanodeName, variableName);
            //Pause 2s
            await new Promise(resolve => setTimeout(resolve, 2000));
            await dashboard.toolboxPanel.openWidgetToolbox();
            //Start running dashboard:
            await dashboard.runDashBoard();
            //Waiting until dashboard running:
            const element = await driver.wait(until.elementLocated(By.id('flatUiTextInputA' + 'c')), 5000);
            await driver.wait(until.elementIsVisible(element), 5000);
            //Pause 2s
            await new Promise(resolve => setTimeout(resolve, 2000));
            //Get "input text" widget area:
            const inputTextWidget = await driver.findElement(By.css('#flatUiTextInputAc #WidgetContainer401c .value-widget-html #value-no-input-group .value-input'));
            //Setting value
            const valueToSet = '5';
            await widgetToolbox.setValue(inputTextWidget, valueToSet);
            //Get "horizontal slider" widget area:
            const horizontalSliderWidget = await driver.findElement(By.css('#flatUiHorizontalSliderAc #WidgetContainer402c .sliderInput .h-slider-value-div .hslider-input'));
            // Waiting widget to be visible:
            await driver.wait(until.elementIsVisible(horizontalSliderWidget), 5000);
            //getting value from widget:            
            const valueReaded = await widgetToolbox.getValue(horizontalSliderWidget);
            //raise exception if value set is not equal to value readed:
            assert.equal(valueToSet, valueReaded);
            //Pause 2s:
            await new Promise(resolve => setTimeout(resolve, 2000));
        });
    });
});
