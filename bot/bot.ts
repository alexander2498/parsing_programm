import {Telegraf} from 'telegraf';
import {ISessionManager, SessionManager} from "./utils/SessionManager";
import {TelegrafContext} from "telegraf/typings/context";
import {PrismaClient} from '@prisma/client';
import {MessageCreator} from "./MessageCreator";
import {sortButtons, startButton, stepBackButton} from "./views/buttons";


const botToken: string = '6628382472:AAFBJaVDoVSPg8sI5Hk1Bkltq2Pg_i8d4ho';

const prisma = new PrismaClient();

export interface ISession {
  areasNumber: number,
  districtNumber: number,
  userState: number,
  salonNumber: number
  metroNumber: number
}

class BeautyParserBot {
  private readonly botToken: string;
  private bot: Telegraf<TelegrafContext>;
  private prisma: PrismaClient;
  private sessionManager: ISessionManager<ISession>;


  constructor(botToken: string) {
    this.botToken = botToken;
    this.bot = new Telegraf(this.botToken);

    this.prisma = new PrismaClient();

    const initSession: ISession = {
      areasNumber: -1,
      districtNumber: -1,
      userState: -1,
      salonNumber: -1,
      metroNumber: -1
    }

    this.sessionManager = new SessionManager<ISession>({
      initSession
    });

  }


  public setHandlers() {
    try {
      this.bot.start(async (ctx) =>
        await this.answerState0(ctx));
      this.bot.help(async (ctx: TelegrafContext) => {
        let message = `Здравствуйте! В этом боте собраны все самые лучшие салоны красоты в Москве.\nКак это работает?\nПри запуске (команда /start) бот присылает список округов с нумерацией, для того чтобы перейти к нужному округу, нужно просто отправить ответным сообщением номер этого округа. Если вы хотите выбрать салон не по району, а по метро, тогда после команды /start, нажмите на одну из кнопок выбора по метро, в которых расположены названия станций по алфавиту. Таким же образом происходит дальнейшее взаимодействие. Если вам нужно вернуться к выбору района, метро или округа, просто воспользуйтесь кнопкой "Назад". Также вы всегда можете запустить бота заново, для этого воспользуйтесь командой /start.`;
        await ctx.reply(message);
      });

      this.bot.on('message', async (ctx) =>
        await this.answerByState(ctx));

      this.bot.action('by_price', async (ctx) =>
        await this.answerSortedSalonsByPrice(ctx));
      this.bot.action('by_rating', async (ctx) =>
        await this.answerSortedSalonsByRating(ctx));

      this.bot.action('back', async (ctx) =>
        await this.go_back(ctx))

      this.bot.action('metros_125', async (ctx) =>
        await this.answerMetroButton125(ctx))
      this.bot.action('metros_251', async (ctx) =>
        await this.answerMetroButton251(ctx))
      this.bot.launch()
    }
    catch (e) {
      console.log("error:", e)
    }
  }


  public restructure() {
    return this.bot.stop();
  }

  private async answerState0(ctx: TelegrafContext) {
    const areas = await prisma.area.findMany();
    const message = await MessageCreator.getMessageWithAreas(areas);

    const session = await this.sessionManager.getSession(ctx);
    session.userState = 1;
    await this.sessionManager.saveSession(ctx, session);
    session.metroNumber = -1;
    session.districtNumber = -1;
    await ctx.reply(message, startButton);
  }

  private async answerState1(ctx: TelegrafContext) {
    const session = await this.sessionManager.getSession(ctx);

    session.metroNumber = -1

    let areaId = session.areasNumber
    if (ctx.message && ctx.message.text[0] !== '/') {
      areaId = parseInt(ctx.message.text);
    }

    const districts = await prisma.district.findMany({
      where: {
        areaId
      }
    });

    if (districts.length === 0) {
      await ctx.reply(MessageCreator.getMessageForInvalidRequest());
      return;
    }

    session.areasNumber = areaId;
    session.userState = 2;
    await this.sessionManager.saveSession(ctx, session);


    const message = await MessageCreator.getMessageWithDistricts(districts);
    await ctx.reply(message, stepBackButton);
  }

  private async answerState2(ctx: TelegrafContext) {
    const session = await this.sessionManager.getSession(ctx);
    let districtId = session.districtNumber;

    session.metroNumber = -1

    if (ctx.message && ctx.message.text[0] !== '/') {
      districtId = parseInt(ctx.message.text);
    }

    let salons = await prisma.salon.findMany({
      where: {
        districtId: districtId,
      }
    });

    salons = salons.filter((s: any) => {
      return s.districtId === districtId;
    });

    session.userState = 3;
    session.districtNumber = districtId;
    await this.sessionManager.saveSession(ctx, session);

    await ctx.reply(await MessageCreator.getMessageWithSalons(salons), sortButtons);
  }



  private async answerState3(ctx: TelegrafContext) {
    if (!ctx.message) {
      return;
    }

    if (ctx.message.text[0] === '/') {
      return;
    }

    const salonId = parseInt(ctx.message.text);
    const session = await this.sessionManager.getSession(ctx);

    let salon = await prisma.salon.findUnique({
      where: {
        id: salonId
      }
    });

    session.salonNumber = salonId;
    await this.sessionManager.saveSession(ctx, session);

    await ctx.reply(await MessageCreator.getMessageWithSalonInfo(salon), stepBackButton);
  }

  private async answerState4(ctx: TelegrafContext) {
    if (!ctx.message) {
      return;
    }

    if (ctx.message.text[0] === '/') {
      return;
    }
    const session = await this.sessionManager.getSession(ctx);

    session.districtNumber = -1
    const metroId = parseInt(ctx.message.text);
    let salons = await prisma.salon.findMany({
      where: {
        metroId: metroId
      }
    });

    salons = salons.filter((s: any) => {
      return s.metroId === metroId;
    });

    session.userState = 3;
    session.metroNumber = metroId;
    await this.sessionManager.saveSession(ctx, session);

    await ctx.reply(await MessageCreator.getMessageWithSalons(salons), sortButtons);
  }

  private async answerSortedSalonsByPrice(ctx: TelegrafContext) {
    const session = await this.sessionManager.getSession(ctx);
    if (session.districtNumber !== -1) {
      let salons = await prisma.salon.findMany({
        where: {
          districtId: session.districtNumber
        }
      });
      salons.sort((a: any, b: any) => {
        return a.price - b.price;
      });
      await ctx.reply(await MessageCreator.getMessageWithSalons(salons), sortButtons);

    }
    else if (session.metroNumber !== -1) {
      let salons = await prisma.salon.findMany({
        where: {
          metroId: session.metroNumber
        }
      });
      salons.sort((a: any, b: any) => {
        return a.price - b.price;
      });
      await ctx.reply(await MessageCreator.getMessageWithSalons(salons), sortButtons);

    }
    session.userState = 3;

    await this.sessionManager.saveSession(ctx, session);
  }

  private async answerSortedSalonsByRating(ctx: TelegrafContext) {
    const session = await this.sessionManager.getSession(ctx);
    if (session.districtNumber !== -1) {
      let salons = await prisma.salon.findMany({
        where: {
          districtId: session.districtNumber
        }
      });
      salons.sort((a: any, b: any) => b.rating - a.rating);
      await ctx.reply(await MessageCreator.getMessageWithSalons(salons), sortButtons);

    }
    else if (session.metroNumber !== -1) {
      let salons = await prisma.salon.findMany({
        where: {
          metroId: session.metroNumber
        }
      });
      salons.sort((a: any, b: any) => b.rating - a.rating);
      await ctx.reply(await MessageCreator.getMessageWithSalons(salons), sortButtons);

    }
    console.log(session.districtNumber, session.metroNumber)
    // @ts-ignore

    session.userState = 3;
    await this.sessionManager.saveSession(ctx, session);
  }

  private async answerMetroButton125(ctx: TelegrafContext) {
    const session = await this.sessionManager.getSession(ctx);

    let metros = await prisma.metro.findMany();

    await ctx.reply(await MessageCreator.getMessageWithMetros(metros, 125), stepBackButton);
    session.userState = 4;
    await this.sessionManager.saveSession(ctx, session)
  }
  private async answerMetroButton251(ctx: TelegrafContext) {
    const session = await this.sessionManager.getSession(ctx);

    let metros = await prisma.metro.findMany();

    await ctx.reply(await MessageCreator.getMessageWithMetros(metros, 251), stepBackButton);
    session.userState = 4;
    await this.sessionManager.saveSession(ctx, session)
  }

  private async answerByState(ctx: TelegrafContext) {
    const session = await this.sessionManager.getSession(ctx);
    console.log('Start answering by state with state = ', session.userState);
    if (session.userState === 0) {
      await this.answerState0(ctx);
    } else if (session.userState === 1) {
      await this.answerState1(ctx);
    } else if (session.userState === 2) {
      await this.answerState2(ctx);
    } else if (session.userState === 3) {
      await this.answerState3(ctx);
    }
    else if (session.userState === 4) {
      await this.answerState4(ctx);
    }
  }

  private async go_back(ctx: TelegrafContext) {
    console.log('Start going back');

    const session = await this.sessionManager.getSession(ctx);
    console.log('Current userState: ', session.userState);

    if (session.userState === 3 && session.metroNumber !== -1) {
      session.userState = 4;
      await this.answerByState(ctx);
    }

    if (session.userState > 1 && session.userState < 4) session.userState -= 2;
    else if (session.userState === 4) session.userState = 0;
    await this.sessionManager.saveSession(ctx, session);

    console.log('Current userState: ', session.userState);


    await this.answerByState(ctx);
  }
}


const bot = new BeautyParserBot(botToken);
bot.setHandlers();


process.once('SIGINT', () => bot.restructure());
process.once('SIGTERM', () => bot.restructure());
