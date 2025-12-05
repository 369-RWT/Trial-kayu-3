'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { recordProductionRun } from '@/app/actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'

interface Log {
    id: string
    tagId: string
    volumeFinal: number
    supplier: { name: string }
    woodType: { name: string }
}

interface ProductType {
    id: string
    name: string
    sku: string
    standardVolume: number
}

interface OutputRow {
    id: string
    productTypeId: string
    quantity: number
}

export default function ProductionForm({
    availableLogs,
    productTypes
}: {
    availableLogs: Log[]
    productTypes: ProductType[]
}) {
    const router = useRouter()
    const [selectedLogIds, setSelectedLogIds] = useState<Set<string>>(new Set())
    const [outputs, setOutputs] = useState<OutputRow[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null)

    // Filter logs by search
    const filteredLogs = availableLogs.filter(log =>
        log.tagId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.supplier.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Calculate totals
    const totalInput = useMemo(() => {
        return availableLogs
            .filter(log => selectedLogIds.has(log.id))
            .reduce((sum, log) => sum + log.volumeFinal, 0)
    }, [availableLogs, selectedLogIds])

    const totalOutput = useMemo(() => {
        return outputs.reduce((sum, output) => {
            const product = productTypes.find(p => p.id === output.productTypeId)
            return sum + (product ? output.quantity * product.standardVolume : 0)
        }, 0)
    }, [outputs, productTypes])

    const waste = totalInput - totalOutput
    const efficiency = totalInput > 0 ? (totalOutput / totalInput) * 100 : 0

    // Handlers
    const toggleLog = (logId: string) => {
        setSelectedLogIds(prev => {
            const next = new Set(prev)
            if (next.has(logId)) next.delete(logId)
            else next.add(logId)
            return next
        })
    }

    const selectAllLogs = () => {
        if (selectedLogIds.size === filteredLogs.length) {
            setSelectedLogIds(new Set())
        } else {
            setSelectedLogIds(new Set(filteredLogs.map(l => l.id)))
        }
    }

    const addOutputRow = () => {
        setOutputs(prev => [...prev, {
            id: crypto.randomUUID(),
            productTypeId: '',
            quantity: 0
        }])
    }

    const updateOutput = (id: string, field: 'productTypeId' | 'quantity', value: string | number) => {
        setOutputs(prev => prev.map(row =>
            row.id === id ? { ...row, [field]: value } : row
        ))
    }

    const removeOutput = (id: string) => {
        setOutputs(prev => prev.filter(row => row.id !== id))
    }

    const canSubmit = selectedLogIds.size > 0 && outputs.length > 0 && waste >= 0 && !isSubmitting

    const handleSubmit = async () => {
        if (!canSubmit) return
        setIsSubmitting(true)
        setToast(null)

        const result = await recordProductionRun(
            new Date(),
            Array.from(selectedLogIds),
            outputs.filter(o => o.productTypeId && o.quantity > 0).map(o => ({
                productTypeId: o.productTypeId,
                quantity: o.quantity
            }))
        )

        if (result.success) {
            setToast({ type: 'success', message: `Production recorded! Efficiency: ${result.summary?.efficiency}%` })
            setTimeout(() => router.push('/inventory'), 1500)
        } else {
            setToast({ type: 'error', message: result.error || 'Failed to record production' })
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-100">
            {/* Safety Header - Waste Monitor */}
            <div className={`sticky top-0 z-20 py-3 px-6 border-b ${waste < 0
                    ? 'bg-red-600 text-white'
                    : waste === 0 && totalInput > 0
                        ? 'bg-green-600 text-white'
                        : 'bg-amber-500 text-white'
                }`}>
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h1 className="font-bold text-lg">PRODUCTION STUDIO</h1>
                        <Separator orientation="vertical" className="h-6 bg-white/30" />
                        <span className="text-sm opacity-90">Al Fath Kayu</span>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-xs opacity-75 uppercase">Waste Monitor</p>
                            <p className="text-xl font-bold tracking-tight">
                                {waste < 0 ? (
                                    <>⚠️ ERROR: Invalid Output</>
                                ) : waste === 0 && totalInput > 0 ? (
                                    <>✓ Perfect Efficiency</>
                                ) : (
                                    <>{waste.toLocaleString()} Points</>
                                )}
                            </p>
                        </div>

                        <Button
                            onClick={handleSubmit}
                            disabled={!canSubmit}
                            className={`h-10 px-6 font-semibold ${canSubmit
                                    ? 'bg-white text-slate-900 hover:bg-slate-100'
                                    : 'bg-white/20 text-white/50 cursor-not-allowed'
                                }`}
                        >
                            {isSubmitting ? 'Processing...' : 'Finalize Production'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                            }`}
                    >
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content - Two Column */}
            <div className="max-w-7xl mx-auto p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* LEFT: Raw Material Source */}
                    <Card className="flex flex-col h-[calc(100vh-180px)]">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">Raw Material Source</CardTitle>
                                <Badge variant="secondary" className="font-mono">
                                    {selectedLogIds.size} Selected
                                </Badge>
                            </div>
                            <div className="flex gap-2 mt-3">
                                <Input
                                    placeholder="Search logs..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="flex-1"
                                />
                                <Button variant="outline" size="sm" onClick={selectAllLogs}>
                                    {selectedLogIds.size === filteredLogs.length ? 'Deselect All' : 'Select All'}
                                </Button>
                            </div>
                        </CardHeader>

                        <CardContent className="flex-1 overflow-auto">
                            <div className="space-y-2">
                                {filteredLogs.length === 0 ? (
                                    <p className="text-center text-slate-400 py-8">No logs available</p>
                                ) : (
                                    filteredLogs.map(log => (
                                        <div
                                            key={log.id}
                                            onClick={() => toggleLog(log.id)}
                                            className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedLogIds.has(log.id)
                                                    ? 'bg-slate-900 text-white border-slate-900'
                                                    : 'bg-white hover:bg-slate-50 border-slate-200'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${selectedLogIds.has(log.id)
                                                            ? 'bg-white border-white'
                                                            : 'border-slate-300'
                                                        }`}>
                                                        {selectedLogIds.has(log.id) && (
                                                            <svg className="w-3 h-3 text-slate-900" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-mono font-bold text-sm">{log.tagId}</p>
                                                        <p className={`text-xs ${selectedLogIds.has(log.id) ? 'text-slate-300' : 'text-slate-500'}`}>
                                                            {log.supplier.name} • {log.woodType.name}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold">{log.volumeFinal}</p>
                                                    <p className={`text-xs ${selectedLogIds.has(log.id) ? 'text-slate-300' : 'text-slate-400'}`}>Points</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>

                        {/* Sticky Footer */}
                        <div className="border-t bg-slate-50 p-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600">Selected Input</span>
                                <span className="text-2xl font-bold text-slate-900">
                                    {totalInput.toLocaleString()} <span className="text-sm font-normal text-slate-500">Points</span>
                                </span>
                            </div>
                        </div>
                    </Card>

                    {/* RIGHT: Production Output */}
                    <Card className="flex flex-col h-[calc(100vh-180px)]">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">Production Output</CardTitle>
                                <Button onClick={addOutputRow} size="sm">
                                    + Add Product
                                </Button>
                            </div>
                        </CardHeader>

                        <CardContent className="flex-1 overflow-auto">
                            {outputs.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                    <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                    <p>No products added yet</p>
                                    <Button onClick={addOutputRow} variant="outline" size="sm" className="mt-3">
                                        + Add Your First Product
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {outputs.map((row, index) => {
                                        const product = productTypes.find(p => p.id === row.productTypeId)
                                        const rowVolume = product ? row.quantity * product.standardVolume : 0

                                        return (
                                            <div key={row.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                                                <div className="flex items-start gap-3">
                                                    <span className="text-xs text-slate-400 font-mono pt-2">#{index + 1}</span>

                                                    <div className="flex-1 space-y-3">
                                                        <Select
                                                            value={row.productTypeId}
                                                            onChange={e => updateOutput(row.id, 'productTypeId', e.target.value)}
                                                        >
                                                            <option value="">Select Product...</option>
                                                            {productTypes.map(p => (
                                                                <option key={p.id} value={p.id}>
                                                                    {p.name} ({p.sku}) - {p.standardVolume} pts/pc
                                                                </option>
                                                            ))}
                                                        </Select>

                                                        <div className="flex items-center gap-3">
                                                            <Input
                                                                type="number"
                                                                min={0}
                                                                value={row.quantity || ''}
                                                                onChange={e => updateOutput(row.id, 'quantity', parseInt(e.target.value) || 0)}
                                                                placeholder="Quantity"
                                                                className="w-32"
                                                            />
                                                            <span className="text-sm text-slate-500">pieces</span>
                                                            {rowVolume > 0 && (
                                                                <Badge variant="secondary" className="ml-auto font-mono">
                                                                    = {rowVolume} pts
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeOutput(row.id)}
                                                        className="text-slate-400 hover:text-red-600"
                                                    >
                                                        ✕
                                                    </Button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </CardContent>

                        {/* Sticky Footer */}
                        <div className="border-t bg-slate-50 p-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600">Total Output</span>
                                <span className="text-2xl font-bold text-slate-900">
                                    {totalOutput.toLocaleString()} <span className="text-sm font-normal text-slate-500">Points</span>
                                </span>
                            </div>
                            {totalInput > 0 && (
                                <div className="mt-2 text-right">
                                    <span className={`text-sm font-medium ${efficiency >= 80 ? 'text-green-600' : 'text-amber-600'}`}>
                                        Efficiency: {efficiency.toFixed(1)}%
                                    </span>
                                </div>
                            )}
                        </div>
                    </Card>

                </div>
            </div>
        </div>
    )
}
