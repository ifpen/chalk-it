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
            //Pause 2s
            await new Promise(resolve => setTimeout(resolve, 2000));
            await widgetToolbox.createFlatUiHorizontalSlider();
            assert.equal((await driverFixture().findElements(By.id('flatUiTextInputA'))).length, 1);
            assert.equal((await driverFixture().findElements(By.id('flatUiHorizontalSliderA'))).length, 1);
            //Move horizontal widget slider:
            const hSlider = await widgetToolbox.getWidgetByClassAndId('.drsElement.drag-drop-move._cloned.widget.widget__layout--item.widget-selected.widget-selected-last', 'flatUiHorizontalSliderA');
            assert.notEqual(hSlider, undefined);

            //Pause 2s
            await new Promise(resolve => setTimeout(resolve, 2000));
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
            const editWidgetSliderIcon = await driverFixture().findElement(By.css('#flatUiHorizontalSliderA .actions__list .icn-edit'));
            assert.notEqual(editWidgetSliderIcon, undefined);
            await widgetToolbox.showWidgetMenu(editWidgetSliderIcon);
            //Connect datanode to horizontal slider widget 
            const variableName = 'val';
            await widgetToolbox.connectWidget(datanodeName, variableName);
            //Pause 2s
            await new Promise(resolve => setTimeout(resolve, 2000));
            //Edit  "input text" widget menu:
            const editWidgetInputTextIcon = await driverFixture().findElement(By.css('#flatUiTextInputA .actions__list .icn-edit'));
            assert.notEqual(editWidgetInputTextIcon, undefined);
            await widgetToolbox.showWidgetMenu(editWidgetInputTextIcon);
            //Connect datanode to "input text" widget             
            await widgetToolbox.connectWidget(datanodeName, variableName);
            //Pause 2s
            await new Promise(resolve => setTimeout(resolve, 2000));
            await dashboard.toolboxPanel.openWidgetToolbox();
            //Start dashboard:
            await dashboard.runDashBoard();
            //Waiting running:
            const element = await driverFixture().wait(until.elementLocated(By.id('flatUiTextInputA' + 'c')), 5000);
            await driverFixture().wait(until.elementIsVisible(element), 5000);
            //Pause 2s
            await new Promise(resolve => setTimeout(resolve, 2000));
            //Get "input text" widget:
            const inputTextWidget = await driverFixture().findElement(By.css('#flatUiTextInputAc #WidgetContainer401c .value-widget-html #value-no-input-group .value-input'));
            //Setting value
            const valueToSet = '5';
            await widgetToolbox.setValue(inputTextWidget, valueToSet);
            //Get "horizontal slider" widget:
            const horizontalSliderWidget = await driverFixture().findElement(By.css('#flatUiHorizontalSliderAc #WidgetContainer402c .sliderInput .h-slider-value-div .hslider-input'));
            // Waiting widget to be visible:
            await driverFixture().wait(until.elementIsVisible(horizontalSliderWidget), 5000);
            //getting value from widget:            
            const valueReaded = await widgetToolbox.getValue(horizontalSliderWidget);
            //raise exception if value set is not equal to value readed:
            assert.equal(valueToSet, valueReaded);
        });
    });
});
