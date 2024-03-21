import { WebDriver } from 'selenium-webdriver';
import { ChalkitServer } from '../../support/basic-server.js';
import { DashboardEditor } from '../../support/elements/dashboard.js';

export async function openEditor(server: ChalkitServer, driver: WebDriver): Promise<DashboardEditor> {
  await driver.get(server.getRootUrl());

  const dashboardPage = new DashboardEditor(driver);
  await dashboardPage.waitNotLoading();
  return dashboardPage;
}
