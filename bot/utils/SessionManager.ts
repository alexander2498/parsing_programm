import {TelegrafContext} from "telegraf/typings/context";
import {PrismaClient} from "@prisma/client";
export interface ISessionManagerOptions<ISession> {
  initSession: ISession,
}

export interface ISessionManager<ISession> {
  getSession: (ctx: TelegrafContext) => Promise<ISession>

  saveSession: (ctx: TelegrafContext, session: ISession) => Promise<void>
}


export class SessionManager<ISession> implements ISessionManager<ISession> {
  private readonly initSession: ISession;
  private db: PrismaClient;

  constructor(options: ISessionManagerOptions<ISession>) {
    this.initSession = options.initSession
    this.db = new PrismaClient();
  }

  private _getKeyByContext(ctx: TelegrafContext): string {
    if (ctx.from) {
      return (ctx.from.id).toString() + "_" + ctx.from.username;
    }
    return "";
  }

  public async getSession(ctx: TelegrafContext): Promise<ISession> {
    const key = this._getKeyByContext(ctx);
    const result = await this.db.session.findUnique({where: {key}});
    if (!result) return this.initSession as ISession;
    return JSON.parse(result.data) as ISession;
  }

  public async saveSession(ctx: TelegrafContext, session: ISession) {
    const key = this._getKeyByContext(ctx);
    await this.db.session.upsert({
      where: {key},
      create: {
        key: key,
        data: JSON.stringify(session)
      },
      update: {
        data: JSON.stringify(session)
      }
    });
  }
}