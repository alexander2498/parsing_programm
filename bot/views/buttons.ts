import {Markup} from "telegraf";

export const sortButtons = Markup.inlineKeyboard([
  Markup.callbackButton('По цене', 'by_price'),
  Markup.callbackButton('По рейтингу', 'by_rating'),
  Markup.callbackButton('Назад', 'back')
]).extra();

export const stepBackButton = Markup.inlineKeyboard([
  Markup.callbackButton('Назад', 'back')
]).extra();

export const startButton = Markup.inlineKeyboard([
  Markup.callbackButton('Искать по метро 1 - 125', 'metros_125'),
  Markup.callbackButton('Искать по метро 126 - 251', 'metros_251')

]).extra();