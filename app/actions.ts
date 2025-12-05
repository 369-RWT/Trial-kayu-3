'use server'

import { PrismaClient } from '@prisma/client'
import { calculateLogValuation, LOG_BASIS } from '@/lib/calculator'

const prisma = new PrismaClient()

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

        // Create simple inventory ledger entry
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

export async function getMasterData() {
    const suppliers = await prisma.supplier.findMany()
    const woodTypes = await prisma.woodType.findMany()
    return { suppliers, woodTypes }
}

export async function getInventory(search?: string) {
    const logs = await prisma.log.findMany({
        where: search ? {
            tagId: { contains: search }
        } : undefined,
        include: {
            supplier: true,
            woodType: true,
        },
        orderBy: {
            purchaseDate: 'desc'
        }
    })

    // Calculate KPIs
    const totalLogs = logs.length
    const totalVolume = logs.reduce((sum, log) => sum + log.volumeFinal, 0)
    const totalValue = logs.reduce((sum, log) => sum + log.totalPurchasePrice, 0)

    return {
        logs,
        kpis: {
            totalLogs,
            totalVolume,
            totalValue
        }
    }
}

// ============================================
// PRODUCTION TRANSACTION
// ============================================

interface ProductionOutput {
    productTypeId: string
    quantity: number
}

export async function recordProductionRun(
    batchDate: Date,
    logIds: string[],
    outputs: ProductionOutput[]
) {
    // Step 1: Fetch and validate Logs
    const logs = await prisma.log.findMany({
        where: { id: { in: logIds } }
    })

    if (logs.length !== logIds.length) {
        return { success: false, error: 'Some logs were not found' }
    }

    const invalidLogs = logs.filter(log => log.status !== 'IN_STOCK')
    if (invalidLogs.length > 0) {
        return {
            success: false,
            error: `Logs not available: ${invalidLogs.map(l => l.tagId).join(', ')}`
        }
    }

    const totalInput = logs.reduce((sum, log) => sum + log.volumeFinal, 0)

    // Step 2: Fetch Products and calculate output
    const productIds = outputs.map(o => o.productTypeId)
    const products = await prisma.productType.findMany({
        where: { id: { in: productIds } }
    })

    if (products.length !== productIds.length) {
        return { success: false, error: 'Some products were not found' }
    }

    const productMap = new Map(products.map(p => [p.id, p]))

    let totalOutput = 0
    for (const output of outputs) {
        const product = productMap.get(output.productTypeId)
        if (!product) continue
        totalOutput += output.quantity * product.standardVolume
    }

    // Step 3: Calculate waste
    const waste = totalInput - totalOutput

    // Step 4: Physics validation
    if (waste < 0) {
        return {
            success: false,
            error: `Physics Violation: Output (${totalOutput} pts) exceeds Input (${totalInput} pts)`
        }
    }

    // Step 5: Execute transaction
    try {
        const result = await prisma.$transaction(async (tx) => {
            // Create Production Batch
            const batch = await tx.productionBatch.create({
                data: {
                    date: batchDate,
                    targetVolume: totalInput,
                }
            })

            // Update Logs: mark as CONSUMED and link to batch
            await tx.log.updateMany({
                where: { id: { in: logIds } },
                data: {
                    status: 'CONSUMED',
                    productionBatchId: batch.id
                }
            })

            // Create Production Outputs
            for (const output of outputs) {
                const product = productMap.get(output.productTypeId)!

                await tx.productionOutput.create({
                    data: {
                        batchId: batch.id,
                        productTypeId: output.productTypeId,
                        quantity: output.quantity,
                        volumeProduced: output.quantity * product.standardVolume
                    }
                })

                // Update product stock count
                await tx.productType.update({
                    where: { id: output.productTypeId },
                    data: {
                        stockCount: { increment: output.quantity }
                    }
                })
            }

            // Create Waste Record
            await tx.wasteRecord.create({
                data: {
                    batchId: batch.id,
                    volumeLoss: waste,
                    reason: 'Production Waste (Auto-calculated)'
                }
            })

            return batch
        })

        const efficiency = totalInput > 0 ? (totalOutput / totalInput) * 100 : 0

        return {
            success: true,
            batchId: result.id,
            summary: {
                totalInput,
                totalOutput,
                waste,
                efficiency: Math.round(efficiency * 100) / 100 // 2 decimal places
            }
        }
    } catch (error) {
        console.error('Production transaction failed:', error)
        return { success: false, error: 'Transaction failed' }
    }
}

// Helper: Get available logs for production
export async function getAvailableLogs() {
    return prisma.log.findMany({
        where: { status: 'IN_STOCK' },
        include: {
            supplier: true,
            woodType: true,
        },
        orderBy: { purchaseDate: 'desc' }
    })
}

// Helper: Get product types for production form
export async function getProductTypes() {
    return prisma.productType.findMany({
        orderBy: { name: 'asc' }
    })
}
