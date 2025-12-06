'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { calculateLogValuation, LOG_BASIS } from '@/lib/calculator'

// ============================================
// PURCHASING & LOG CREATION
// ============================================

export async function createLog(formData: FormData) {
    const supplierId = formData.get('supplierId') as string
    const woodTypeId = formData.get('woodTypeId') as string
    const circumference = parseInt(formData.get('circumference') as string)
    const length = parseInt(formData.get('length') as string)
    const quantity = parseInt(formData.get('quantity') as string)
    const marketPrice = parseInt(formData.get('marketPrice') as string)

    if (!supplierId || !woodTypeId || !circumference || !length || !quantity || !marketPrice) {
        return { success: false, error: 'Missing required fields' }
    }

    try {
        const valuation = calculateLogValuation(circumference, length, quantity, marketPrice)

        const log = await prisma.log.create({
            data: {
                tagId: `LOG-${Date.now()}`,
                circumference,
                length,
                quantity,
                remainingQuantity: quantity, // <--- CRITICAL: Initialize Gas Tank
                diameter: valuation.diameter,
                volumeRaw: valuation.rawVolume,
                volumeFinal: valuation.volumeFinal,
                calculationFactor: LOG_BASIS,
                marketPricePerUnit: marketPrice,
                totalPurchasePrice: valuation.totalPrice,
                supplierId,
                woodTypeId,
                status: 'IN_STOCK'
            }
        })

        await prisma.inventoryLedger.create({
            data: {
                logId: log.id,
                action: 'PURCHASE',
                amountChange: valuation.totalPrice,
            }
        })

        return { success: true, log }
    } catch (error) {
        console.error('Failed to create log:', error)
        return { success: false, error: 'Database error' }
    }
}

// ============================================
// READ & REPORTING
// ============================================

export async function getMasterData() {
    const suppliers = await prisma.supplier.findMany()
    const woodTypes = await prisma.woodType.findMany()
    return { suppliers, woodTypes }
}

export async function getInventory(search?: string) {
    const logs = await prisma.log.findMany({
        where: search ? { tagId: { contains: search } } : undefined,
        include: { supplier: true, woodType: true },
        orderBy: { purchaseDate: 'desc' }
    })

    // KPI Logic: Only count what is physically remaining
    // Formula: (VolumeFinal / OriginalQty) * RemainingQty
    let totalVolume = 0
    let totalValue = 0
    let activeLogCount = 0

    logs.forEach(log => {
        if (log.remainingQuantity > 0) {
            activeLogCount++
            const ratio = log.remainingQuantity / log.quantity
            totalVolume += log.volumeFinal * ratio
            totalValue += log.totalPurchasePrice * ratio
        }
    })

    return {
        logs,
        kpis: {
            totalLogs: activeLogCount,
            totalVolume: Math.round(totalVolume),
            totalValue: Math.round(totalValue)
        }
    }
}

// ============================================
// PRODUCTION TRANSACTION (The Core FIFO Logic)
// ============================================

interface LogAllocation {
    logId: string
    qtyUsed: number
}

interface ProductionOutput {
    productTypeId: string
    quantity: number
}

interface ProductionRunInput {
    batchDate: Date
    allocations: LogAllocation[] // <--- UPDATED: Receives precise usage
    outputs: ProductionOutput[]
}

export async function recordProductionRun(input: ProductionRunInput) {
    const { batchDate, allocations, outputs } = input

    // 1. Validation: Ensure we aren't using ghost logs
    const logIds = allocations.map(a => a.logId)
    const logs = await prisma.log.findMany({
        where: { id: { in: logIds } }
    })

    if (logs.length !== logIds.length) {
        return { success: false, error: 'One or more logs not found in database.' }
    }

    // Map for faster lookup
    const logMap = new Map(logs.map(l => [l.id, l]))

    // 2. Calculate Total Input Volume (The "Cost" of Production)
    let totalInputVolume = 0

    for (const alloc of allocations) {
        const log = logMap.get(alloc.logId)!

        // Safety Check: Over-drafting
        if (alloc.qtyUsed > log.remainingQuantity) {
            return {
                success: false,
                error: `Log ${log.tagId} has only ${log.remainingQuantity} left, but you tried to use ${alloc.qtyUsed}.`
            }
        }

        const volumePerUnit = log.volumeFinal / log.quantity
        totalInputVolume += volumePerUnit * alloc.qtyUsed
    }

    // 3. Calculate Total Output Volume
    const productIds = outputs.map(o => o.productTypeId)
    const products = await prisma.productType.findMany({
        where: { id: { in: productIds } }
    })
    const productMap = new Map(products.map(p => [p.id, p]))

    let totalOutputVolume = 0
    for (const out of outputs) {
        const product = productMap.get(out.productTypeId)
        if (!product) return { success: false, error: 'Product type not found' }
        totalOutputVolume += out.quantity * product.standardVolume
    }

    const waste = totalInputVolume - totalOutputVolume

    // 4. Physics Check
    if (waste < 0) {
        return {
            success: false,
            error: `Physics Violation: Output (${Math.round(totalOutputVolume)}) > Input (${Math.round(totalInputVolume)})`
        }
    }

    // 5. EXECUTE TRANSACTION
    try {
        const result = await prisma.$transaction(async (tx) => {
            // A. Create Batch
            const batch = await tx.productionBatch.create({
                data: {
                    date: batchDate,
                    targetVolume: totalInputVolume
                }
            })

            // B. Consume Logs (The Ledger Logic)
            for (const alloc of allocations) {
                const log = logMap.get(alloc.logId)!
                const newRemaining = log.remainingQuantity - alloc.qtyUsed

                // Determine Status
                let newStatus = 'IN_STOCK'
                if (newRemaining === 0) newStatus = 'CONSUMED'
                else if (newRemaining < log.quantity) newStatus = 'PARTIAL'

                // Update Log
                await tx.log.update({
                    where: { id: log.id },
                    data: {
                        remainingQuantity: newRemaining,
                        status: newStatus,
                        // If fully consumed, link to batch. If partial, we technically 
                        // shouldn't link the *whole* log to one batch, but for now 
                        // we can leave productionBatchId null or create a junction table later.
                        // For this iteration: Only link if CONSUMED to keep lineage simple.
                        productionBatchId: newRemaining === 0 ? batch.id : undefined
                    }
                })

                // Ledger Entry for Audit
                const volumeUsed = (log.volumeFinal / log.quantity) * alloc.qtyUsed
                const valueUsed = (log.totalPurchasePrice / log.quantity) * alloc.qtyUsed

                await tx.inventoryLedger.create({
                    data: {
                        logId: log.id,
                        action: 'PRODUCTION_USE',
                        amountChange: -valueUsed // Negative value for usage
                    }
                })
            }

            // C. Create Outputs
            for (const out of outputs) {
                const product = productMap.get(out.productTypeId)!
                await tx.productionOutput.create({
                    data: {
                        batchId: batch.id,
                        productTypeId: out.productTypeId,
                        quantity: out.quantity,
                        volumeProduced: out.quantity * product.standardVolume
                    }
                })

                // Increase Finished Goods Stock
                await tx.productType.update({
                    where: { id: out.productTypeId },
                    data: { stockCount: { increment: out.quantity } }
                })
            }

            // D. Record Waste
            await tx.wasteRecord.create({
                data: {
                    batchId: batch.id,
                    volumeLoss: waste,
                    reason: 'Production Run'
                }
            })

            return batch
        })

        const efficiency = totalInputVolume > 0 ? (totalOutputVolume / totalInputVolume) * 100 : 0

        revalidatePath('/inventory')
        revalidatePath('/gudang')

        return {
            success: true,
            batchId: result.id,
            summary: {
                efficiency: Math.round(efficiency * 100) / 100
            }
        }

    } catch (error) {
        console.error('Production Error:', error)
        return { success: false, error: 'Transaction Failed' }
    }
}

// ============================================
// HELPERS (Client-Side Fetching)
// ============================================

export async function getInStockLogs() {
    // Only return logs that have juice left
    const logs = await prisma.log.findMany({
        where: {
            remainingQuantity: { gt: 0 }
        },
        include: { woodType: true, supplier: true },
        orderBy: { purchaseDate: 'desc' }
    })
    return logs
}

export async function getProducts() {
    return await prisma.productType.findMany({
        orderBy: { name: 'asc' }
    })
}

export async function getProductInventory() {
    const products = await prisma.productType.findMany({
        orderBy: { stockCount: 'desc' }
    })

    const inventory = products.map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        standardVolume: p.standardVolume,
        stockCount: p.stockCount,
        totalVolume: p.stockCount * p.standardVolume
    }))

    const totalItems = inventory.reduce((sum, p) => sum + p.stockCount, 0)
    const totalPoints = inventory.reduce((sum, p) => sum + p.totalVolume, 0)

    // Estimate Market Value (Rp 5,000 / point is placeholder)
    const marketValue = totalPoints * 5000

    return {
        products: inventory,
        kpis: { totalItems, totalPoints, marketValue }
    }
}