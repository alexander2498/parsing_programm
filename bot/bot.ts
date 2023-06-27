import {Markup, Telegraf} from 'telegraf';
import {ISessionManager, SessionManager} from "./utils/SessionManager";
import {TelegrafContext} from "telegraf/typings/context";
import { PrismaClient } from '@prisma/client';
import fs from "fs";


const sortButtons = Markup.inlineKeyboard([
  Markup.callbackButton('По цене', 'by_price'),
  Markup.callbackButton('По рейтингу', 'by_rating'),
]).extra();

const botToken: string = '6222679566:AAHI9ePcHAUu7nO88CCX8aVyvOzTPNv6YaY';

const prisma = new PrismaClient();

// Init sessions
export interface ISession{
  areasNumber: number,
  districtNumber: number,
  lastMessageType: number,
  salonNumber: number
}

export const initSession: ISession = {
  areasNumber: -1,
  districtNumber: -1,
  lastMessageType: -1,
  salonNumber: -1
}
export const sessionManager: ISessionManager<ISession> = new SessionManager<ISession>({
  initSession,
});

const bot: Telegraf<TelegrafContext> = new Telegraf(botToken);

let globalSalons: any = null;

bot.start(async (ctx: TelegrafContext) => {
  const areas = await prisma.areas.findMany();
  let message = `Добрый день! Выберите округ для поиска района. Для выбора напишите мне идентификатор находящийся около названия необходимого округа. \n`;
  for (const area of areas) {
    message += `${area.id}.${area.name}\n`;
  }
  await sessionManager.saveSession(ctx, {
    areasNumber: -1,
    districtNumber: -1,
    lastMessageType: 1,
    salonNumber: -1
  })

  //delete huyina

  globalSalons = JSON.parse(await fs.promises.readFile('salons.json', 'utf8'))
  // stop deleting

  await ctx.reply(message);
});

bot.on("message", async (ctx: TelegrafContext) => {
  if (!ctx.message) {
    return;
  }

  if (ctx.message.text[0]==='/') {
    return;
  }

  const session = await sessionManager.getSession(ctx);
  if (session.lastMessageType === 1){
    const areaId = parseInt(ctx.message.text);
    const districts = await prisma.districts.findMany({
      where: {
        areaId
      }
    });
    let message = `Выберите район для поиска салона. Для выбора напишите мне идентификатор находящийся около названия необходимого района. \n`;
    for (const district of districts) {
      message += `${district.id}.${district.name}\n`;
    }

    await sessionManager.saveSession(ctx, {
      areasNumber: areaId,
      districtNumber: -1,
      lastMessageType: 2,
      salonNumber: -1
    });

    await ctx.reply(message);
  }
  else if (session.lastMessageType === 2){
    const districtId = parseInt(ctx.message.text);
    const session = await sessionManager.getSession(ctx);
    let salons = await prisma.salons.findMany({
      where: {
        districtId
      }
    });


    //delete hyuina

    salons = Array.from(JSON.parse(JSON.stringify(globalSalons)));

    for (let i = 0; i < salons.length; i++) {
      salons[i].id = i + 1;
    }

    salons.filter((s) => {
      return s.districtId === districtId;
    });


    //stop deleting hyina

    let message = `Выберите салон о котором хотите узнать. Для выбора напишите мне идентификатор находящийся около названия необходимого салона. \n`;
    for (const salon of salons) {
      message += `${salon.id}.${salon.name}\n`;
    }
    session.lastMessageType = 3;
    session.districtNumber = districtId;
    await sessionManager.saveSession(ctx, session);
    await ctx.reply(message, sortButtons);
  }
  else if (session.lastMessageType === 3){
    const salonId = parseInt(ctx.message.text);
    const session = await sessionManager.getSession(ctx);
    let salon = await prisma.salons.findUnique({
      where: {
        id: salonId
      }
    });

    //delete hyuina

    const salons: any[] = Array.from(JSON.parse(JSON.stringify(globalSalons)));
    for (let i = 0; i < salons.length; i++) {
      salons[i].id = i + 1;
    }
    salon = salons.find((s: any) => {
      return s.id === salonId
    })

    //stop deleting hyina
    let message = `Название: ${salon?.name}\nРейтинг: ${salon?.rating}/10\n Цена: ${salon?.price}\n Адрес: ${salon?.address}\n
     Номер телефона: ${salon?.phone}\n Сайт: ${salon?.site}\n`;
    session.salonNumber = salonId;
  }
});

bot.action('by_price', async (ctx: TelegrafContext) => {
  const session = await sessionManager.getSession(ctx);
  // let salons = await prisma.salons.findMany({
  //   where: {
  //     districtId: session.districtNumber
  //   }
  // });

  //delete hyuina

  const salons: any[] = Array.from(JSON.parse(JSON.stringify(globalSalons)));

  for (let i = 0; i < salons.length; i++) {
    salons[i].id = i + 1;
  }

  salons.filter((s) => {
    return s.districtId === session.districtNumber;
  });
  //stop deleting hyina

  salons.sort((a: any, b: any) => b.price - a.price);

  let message = `Выберите салон о котором хотите узнать. Для выбора напишите мне идентификатор находящийся около названия необходимого салона. \n`;
  for (const salon of salons) {
    message += `${salon.id}.${salon.name}\n`;
  }
  session.lastMessageType = 3;

  await sessionManager.saveSession(ctx, session);
  await ctx.reply(message, sortButtons);
});

bot.action('by_rating', async (ctx: TelegrafContext) => {
  const session = await sessionManager.getSession(ctx);
  // let salons = await prisma.salons.findMany({
  //   where: {
  //     districtId: session.districtNumber
  //   }
  // });

  //delete hyuina

  const salons: any[] = Array.from(JSON.parse(JSON.stringify(globalSalons)));

  for (let i = 0; i < salons.length; i++) {
    salons[i].id = i + 1;
  }

  salons.filter((s) => {
    return s.districtId === session.districtNumber;
  });
  //stop deleting hyina

  salons.sort((a: any, b: any) => b.rating - a.rating);

  let message = `Выберите салон о котором хотите узнать. Для выбора напишите мне идентификатор находящийся около названия необходимого салона. \n`;
  for (const salon of salons) {
    message += `${salon.id}.${salon.name}\n`;
  }
  session.lastMessageType = 3;

  await sessionManager.saveSession(ctx, session);
  await ctx.reply(message, sortButtons);
})


bot.launch()

process.once('SIGINT', () => bot.stop());
process.once('SIGTERM', () => bot.stop());