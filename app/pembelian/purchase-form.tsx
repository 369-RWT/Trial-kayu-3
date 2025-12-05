'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { calculateLogValuation } from '@/lib/calculator'
import { createLog } from '@/app/actions'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

interface Supplier { id: string; name: string; code: string }
interface WoodType { id: string; name: string }

export default function PurchaseForm({
    suppliers,
    woodTypes
}: {
    suppliers: Supplier[]
    woodTypes: WoodType[]
}) {
    const [formData, setFormData] = useState({
        supplierId: '',
        woodTypeId: '',
        circumference: 0,
        length: 0,
        quantity: 1,
        marketPrice: 0
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [success, setSuccess] = useState<string | null>(null)

    // Live Math
    const valuation = useMemo(() => {
        return calculateLogValuation(
            formData.circumference || 0,
            formData.length || 0,
            formData.quantity || 1,
            formData.marketPrice || 0
        )
    }, [formData])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: name.includes('Id') ? value : Number(value)
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setSuccess(null)

        const payload = new FormData()
        Object.entries(formData).forEach(([key, value]) => {
            payload.append(key, value.toString())
        })

        const result = await createLog(payload)
        if (result.success) {
            setSuccess(`Success! Log ${result.log?.tagId} created.`)
            // Reset numeric fields only, keep Supplier/Wood for speed input
            setFormData(prev => ({ ...prev, circumference: 0, length: 0, quantity: 1 }))
        } else {
            alert(result.error)
        }
        setIsSubmitting(false)
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto p-6">

            {/* LEFT PANEL: INPUT */}
            <Card className="border-none shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold tracking-tight">New Log Entry</CardTitle>
                    <CardDescription>Enter physical dimensions and supplier details.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="supplierId">Supplier</Label>
                                <Select
                                    name="supplierId"
                                    value={formData.supplierId}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select Supplier...</option>
                                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.code} - {s.name}</option>)}
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="woodTypeId">Wood Type</Label>
                                <Select
                                    name="woodTypeId"
                                    value={formData.woodTypeId}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select Wood...</option>
                                    {woodTypes.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                </Select>
                            </div>
                        </div>

                        <Separator />

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="circumference">Lingkar (cm)</Label>
                                <Input
                                    type="number"
                                    name="circumference"
                                    value={formData.circumference || ''}
                                    onChange={handleChange}
                                    placeholder="e.g 87"
                                    required
                                    className="font-mono text-lg"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="length">Panjang (cm)</Label>
                                <Input
                                    type="number"
                                    name="length"
                                    value={formData.length || ''}
                                    onChange={handleChange}
                                    placeholder="e.g 300"
                                    required
                                    className="font-mono text-lg"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="quantity">Quantity (Logs)</Label>
                                <Input
                                    type="number"
                                    name="quantity"
                                    value={formData.quantity}
                                    onChange={handleChange}
                                    required
                                    className="font-mono text-lg"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="marketPrice">Harga Pasar (Rp)</Label>
                                <Input
                                    type="number"
                                    name="marketPrice"
                                    value={formData.marketPrice || ''}
                                    onChange={handleChange}
                                    placeholder="Per Point"
                                    required
                                    className="font-mono text-lg"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 text-lg bg-slate-900 hover:bg-slate-800"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Saving...' : 'Save Log Entry'}
                        </Button>

                        <AnimatePresence>
                            {success && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="bg-green-50 text-green-700 p-3 rounded-md text-sm font-medium text-center border border-green-200"
                                >
                                    {success}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </form>
                </CardContent>
            </Card>

            {/* RIGHT PANEL: RECEIPT */}
            <div className="relative">
                <div className="sticky top-6">
                    <Card className="bg-slate-50 border-slate-200 shadow-sm overflow-hidden">
                        <CardHeader className="pb-4">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-slate-500 text-sm font-medium uppercase tracking-wider">Valuation Receipt</CardTitle>
                                <Badge variant="secondary" className="font-mono text-xs">LOG-PREVIEW</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">

                            <div className="space-y-1">
                                <p className="text-xs text-slate-400 font-medium">CALCULATION FACTOR</p>
                                <p className="text-xl font-mono text-slate-700">785 <span className="text-xs text-slate-400">BASIS</span></p>
                            </div>

                            <div className="space-y-1">
                                <p className="text-xs text-slate-400 font-medium">RAW VOLUME</p>
                                <div className="text-lg font-mono text-slate-500 truncate">
                                    <AnimatedNumber value={valuation.rawVolume.toLocaleString()} />
                                </div>
                            </div>

                            <Separator className="bg-slate-200" />

                            <div className="flex justify-between items-end">
                                <div className="space-y-1">
                                    <p className="text-xs text-slate-500 font-bold uppercase">Volume Final</p>
                                    <p className="text-sm text-slate-400">(Points)</p>
                                </div>
                                <div className="text-4xl font-bold tracking-tighter text-slate-900">
                                    <AnimatedNumber value={valuation.volumeFinal} />
                                </div>
                            </div>

                            <div className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm">
                                <div className="flex justify-between md:items-center flex-col md:flex-row gap-2">
                                    <span className="text-sm font-medium text-slate-500">Total Purchase Price</span>
                                    <span className="text-2xl md:text-3xl font-bold text-green-600 tracking-tight">
                                        Rp <AnimatedNumber value={valuation.totalPrice.toLocaleString()} />
                                    </span>
                                </div>
                            </div>

                        </CardContent>

                        {/* Visual Decorative Footer */}
                        <div className="bg-slate-100 p-4 border-t border-slate-200">
                            <div className="flex gap-2 text-[10px] text-slate-400 font-mono justify-center">
                                <span>SWISS</span>
                                <span>•</span>
                                <span>PRECISE</span>
                                <span>•</span>
                                <span>LOGGING</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

        </div>
    )
}

function AnimatedNumber({ value }: { value: string | number }) {
    return (
        <motion.span
            key={value?.toString()}
            initial={{ opacity: 0.5, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
        >
            {value}
        </motion.span>
    )
}
