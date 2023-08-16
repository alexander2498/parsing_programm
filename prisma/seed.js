import {PrismaClient} from '@prisma/client';
import areas from "../areas.json" assert {type: "json"}
import districts from "../districts.json" assert {type: "json"}
import metros from "../metros.json" assert {type: "json"}
import salons from "../saloons3.json" assert {type: "json"}

const prisma = new PrismaClient()

async function main() {
    await prisma.area.createMany({
        data: areas
    })
    await prisma.district.createMany({
        data: districts.map(x => {
            x.areaId = x.area_id;
            delete x.area_id;
            return x;
        })
    })
    await prisma.metro.createMany({
        data: metros
    })
    await prisma.salon.createMany({
        data: salons
    })
}


main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })