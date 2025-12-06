'use client'

import { useState } from 'react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress' // Ensure this component exists

interface Log {
    id: string
    tagId: string
    purchaseDate: Date
    circumference: number
    length: number
    volumeRaw: number
    volumeFinal: number
    quantity: number            // Original
    remainingQuantity: number   // Current
    totalPurchasePrice: number
    status: string
    supplier: { name: string; code: string }
    woodType: { name: string }
}

interface KPIs {
    totalLogs: number
    totalVolume: number
    totalValue: number
}

const ITEMS_PER_PAGE = 10

export default function InventoryTable({
    initialLogs,
    kpis
}: {
    initialLogs: Log[]
    kpis: KPIs
}) {
    const [search, setSearch] = useState('')
    const [currentPage, setCurrentPage] = useState(0)

    // Client-side filtering
    const filteredLogs = initialLogs.filter(log =>
        log.tagId.toLowerCase().includes(search.toLowerCase()) ||
        log.status.toLowerCase().includes(search.toLowerCase())
    )

    const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE)
    const paginatedLogs = filteredLogs.slice(
        currentPage * ITEMS_PER_PAGE,
        (currentPage + 1) * ITEMS_PER_PAGE
    )

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric'
        })
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID').format(value)
    }

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-slate-900 text-white border-0">
                    <CardContent className="p-6">
                        <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Active Batches</p>
                        <p className="text-3xl font-bold tracking-tight mt-1">{kpis.totalLogs}</p>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900 text-white border-0">
                    <CardContent className="p-6">
                        <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Net Volume Available</p>
                        <p className="text-3xl font-bold tracking-tight mt-1">
                            {formatCurrency(kpis.totalVolume)} <span className="text-lg text-slate-400">Pts</span>
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900 text-white border-0">
                    <CardContent className="p-6">
                        <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Net FIFO Value</p>
                        <p className="text-3xl font-bold tracking-tight mt-1 text-green-400">
                            Rp {formatCurrency(kpis.totalValue)}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Table Controls */}
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-700">Inventory Ledger</h2>
                <Input
                    placeholder="Search Tag ID..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setCurrentPage(0) }}
                    className="w-64 h-9 text-sm"
                />
            </div>

            {/* Data Table */}
            <Card className="border-slate-200 overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="font-semibold text-xs uppercase text-slate-500">Tag ID</TableHead>
                            <TableHead className="font-semibold text-xs uppercase text-slate-500">Details</TableHead>
                            <TableHead className="font-semibold text-xs uppercase text-slate-500 text-right">Orig. Vol</TableHead>
                            <TableHead className="font-semibold text-xs uppercase text-slate-500 text-center">Availability (Gas Tank)</TableHead>
                            <TableHead className="font-semibold text-xs uppercase text-slate-500 text-right">Net Value</TableHead>
                            <TableHead className="font-semibold text-xs uppercase text-slate-500">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedLogs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-12 text-slate-400">No data found.</TableCell>
                            </TableRow>
                        ) : (
                            paginatedLogs.map((log) => {
                                // Calculate Percentage Remaining
                                const percent = log.quantity > 0
                                    ? (log.remainingQuantity / log.quantity) * 100
                                    : 0;

                                // Calculate Current Value based on Remaining
                                const unitCost = log.totalPurchasePrice / log.quantity;
                                const currentValue = unitCost * log.remainingQuantity;

                                return (
                                    <TableRow key={log.id} className="hover:bg-slate-50/50">
                                        <TableCell className="font-mono font-bold text-slate-900">{log.tagId}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-slate-700">{log.woodType.name}</span>
                                                <span className="text-xs text-slate-400">{log.supplier.name} • {formatDate(log.purchaseDate)}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-sm text-slate-500">
                                            {log.volumeFinal} pts
                                        </TableCell>
                                        <TableCell className="w-[200px]">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex justify-between text-[10px] uppercase font-bold text-slate-500">
                                                    <span>{log.remainingQuantity} / {log.quantity}</span>
                                                    <span>{Math.round(percent)}%</span>
                                                </div>
                                                <Progress value={percent} className="h-2" />
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-semibold text-green-600">
                                            Rp {formatCurrency(currentValue)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={log.status === 'IN_STOCK' ? 'default' : log.status === 'PARTIAL' ? 'secondary' : 'outline'}
                                                className={
                                                    log.status === 'IN_STOCK' ? 'bg-blue-100 text-blue-700 border-0' :
                                                        log.status === 'PARTIAL' ? 'bg-amber-100 text-amber-700 border-0' :
                                                            'bg-slate-100 text-slate-400 border-0'
                                                }
                                            >
                                                {log.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t bg-slate-50/50">
                        <span className="text-sm text-slate-500">
                            Page {currentPage + 1} of {totalPages}
                        </span>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                                disabled={currentPage === 0}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                                disabled={currentPage === totalPages - 1}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    )
}
