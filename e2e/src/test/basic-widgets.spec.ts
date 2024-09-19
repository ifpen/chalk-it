import assert from 'assert';
import { By } from 'selenium-webdriver';
import { ChalkitServer } from '../support/basic-server.js';
import { perBrowser } from '../fixtures/web-driver-fixture.js';
import { describeWithServer } from '../fixtures/e2e-tests.js';
import { openEditor } from '../support/elements/actions.js';

describeWithServer('Widget creation', function (server: ChalkitServer) {
  perBrowser((browser, driverFixture) => {
    it(`Text area`, async () => {
      const driver = driverFixture();
      const editor = await openEditor(server, driver);

      assert.ok(await editor.startPage.isGuidedTourTextVisible(), 'Not on welcome page');

      const dashboard = await editor.startPage.toMyProject();
      dashboard.waitWidgetAreaExists();
      const widgetToolbox = await dashboard.toolboxPanel.openWidgetToolbox();
      await widgetToolbox.createFlatUiTextInput();
      assert.equal((await driverFixture().findElements(By.id('flatUiTextInputA'))).length, 1);
    });
  });
});
