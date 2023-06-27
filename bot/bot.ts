import {Telegraf} from 'telegraf';
import {ISessionManager, SessionManager} from "./utils/SessionManager";
import {TelegrafContext} from "telegraf/typings/context";
import { PrismaClient } from '@prisma/client';




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
  await ctx.reply(message);
});

bot.on("message", async (ctx: TelegrafContext) => {
  if (!ctx.message) {
    return;
  }

  const session = await sessionManager.getSession(ctx);
  if (session.lastMessageType === 1){
    const districts = await prisma.districts.findMany();
    let message = `Добрый день! Выберите район для поиска салона. Для выбора напишите мне идентификатор находящийся около названия необходимого района. \n`;
    for (const district of districts) {
      message += `${district.id}.${district.name}\n`;
    }
    const areaNumber = ctx.message.text;
    await sessionManager.saveSession(ctx, {
      areasNumber: parseInt(ctx.message.text),
      districtNumber: -1,
      lastMessageType: 2,
      salonNumber: -1
    })
  }
})

bot.launch()

process.once('SIGINT', () => bot.stop());
process.once('SIGTERM', () => bot.stop());