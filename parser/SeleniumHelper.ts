import {Builder, By, ThenableWebDriver} from 'selenium-webdriver';
import * as chrome from "selenium-webdriver/chrome";
import fs from "fs";

export const allHelpers: Array<SeleniumHelper> = [];

export const destructAllHelpers = async () => {
  for (const helper of allHelpers) {
    await helper.destruct();
  }
};

export class SeleniumHelper {
  private chromeOptions: chrome.Options;
  private driver: ThenableWebDriver;
  private baseUrl: string;


  constructor() {
    this.chromeOptions = new chrome.Options()
      .windowSize({width: 1920, height: 1080})
      .addArguments('--headless');

    // this.chromeOptions.addArguments('--proxy-server=103.156.248.102:8080');


    this.driver = new Builder()
      .forBrowser('chrome')
      .usingServer('http://109.172.80.51:4444/')
      .setChromeOptions(this.chromeOptions)
      .build();

    this.baseUrl = 'https://msk.beauty.firmika.ru/';

    allHelpers.push(this);
  }

  destruct() {
    return this.driver.quit();
  }

  public async prepareDistrictPage (url: string) {
    try {
      url = this.baseUrl + url;
      await this._openUrl(url);

      for (let i = 0; i < 100; i++) {

        try {
          const moreBtn =  this.driver.findElement(By.css('.button.button--transparent.button--big.btn.showMoreFirms.ld'));

          await moreBtn.click();
          await this.driver.sleep(2000);

          console.log(await moreBtn.getText());
        }
        catch (e) {
          break;
        }
      }

      await this._saveHtml('districtPage.html');

      return await this.driver.getPageSource();

    }
    catch (e) {
      console.log(e);
      await this.destruct();
      console.log('Error caught');
    }
  }

  public async prepareSalonPage (url: string) {
    try {
      url = this.baseUrl + url;
      await this._openUrl(url);

      const phoneBtn = this.driver.findElement(By.css('.button.button--small.button--blue.buttonShowPhone'))
      await phoneBtn.click();

      await this.driver.sleep(2000);

      await this._saveHtml('salonPage.html');
      return await this.driver.getPageSource();

    }
    catch (e) {
      console.log(e);
      await this.destruct();
      console.log('Error caught');
    }
  }

  private _getHashCode(s: string) {
    return s.split("").reduce(function(a, b) {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
  }

  private async _openUrl(url: string) {
    await this.driver.get(url);
    await this.driver.sleep(5000);
    console.log('take screenshot: ' + url);
    await this._takeScreenshot(this._getHashCode(url).toString());
  }

  private async _takeScreenshot(prefix: string) {
    const img = await this.driver.takeScreenshot();
    console.log('taking screenshot: ' + prefix);

    await fs.promises.writeFile(prefix + '_screenshot.png', img, 'base64');
  }

  private async _saveHtml(filename: string) {
    const page = await this.driver.getPageSource();
    await fs.promises.writeFile(filename, page, 'utf8');
  }



}


const seleniumHelper = new SeleniumHelper();
// seleniumHelper.prepareDistrictPage('/districts.php?district=19').then(() => {
//   seleniumHelper.destruct();
// });

seleniumHelper.prepareSalonPage('firms.php?i=19031').then(() => {
  seleniumHelper.destruct();
});

process.once('SIGINT', () => destructAllHelpers());
process.once('SIGTERM', () => destructAllHelpers());
