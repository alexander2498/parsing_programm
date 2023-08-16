import {Area, District, Salon, Metro} from "@prisma/client";


export class MessageCreator {
  static async getMessageWithAreas(areas: Area[]): Promise<string> {
    let message = `Добрый день! Выберите округ для поиска района. Для выбора напишите мне идентификатор находящийся около названия необходимого округа. \n`;
    for (const area of areas) {
      message += `${area.id}. ${area.name}\n`;

    }
    return message;
  }
  static async getMessageWithMetros(metros: Metro[], stop: number): Promise<string> {
    let message = `Добрый день! Выберите метро для поиска салона. Для выбора напишите мне идентификатор находящийся около названия необходимого метро. \n`;
    for (const metro of metros) {
      if (metro.id > stop - 126) {
        message += `${metro.id}. ${metro.name}\n`;
      }
      if (metro.id === stop) {
        break
      }
    }
    return message;
  }

  static async getMessageWithSalons(salons: Salon[]): Promise<string> {
    let message = `Выберите салон о котором хотите узнать. Для выбора напишите мне идентификатор находящийся около названия необходимого салона. \n`;
    for (const salon of salons) {
      message += `${salon.id}. ${salon.name}\n`;
    }

    return message;
  }

  static async getMessageWithDistricts(districts: District[]): Promise<string> {
    let message = `Выберите район для поиска салона. Для выбора напишите мне идентификатор находящийся около названия необходимого района. \n`;
    for (const district of districts) {
      message += `${district.id}. ${district.name}\n`;
    }
    return message;
  }

  static getMessageForInvalidRequest(): string {
    return `Неправильный запрос. Попробуйте еще раз.`;
  }

  static async getMessageWithSalonInfo(salon: Salon | null): Promise<string> {
    if (salon === null) {
      return 'Данные об этом салоне не найдены';
    }

    // @ts-ignore
    const priceString = salon?.price === 1000000 ? '-' : salon?.price;
    return `Название: ${salon?.name}\nРейтинг: ${salon?.rating}/10\nЦена: ${priceString}\nАдрес: ${salon?.address}\nНомер телефона: ${salon?.phone}\nСайт: ${salon?.site}\n`;
  }
}
