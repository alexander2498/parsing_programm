import {Telegraf} from 'telegraf';
import {ISessionManager, SessionManager} from "./utils/SessionManager";
import {TelegrafContext} from "telegraf/typings/context";
import {PrismaClient} from '@prisma/client';
import {MessageCreator} from "./MessageCreator";
import {sortButtons, stepBackButton} from "./views/buttons";


const botToken: string = '6628382472:AAFBJaVDoVSPg8sI5Hk1Bkltq2Pg_i8d4ho';

const prisma = new PrismaClient();

// Init sessions
export interface ISession {
  areasNumber: number,
  districtNumber: number,
  userState: number,
  salonNumber: number
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
      salonNumber: -1
    }

    this.sessionManager = new SessionManager<ISession>({
      initSession
    });

  }

  public setHandlers() {
    this.bot.start(async (ctx) =>
      await this.answerState0(ctx));
    this.bot.help(async (ctx: TelegrafContext) => {
      let message = `Здравствуйте! В этом боте собраны все самые лучшие салоны красоты в Москве.\nКак это работает?\nПри запуске (команда /start) бот присылает список округов с нумерацией, для того чтобы перейти к нужному округу, нужно просто отправить ответным сообщением номер этого округа. Таким же образом происходит дальнейшее взаимодействие. Если вам нужно вернуться к выбору района или округа, просто воспользуйтесь кнопкой "Назад". Также вы всегда можете запустить бота заново, для этого воспользуйтесь командой /start.`;
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

    this.bot.launch()
  }

  public restructure() {
    return this.bot.stop();
  }

  private async answerState0(ctx: TelegrafContext) {
    const areas = await prisma.areas.findMany();
    const message = await MessageCreator.getMessageWithAreas(areas);

    const session = await this.sessionManager.getSession(ctx);
    session.userState = 1;
    await this.sessionManager.saveSession(ctx, session);

    await ctx.reply(message);
  }

  private async answerState1(ctx: TelegrafContext) {
    const session = await this.sessionManager.getSession(ctx);

    let areaId = session.areasNumber
    if (ctx.message && ctx.message.text[0] !== '/') {
      areaId = parseInt(ctx.message.text);
    }

    const districts = await prisma.districts.findMany({
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

    if (ctx.message && ctx.message.text[0] !== '/') {
      districtId = parseInt(ctx.message.text);
    }

    let salons = await prisma.salons.findMany({
      where: {
        districtId: districtId,
      },

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

    let salon = await prisma.salons.findUnique({
      where: {
        id: salonId + 82
      }
    });

    session.salonNumber = salonId;
    await this.sessionManager.saveSession(ctx, session);

    await ctx.reply(await MessageCreator.getMessageWithSalonInfo(salon), stepBackButton);
  }

  private async answerSortedSalonsByPrice(ctx: TelegrafContext) {
    const session = await this.sessionManager.getSession(ctx);
    let salons = await prisma.salons.findMany({
      where: {
        districtId: session.districtNumber
      }
    });

    salons.sort((a: any, b: any) => {
      return a.price - b.price;
    });

    await ctx.reply(await MessageCreator.getMessageWithSalons(salons), sortButtons);
    session.userState = 3;

    await this.sessionManager.saveSession(ctx, session);
  }

  private async answerSortedSalonsByRating(ctx: TelegrafContext) {
    const session = await this.sessionManager.getSession(ctx);

    let salons = await prisma.salons.findMany({
      where: {
        districtId: session.districtNumber
      }
    });

    salons.sort((a: any, b: any) => b.rating - a.rating);

    await ctx.reply(await MessageCreator.getMessageWithSalons(salons), sortButtons);


    session.userState = 3;
    await this.sessionManager.saveSession(ctx, session);
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
  }

  private async go_back(ctx: TelegrafContext) {
    console.log('Start going back');

    const session = await this.sessionManager.getSession(ctx);
    console.log('Current userState: ', session.userState);

    if (session.userState > 1) session.userState -= 2;
    await this.sessionManager.saveSession(ctx, session);

    console.log('Current userState: ', session.userState);

    await this.answerByState(ctx);
  }

}

const bot = new BeautyParserBot(botToken);
bot.setHandlers();


process.once('SIGINT', () => bot.restructure());
process.once('SIGTERM', () => bot.restructure());
