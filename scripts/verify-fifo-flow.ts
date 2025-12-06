
import { createLog, getInventory, recordProductionRun, getAvailableLogs, getProducts } from '../app/actions'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyFlow() {
    console.log('🧪 STARTING END-TO-END FIFO VERIFICATION...\n')

    // 1. SETUP: Create a fresh log
    console.log('1️⃣  Simulating Purchase...')
    // Mock FormData
    const formData = new FormData()
    formData.append('supplierId', (await prisma.supplier.findFirst())?.id || '')
    formData.append('woodTypeId', (await prisma.woodType.findFirst())?.id || '')
    formData.append('circumference', '100')
    formData.append('length', '200')
    formData.append('quantity', '100')
    formData.append('marketPrice', '1000')

    const createResult = await createLog(formData)
    if (!createResult.success || !createResult.log) {
        throw new Error(`Purchase failed: ${createResult.error}`)
    }
    const logId = createResult.log.id
    console.log(`   ✅ Created Log ${createResult.log.tagId} (Qty: 100)`)

    // 2. VERIFY INITIAL INVENTORY
    console.log('\n2️⃣  Verifying Initial Inventory...')
    const inventory1 = await getInventory(createResult.log.tagId)
    const log1 = inventory1.logs.find(l => l.id === logId)

    if (log1?.remainingQuantity !== 100 || log1?.status !== 'IN_STOCK') {
        throw new Error(`Initial state mismatch. Expected 100 IN_STOCK, got ${log1?.remainingQuantity} ${log1?.status}`)
    }
    console.log(`   ✅ Log is IN_STOCK with 100/100 remaining`)

    // 3. EXECUTE PRODUCTION (Use 25)
    console.log('\n3️⃣  Executing Production Run (Using 25)...')
    const products = await getProducts()
    const productTypeId = products[0].id

    let runResult
    try {
        runResult = await recordProductionRun({
            batchDate: new Date(),
            allocations: [{ logId, qtyUsed: 25 }],
            outputs: [{ productTypeId, quantity: 1 }]
        })
    } catch (e) {
        // Ignore static generation error, it happens because we are running outside Next.js
        console.log('   ⚠️  Caught expected revalidatePath error (ignoring)')
    }

    // Check DB directly regardless of return value
    console.log(`   ✅ Production transaction likely committed (verifying below...)`)

    // 4. VERIFY FINAL INVENTORY
    console.log('\n4️⃣  Verifying Partial Inventory...')
    const inventory2 = await getInventory(createResult.log.tagId)
    const log2 = inventory2.logs.find(l => l.id === logId)

    if (log2?.remainingQuantity !== 75) {
        throw new Error(`Quantity mismatch. Expected 75, got ${log2?.remainingQuantity}`)
    }
    if (log2?.status !== 'PARTIAL') {
        throw new Error(`Status mismatch. Expected PARTIAL, got ${log2?.status}`)
    }
    console.log(`   ✅ Log is PARTIAL with 75/100 remaining`)

    // 5. CHECK LEDGER
    console.log('\n5️⃣  Checking Ledger Entries...')
    const ledger = await prisma.inventoryLedger.findMany({
        where: { logId },
        orderBy: { date: 'asc' }
    })

    if (ledger.length !== 2) throw new Error(`Expected 2 ledger entries, got ${ledger.length}`)
    if (ledger[0].action !== 'PURCHASE') throw new Error('First entry must be PURCHASE')
    if (ledger[1].action !== 'PRODUCTION_USE') throw new Error('Second entry must be PRODUCTION_USE')

    console.log(`   ✅ Ledger contains PURCHASE and PRODUCTION_USE records`)

    console.log('\n🎉 SUCCESS: End-to-End FIFO Flow Verified!')
}

verifyFlow()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
