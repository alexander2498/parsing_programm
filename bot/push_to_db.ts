import {Prisma, PrismaClient} from "@prisma/client";
import fs from "fs";

const prisma = new PrismaClient();


async function main() {
  const globalSalons: Prisma.salonsCreateManyInput[] = Array.from(JSON.parse(await fs.promises.readFile('salons.json', 'utf8'))) as Prisma.salonsCreateManyInput[]
  for (const salon of globalSalons) {
    await prisma.salons.create({
      data: salon
    });
  }

}

main();