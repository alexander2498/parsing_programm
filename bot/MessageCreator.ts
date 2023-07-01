import {areas, districts, salons} from "@prisma/client";


export class MessageCreator {
  static async getMessageWithAreas(areas: areas[]): Promise<string> {
    let message = `Добрый день! Выберите округ для поиска района. Для выбора напишите мне идентификатор находящийся около названия необходимого округа. \n`;
    for (const area of areas) {
      message += `${area.id}. ${area.name}\n`;
    }
    return message;
  }

  static async getMessageWithSalons(salons: salons[]): Promise<string> {
    let message = `Выберите салон о котором хотите узнать. Для выбора напишите мне идентификатор находящийся около названия необходимого салона. \n`;
    for (const salon of salons) {
      message += `${salon.id - 82}. ${salon.name}\n`;
    }

    return message;
  }

  static async getMessageWithDistricts(districts: districts[]): Promise<string> {
    let message = `Выберите район для поиска салона. Для выбора напишите мне идентификатор находящийся около названия необходимого района. \n`;
    for (const district of districts) {
      message += `${district.id}. ${district.name}\n`;
    }
    return message;
  }

  static getMessageForInvalidRequest(): string {
    return `Неправильный запрос. Попробуйте еще раз.`;
  }

  static async getMessageWithSalonInfo(salon: salons | null): Promise<string> {
    if (salon === null) {
      return 'Данные об этом салоне не найдены';
    }

    const priceString = salon?.price === 1000000 ? '-' : salon?.price;
    return `Название: ${salon?.name}\nРейтинг: ${salon?.rating}/10\nЦена: ${priceString}\nАдрес: ${salon?.address}\nНомер телефона: ${salon?.phone}\nСайт: ${salon?.site}\n`;
  }
}
