import {Telegraf} from 'telegraf';
import {ISessionManager, SessionManager} from "./utils/SessionManager";
import TelegrafContext from "telegraf/typings/context";

export interface IChatData {
  newTaskName: string;
  newTaskDescription: string;

}

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

const bot: Telegraf<TelegrafContext> = new Telegraf(process.env.BOT_TOKEN as string);

bot.launch()

process.once('SIGINT', () => bot.stop());
process.once('SIGTERM', () => bot.stop());