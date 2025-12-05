'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

interface Product {
    id: string
    name: string
    sku: string
    standardVolume: number
    stockCount: number
    totalVolume: number
}

interface KPIs {
    totalItems: number
    totalPoints: number
    marketValue: number
}

function ProductCard({ product, maxStock }: { product: Product; maxStock: number }) {
    const isOutOfStock = product.stockCount === 0

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <Card className={`bg-white border-slate-200 shadow-sm hover:shadow-md transition-all ${isOutOfStock ? 'opacity-50' : ''}`}>
                {/* Header */}
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-semibold text-slate-800">
                            {product.name}
                        </CardTitle>
                        <Badge variant="secondary" className="font-mono text-xs bg-slate-100 text-slate-600">
                            {product.sku}
                        </Badge>
                    </div>
                </CardHeader>

                {/* Body */}
                <CardContent className="space-y-4">
                    <div className="flex items-end justify-between">
                        <div>
                            <p className={`text-4xl font-bold ${isOutOfStock ? 'text-slate-300' : 'text-slate-900'}`}>
                                {product.stockCount}
                            </p>
                            <p className="text-sm text-slate-500">units in stock</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-slate-400">{product.standardVolume} pts/unit</p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <Progress value={product.stockCount} max={maxStock} />

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <span className="text-sm text-slate-500">Total Volume</span>
                        <span className={`text-lg font-bold ${isOutOfStock ? 'text-slate-300' : 'text-emerald-600'}`}>
                            {product.totalVolume.toLocaleString()} Pts
                        </span>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}

export default function WarehouseClient({
    products,
    kpis
}: {
    products: Product[]
    kpis: KPIs
}) {
    const maxStock = Math.max(...products.map(p => p.stockCount), 100)

    return (
        <div className="min-h-screen bg-slate-50 p-6 space-y-6">

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-slate-900 text-white border-slate-800 shadow-sm relative overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400 uppercase tracking-wide">
                            Total Finished Goods
                        </CardTitle>
                        <div className="h-4 w-4 text-slate-600">📦</div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpis.totalItems.toLocaleString()} <span className="text-xs font-normal text-slate-500">Units</span></div>
                        <p className="text-xs text-slate-500 mt-1">Ready for shipment</p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 text-white border-slate-800 shadow-sm relative overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400 uppercase tracking-wide">
                            Total Volume Value
                        </CardTitle>
                        <div className="h-4 w-4 text-slate-600">📊</div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-400">{kpis.totalPoints.toLocaleString()} <span className="text-xs font-normal text-slate-500">Pts</span></div>
                        <p className="text-xs text-slate-500 mt-1">Accumulated production volume</p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 text-white border-slate-800 shadow-sm relative overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400 uppercase tracking-wide">
                            Est. Market Value
                        </CardTitle>
                        <div className="h-4 w-4 text-slate-600">💰</div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-400">Rp {(kpis.marketValue / 1000000).toFixed(1)} <span className="text-xs font-normal text-slate-500">Jt</span></div>
                        <p className="text-xs text-slate-500 mt-1">Based on current pricing</p>
                    </CardContent>
                </Card>
            </div>

            {/* The Inventory Grid */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-slate-800">Product Inventory</h2>
                    <span className="text-sm text-slate-500">{products.length} products registered</span>
                </div>

                {products.length === 0 ? (
                    <Card className="bg-white border-slate-200">
                        <CardContent className="py-16 text-center">
                            <div className="text-6xl mb-4">📦</div>
                            <p className="text-slate-500 text-lg font-medium">No products in warehouse</p>
                            <p className="text-slate-400 text-sm mt-2">
                                Complete a production run to populate inventory
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {products.map((product, index) => (
                            <motion.div
                                key={product.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <ProductCard product={product} maxStock={maxStock} />
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
