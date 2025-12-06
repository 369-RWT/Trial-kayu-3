import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixInventory() {
    console.log('🔧 Starting FULL Inventory & Ledger Fix...\n')

    // Step 1: Reset all logs to IN_STOCK and restore remainingQuantity
    const logs = await prisma.log.findMany()

    for (const log of logs) {
        await prisma.log.update({
            where: { id: log.id },
            data: {
                status: 'IN_STOCK',
                productionBatchId: null,
                remainingQuantity: log.quantity // Restore to full
            }
        })
    }
    console.log(`✅ Reset ${logs.length} logs to IN_STOCK with full quantity`)

    // Step 2: Clear and rebuild ledger
    const deletedLedger = await prisma.inventoryLedger.deleteMany()
    console.log(`🗑️  Cleared ${deletedLedger.count} old ledger entries`)

    // Step 3: Create PURCHASE ledger entries for all logs
    for (const log of logs) {
        await prisma.inventoryLedger.create({
            data: {
                logId: log.id,
                action: 'PURCHASE',
                amountChange: log.totalPurchasePrice
            }
        })
    }
    console.log(`📒 Created ${logs.length} PURCHASE ledger entries`)

    // Step 4: Ensure standard products exist
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

    // Step 5: Report
    console.log(`\n🎉 Fix Complete! Run audit to verify:`)
    console.log(`   npx tsx scripts/audit-ledger.ts`)
}

fixInventory()
    .catch(e => {
        console.error('❌ Error:', e)
        process.exit(1)
    })
    .finally(() => prisma.$disconnect())
