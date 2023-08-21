"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const telegraf_1 = require("telegraf");
const SessionManager_1 = require("./utils/SessionManager");
const client_1 = require("@prisma/client");
const MessageCreator_1 = require("./MessageCreator");
const buttons_1 = require("./views/buttons");
const botToken = '6073480961:AAEO81LcCTWzEJ7b-QcEZH3W6jOT17IW_Tw';
const prisma = new client_1.PrismaClient();
class BeautyParserBot {
    constructor(botToken) {
        this.botToken = botToken;
        this.bot = new telegraf_1.Telegraf(this.botToken);
        this.prisma = new client_1.PrismaClient();
        const initSession = {
            areasNumber: -1,
            districtNumber: -1,
            userState: -1,
            salonNumber: -1,
            metroNumber: -1
        };
        this.sessionManager = new SessionManager_1.SessionManager({
            initSession
        });
    }
    setHandlers() {
        try {
            this.bot.start((ctx) => __awaiter(this, void 0, void 0, function* () { return yield this.answerState0(ctx); }));
            this.bot.help((ctx) => __awaiter(this, void 0, void 0, function* () {
                let message = `Здравствуйте! В этом боте собраны все самые лучшие салоны красоты в Москве.\nКак это работает?\nПри запуске (команда /start) бот присылает список округов с нумерацией, для того чтобы перейти к нужному округу, нужно просто отправить ответным сообщением номер этого округа. Если вы хотите выбрать салон не по району, а по метро, тогда после команды /start, нажмите на одну из кнопок выбора по метро, в которых расположены названия станций по алфавиту. Таким же образом происходит дальнейшее взаимодействие. Если вам нужно вернуться к выбору района или округа, просто воспользуйтесь кнопкой "Назад". Также вы всегда можете запустить бота заново, для этого воспользуйтесь командой /start.`;
                yield ctx.reply(message);
            }));
            this.bot.on('message', (ctx) => __awaiter(this, void 0, void 0, function* () { return yield this.answerByState(ctx); }));
            this.bot.action('by_price', (ctx) => __awaiter(this, void 0, void 0, function* () { return yield this.answerSortedSalonsByPrice(ctx); }));
            this.bot.action('by_rating', (ctx) => __awaiter(this, void 0, void 0, function* () { return yield this.answerSortedSalonsByRating(ctx); }));
            this.bot.action('back', (ctx) => __awaiter(this, void 0, void 0, function* () { return yield this.go_back(ctx); }));
            this.bot.action('metros_125', (ctx) => __awaiter(this, void 0, void 0, function* () { return yield this.answerMetroButton125(ctx); }));
            this.bot.action('metros_251', (ctx) => __awaiter(this, void 0, void 0, function* () { return yield this.answerMetroButton251(ctx); }));
            this.bot.launch();
        }
        catch (e) {
            console.log("error:", e);
        }
    }
    restructure() {
        return this.bot.stop();
    }
    answerState0(ctx) {
        return __awaiter(this, void 0, void 0, function* () {
            const areas = yield prisma.area.findMany();
            const message = yield MessageCreator_1.MessageCreator.getMessageWithAreas(areas);
            const session = yield this.sessionManager.getSession(ctx);
            session.userState = 1;
            yield this.sessionManager.saveSession(ctx, session);
            session.metroNumber = -1;
            session.districtNumber = -1;
            yield ctx.reply(message, buttons_1.startButton);
        });
    }
    answerState1(ctx) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = yield this.sessionManager.getSession(ctx);
            session.metroNumber = -1;
            let areaId = session.areasNumber;
            if (ctx.message && ctx.message.text[0] !== '/') {
                areaId = parseInt(ctx.message.text);
            }
            const districts = yield prisma.district.findMany({
                where: {
                    areaId
                }
            });
            if (districts.length === 0) {
                yield ctx.reply(MessageCreator_1.MessageCreator.getMessageForInvalidRequest());
                return;
            }
            session.areasNumber = areaId;
            session.userState = 2;
            yield this.sessionManager.saveSession(ctx, session);
            const message = yield MessageCreator_1.MessageCreator.getMessageWithDistricts(districts);
            yield ctx.reply(message, buttons_1.stepBackButton);
        });
    }
    answerState2(ctx) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = yield this.sessionManager.getSession(ctx);
            let districtId = session.districtNumber;
            session.metroNumber = -1;
            if (ctx.message && ctx.message.text[0] !== '/') {
                districtId = parseInt(ctx.message.text);
            }
            let salons = yield prisma.salon.findMany({
                where: {
                    districtId: districtId,
                }
            });
            salons = salons.filter((s) => {
                return s.districtId === districtId;
            });
            session.userState = 3;
            session.districtNumber = districtId;
            yield this.sessionManager.saveSession(ctx, session);
            yield ctx.reply(yield MessageCreator_1.MessageCreator.getMessageWithSalons(salons), buttons_1.sortButtons);
        });
    }
    answerState3(ctx) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!ctx.message) {
                return;
            }
            if (ctx.message.text[0] === '/') {
                return;
            }
            const salonId = parseInt(ctx.message.text);
            const session = yield this.sessionManager.getSession(ctx);
            let salon = yield prisma.salon.findUnique({
                where: {
                    id: salonId
                }
            });
            session.salonNumber = salonId;
            yield this.sessionManager.saveSession(ctx, session);
            yield ctx.reply(yield MessageCreator_1.MessageCreator.getMessageWithSalonInfo(salon), buttons_1.stepBackButton);
        });
    }
    answerState4(ctx) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!ctx.message) {
                return;
            }
            if (ctx.message.text[0] === '/') {
                return;
            }
            const session = yield this.sessionManager.getSession(ctx);
            session.districtNumber = -1;
            const metroId = parseInt(ctx.message.text);
            let salons = yield prisma.salon.findMany({
                where: {
                    metroId: metroId
                }
            });
            salons = salons.filter((s) => {
                return s.metroId === metroId;
            });
            session.userState = 3;
            session.metroNumber = metroId;
            yield this.sessionManager.saveSession(ctx, session);
            yield ctx.reply(yield MessageCreator_1.MessageCreator.getMessageWithSalons(salons), buttons_1.sortButtons);
        });
    }
    answerSortedSalonsByPrice(ctx) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = yield this.sessionManager.getSession(ctx);
            if (session.districtNumber !== -1) {
                let salons = yield prisma.salon.findMany({
                    where: {
                        districtId: session.districtNumber
                    }
                });
                salons.sort((a, b) => {
                    return a.price - b.price;
                });
                yield ctx.reply(yield MessageCreator_1.MessageCreator.getMessageWithSalons(salons), buttons_1.sortButtons);
            }
            else if (session.metroNumber !== -1) {
                let salons = yield prisma.salon.findMany({
                    where: {
                        metroId: session.metroNumber
                    }
                });
                salons.sort((a, b) => {
                    return a.price - b.price;
                });
                yield ctx.reply(yield MessageCreator_1.MessageCreator.getMessageWithSalons(salons), buttons_1.sortButtons);
            }
            session.userState = 3;
            yield this.sessionManager.saveSession(ctx, session);
        });
    }
    answerSortedSalonsByRating(ctx) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = yield this.sessionManager.getSession(ctx);
            if (session.districtNumber !== -1) {
                let salons = yield prisma.salon.findMany({
                    where: {
                        districtId: session.districtNumber
                    }
                });
                salons.sort((a, b) => b.rating - a.rating);
                yield ctx.reply(yield MessageCreator_1.MessageCreator.getMessageWithSalons(salons), buttons_1.sortButtons);
            }
            else if (session.metroNumber !== -1) {
                let salons = yield prisma.salon.findMany({
                    where: {
                        metroId: session.metroNumber
                    }
                });
                salons.sort((a, b) => b.rating - a.rating);
                yield ctx.reply(yield MessageCreator_1.MessageCreator.getMessageWithSalons(salons), buttons_1.sortButtons);
            }
            console.log(session.districtNumber, session.metroNumber);
            // @ts-ignore
            session.userState = 3;
            yield this.sessionManager.saveSession(ctx, session);
        });
    }
    answerMetroButton125(ctx) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = yield this.sessionManager.getSession(ctx);
            let metros = yield prisma.metro.findMany();
            yield ctx.reply(yield MessageCreator_1.MessageCreator.getMessageWithMetros(metros, 125), buttons_1.stepBackButton);
            session.userState = 4;
            yield this.sessionManager.saveSession(ctx, session);
        });
    }
    answerMetroButton251(ctx) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = yield this.sessionManager.getSession(ctx);
            let metros = yield prisma.metro.findMany();
            yield ctx.reply(yield MessageCreator_1.MessageCreator.getMessageWithMetros(metros, 251), buttons_1.stepBackButton);
            session.userState = 4;
            yield this.sessionManager.saveSession(ctx, session);
        });
    }
    answerByState(ctx) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = yield this.sessionManager.getSession(ctx);
            console.log('Start answering by state with state = ', session.userState);
            if (session.userState === 0) {
                yield this.answerState0(ctx);
            }
            else if (session.userState === 1) {
                yield this.answerState1(ctx);
            }
            else if (session.userState === 2) {
                yield this.answerState2(ctx);
            }
            else if (session.userState === 3) {
                yield this.answerState3(ctx);
            }
            else if (session.userState === 4) {
                yield this.answerState4(ctx);
            }
        });
    }
    go_back(ctx) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Start going back');
            const session = yield this.sessionManager.getSession(ctx);
            console.log('Current userState: ', session.userState);
            if (session.userState === 3 && session.metroNumber !== -1) {
                session.userState = 4;
                yield this.answerByState(ctx);
            }
            if (session.userState > 1 && session.userState < 4)
                session.userState -= 2;
            else if (session.userState === 4)
                session.userState = 0;
            yield this.sessionManager.saveSession(ctx, session);
            console.log('Current userState: ', session.userState);
            yield this.answerByState(ctx);
        });
    }
}
const bot = new BeautyParserBot(botToken);
bot.setHandlers();
process.once('SIGINT', () => bot.restructure());
process.once('SIGTERM', () => bot.restructure());
