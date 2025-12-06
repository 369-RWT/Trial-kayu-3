import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function audit() {
    console.log('🕵️  STARTING FIFO AUDIT...\n')

    // 1. Calculate Physical Value (What is currently in the logs?)
    const logs = await prisma.log.findMany()
    let physicalValue = 0

    logs.forEach(log => {
        if (log.quantity > 0) {
            const unitCost = log.totalPurchasePrice / log.quantity
            physicalValue += unitCost * log.remainingQuantity
        }
    })

    // 2. Calculate Ledger Value (What does the transaction history say?)
    // Ledger tracks: PURCHASE (+), PRODUCTION_USE (-)
    const ledgerEntries = await prisma.inventoryLedger.findMany()
    let ledgerValue = 0

    ledgerEntries.forEach(entry => {
        ledgerValue += entry.amountChange
    })

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`💰 Physical Inventory Value:  Rp ${physicalValue.toLocaleString()}`)
    console.log(`📒 Ledger Transaction Value: Rp ${ledgerValue.toLocaleString()}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    const diff = Math.abs(physicalValue - ledgerValue)
    if (diff < 100) { // Allow tiny floating point error
        console.log('✅ AUDIT PASSED: System is strictly FIFO Compliant.')
    } else {
        console.log(`❌ AUDIT FAILED: Discrepancy of Rp ${diff.toLocaleString()}`)
        console.log('   Check your "recordProductionRun" logic for "amountChange" calculation.')
    }
}

audit()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
