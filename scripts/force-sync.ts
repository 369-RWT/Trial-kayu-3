import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function forceSync() {
    console.log('🔄 Starting Force Sync...\n')

    // Step 1 & 2: Update ALL logs to IN_STOCK with current date
    const result = await prisma.log.updateMany({
        data: {
            status: 'IN_STOCK',
            purchaseDate: new Date(),
            productionBatchId: null
        }
    })

    console.log(`✅ Resync complete. Status set to IN_STOCK for ${result.count} logs.`)

    // Verify
    const logs = await prisma.log.findMany({
        select: { id: true, tagId: true, status: true, purchaseDate: true }
    })
    console.log('\n📋 Current Logs:')
    logs.forEach(log => {
        console.log(`   - ${log.tagId}: status="${log.status}", date=${log.purchaseDate.toISOString()}`)
    })
}

forceSync()
    .catch(e => {
        console.error('❌ Error:', e)
        process.exit(1)
    })
    .finally(() => prisma.$disconnect())
