import {browser, by, element, ElementFinder} from 'protractor';

export class AppPage {
  async navigateTo(): Promise<unknown> {
    return browser.get(browser.baseUrl);
  }

  async getBrowserTitle(): Promise<string> {
    return browser.getTitle();
  }

}
