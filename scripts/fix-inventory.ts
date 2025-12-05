import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixInventory() {
    console.log('🔧 Starting Inventory Fix...\n')

    // Step 1: Reset all logs to IN_STOCK
    const logsUpdated = await prisma.log.updateMany({
        data: { status: 'IN_STOCK', productionBatchId: null }
    })
    console.log(`✅ Reset ${logsUpdated.count} logs to IN_STOCK`)

    // Step 2: Ensure standard products exist
    const products = [
        { name: 'Horizontal Beam A', sku: 'HB-A', standardVolume: 20 },
        { name: 'Balok Struktural', sku: 'BS-01', standardVolume: 50 },
        { name: 'Papan Cor', sku: 'PC-01', standardVolume: 5 },
    ]

    for (const product of products) {
        await prisma.productType.upsert({
            where: { sku: product.sku },
            update: { name: product.name, standardVolume: product.standardVolume },
            create: product
        })
    }
    console.log(`✅ Verified ${products.length} product types`)

    // Step 3: Report
    console.log(`\n🎉 Fixed ${logsUpdated.count} Logs and Verified Products`)
}

fixInventory()
    .catch(e => {
        console.error('❌ Error:', e)
        process.exit(1)
    })
    .finally(() => prisma.$disconnect())
