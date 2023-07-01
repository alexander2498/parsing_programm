import {JSDOM} from 'jsdom';
import axios from 'axios';

import {districts, Prisma, PrismaClient} from '@prisma/client';
import {destructAllHelpers, SeleniumHelper} from "./SeleniumHelper";
import fs from "fs";

export class BeautyParser {
  private prisma: PrismaClient;
  private seleniumHelper: SeleniumHelper | null;
  private baseUrl: string;

  constructor() {
    this.prisma = new PrismaClient();
    this.baseUrl = "https://msk.beauty.firmika.ru/";
    this.seleniumHelper = null
  }

  public async parseDistricts() {
    await this.prisma.areas.deleteMany();
    await this.prisma.districts.deleteMany();
    const url = 'https://msk.beauty.firmika.ru/p_a2_nav_districts';
    const html = await this._getHTML(url);
    const dom = new JSDOM(html, {
      url: url,
      referrer: url,
      contentType: "text/html",
      includeNodeLocations: true,
      storageQuota: 10000000
    });
    // console.log(html)
    const areasBlocks: Array<Element> = Array.from(dom.window.document.querySelectorAll('.item.area')).slice(0, -2);
    for (const areasBlock of areasBlocks) {
      if (areasBlock == null) {
        continue;
      }
      const areaName = areasBlock.querySelector('a')?.innerHTML;
      console.log('------------------');
      console.log(areaName);
      const area = await this.prisma.areas.create({
        data: {
          name: areaName as string
        }
      });
      console.log('------------------');
      const districtsLinks: Array<Element> = Array.from(areasBlock.querySelectorAll('.areaItems a'));
      for (const districtsLink of districtsLinks.slice(1)) {
        console.log(districtsLink.innerHTML, districtsLink.getAttribute('href'));
        const district = await this.prisma.districts.create({
          data: {
            areaId: area.id,
            name: districtsLink.innerHTML,
            link: districtsLink.getAttribute('href') as string
          }
        })
      }
    }
  }

  public async parseSalons() {
    const districts = await this.prisma.districts.findMany();

    districts.sort((d1: districts, d2: districts) => {
      return d1.id - d2.id;
    });

    const salonsData: Prisma.salonsCreateManyInput[] = [];
    for (const district of districts) {
      this.seleniumHelper = new SeleniumHelper();
      const url = this.baseUrl + district.link;
      const html = await this.seleniumHelper.prepareDistrictPage(district.link);
      const dom = new JSDOM(html, {
        url: url,
        referrer: url,
        contentType: "text/html",
        includeNodeLocations: true,
        storageQuota: 10000000
      });
      console.log('------------------');
      console.log(district.name);
      console.log('------------------');
      const rows = Array.from(dom.window.document.querySelectorAll('.t_row')).slice(1);
      for (const row of rows) {
        const salonNameBlock = row.querySelector('.tableCard__titleWrap a');
        const salonName = salonNameBlock?.innerHTML;
        const salonLink = salonNameBlock?.getAttribute("href");
        const salonRatingText = row.querySelector('i.raiting')?.innerHTML;
        let salonPriceText = row.querySelector('.cell.price')?.innerHTML;
        const salonAddress = row.querySelector('.firmsTable__mobileIcon')?.innerHTML;
        const salonPhone = row.querySelector('.showPhone__wrap a')?.innerHTML;
        let salonSite = row.querySelector('.cell.f_s.firmsTable__mobileIcon a')?.innerHTML;
        if (salonSite === undefined) {
          salonSite = 'Сайт не указан';
        }
        let salonPrice = 0;
        if (salonPriceText === '<span>данные не предоставлены</span>' || salonPriceText === '<span>есть услуга</span>' || salonPriceText === '<span>нет услуги</span>') {
          salonPrice = 1000000;
        } else {
          salonPriceText = salonPriceText?.split("&nbsp;").at(0)?.split(' ').at(-1);
          if (salonPriceText) {
            salonPrice = parseInt(salonPriceText);
          }
        }

        let salonRating = 0;
        salonRatingText?.split('').forEach(ratingSymbol => {
          if (ratingSymbol === '') {
            salonRating += 2;
          } else if (ratingSymbol === '') {
            salonRating += 1;
          }

        })
        console.log(salonLink, salonName, salonRating, salonRatingText, salonPrice, salonPriceText, salonAddress, salonPhone, salonSite);
        salonsData.push({
          name: salonName ? salonName : "",
          link: salonLink ? salonLink : "",
          rating: salonRating,
          price: salonPrice,
          address: salonAddress ? salonAddress : "",
          phone: salonPhone ? salonPhone : "",
          site: salonSite,
          districtId: district.id
        } as Prisma.salonsCreateManyInput);

      }
      await this.seleniumHelper.destruct();

    }
    await fs.promises.writeFile("salons.json", JSON.stringify(salonsData), 'utf8');
    await this.prisma.salons.createMany({
      data: salonsData
    })
  }

  private async _getHTML(url: string) {
    const html: string = (await axios.get(url)).data;
    return html;
  }


}

const beautyParser = new BeautyParser();
beautyParser.parseSalons().then(() => {
  destructAllHelpers();
});


process.once('SIGINT', () => destructAllHelpers());
process.once('SIGTERM', () => destructAllHelpers());