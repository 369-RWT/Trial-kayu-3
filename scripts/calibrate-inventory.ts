import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('⚖️ Calibrating Inventory Levels...')

    // 1. Fetch all logs that are not consumed
    const logs = await prisma.log.findMany({
        where: { status: 'IN_STOCK' }
    })

    console.log(`Found ${logs.length} active batches. Syncing...`)

    // 2. Sync remainingQuantity = quantity
    for (const log of logs) {
        await prisma.log.update({
            where: { id: log.id },
            data: {
                remainingQuantity: log.quantity // Reset tank to full
            }
        })
    }

    console.log('✅ Calibration Complete. System ready for Partial FIFO.')
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
