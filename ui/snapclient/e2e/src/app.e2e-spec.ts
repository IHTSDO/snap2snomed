/*
 * Copyright © 2022 SNOMED International
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
