import {Builder, By, ThenableWebDriver} from 'selenium-webdriver';
import * as chrome from "selenium-webdriver/chrome";
import fs from "fs";

export class SeleniumHelper {
  private chromeOptions: chrome.Options;
  private driver: ThenableWebDriver;

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
  }

  destruct() {
    return this.driver.quit();
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

  public async test() {
    try {
      const url = 'https://msk.beauty.firmika.ru/p_a2_nav_districts'
      await this._openUrl(url);

      const element = await this.driver.findElement(By.className('.item.area'));

      console.log(element);
    }
    catch (e) {
      console.log(e);
      await this.destruct();
      console.log('Error caught');
    }

  }

}


const seleniumHelper = new SeleniumHelper();
seleniumHelper.test();


