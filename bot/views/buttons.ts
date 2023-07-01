import {Markup} from "telegraf";

export const sortButtons = Markup.inlineKeyboard([
  Markup.callbackButton('По цене', 'by_price'),
  Markup.callbackButton('По рейтингу', 'by_rating'),
  Markup.callbackButton('Назад', 'back')
]).extra();

export const stepBackButton = Markup.inlineKeyboard([
  Markup.callbackButton('Назад', 'back')
]).extra();

