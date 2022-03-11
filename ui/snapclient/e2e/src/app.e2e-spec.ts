import {browser, by, element, logging} from 'protractor';
import {AppPage} from './app.po';
import {config} from 'rxjs';

describe('Snap2Snomed App', () => {
  let page: AppPage;

  beforeEach(() => {
    page = new AppPage();
  });

  it('should display title', async () => {
    await page.navigateTo();
    expect(await page.getBrowserTitle()).toEqual('Snap2SNOMED');
  });

  it('should show logo', async () => {
    expect(element(by.css('banner__title img')).isPresent()).toBeTruthy();
  });

  it('should show login', async () => {
    const el = element(by.css('banner__login button'));
    expect(el.isPresent()).toBeTruthy();
  });

  it ('should allow login', async () => {
    const el = element(by.css('banner__login button'));
    const loginUrl = 'https://snap-2-snomed-test.auth.ap-southeast-2.amazoncognito.com/login';
    el.click().then(async () => {
      expect(await browser.getCurrentUrl()).toEqual(loginUrl);
    });
  });

  afterEach(async () => {
    // Assert that there are no errors emitted from the browser
    const logs = await browser.manage().logs().get(logging.Type.BROWSER);
    expect(logs).not.toContain(jasmine.objectContaining({
      level: logging.Level.SEVERE,
    } as logging.Entry));
  });
});
