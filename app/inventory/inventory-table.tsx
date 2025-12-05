'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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

interface Log {
    id: string
    tagId: string
    purchaseDate: Date
    circumference: number
    length: number
    volumeRaw: number
    volumeFinal: number
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
    const router = useRouter()
    const [search, setSearch] = useState('')
    const [currentPage, setCurrentPage] = useState(0)

    // Client-side filtering (since we have all data)
    const filteredLogs = initialLogs.filter(log =>
        log.tagId.toLowerCase().includes(search.toLowerCase())
    )

    const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE)
    const paginatedLogs = filteredLogs.slice(
        currentPage * ITEMS_PER_PAGE,
        (currentPage + 1) * ITEMS_PER_PAGE
    )

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
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
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Total Logs</p>
                                <p className="text-3xl font-bold tracking-tight mt-1">{kpis.totalLogs}</p>
                            </div>
                            <div className="h-12 w-12 rounded-lg bg-slate-800 flex items-center justify-center">
                                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 text-white border-0">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Total Volume</p>
                                <p className="text-3xl font-bold tracking-tight mt-1">
                                    {formatCurrency(kpis.totalVolume)} <span className="text-lg text-slate-400">Points</span>
                                </p>
                            </div>
                            <div className="h-12 w-12 rounded-lg bg-slate-800 flex items-center justify-center">
                                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 text-white border-0">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Total Value</p>
                                <p className="text-3xl font-bold tracking-tight mt-1 text-green-400">
                                    Rp {formatCurrency(kpis.totalValue)}
                                </p>
                            </div>
                            <div className="h-12 w-12 rounded-lg bg-green-900/30 flex items-center justify-center">
                                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Table Controls */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-slate-700">Inventory Logs</h2>
                    <Badge variant="secondary" className="font-mono text-xs">{filteredLogs.length} Records</Badge>
                </div>
                <div className="flex items-center gap-2">
                    <Input
                        placeholder="Search by Tag ID..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value)
                            setCurrentPage(0)
                        }}
                        className="w-64 h-9 text-sm"
                    />
                </div>
            </div>

            {/* Data Table */}
            <Card className="border-slate-200 overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="font-semibold text-xs uppercase text-slate-500">Tag ID</TableHead>
                            <TableHead className="font-semibold text-xs uppercase text-slate-500">Date</TableHead>
                            <TableHead className="font-semibold text-xs uppercase text-slate-500">Supplier • Wood</TableHead>
                            <TableHead className="font-semibold text-xs uppercase text-slate-500">Dimensions</TableHead>
                            <TableHead className="font-semibold text-xs uppercase text-slate-500 text-right">Vol (Raw)</TableHead>
                            <TableHead className="font-semibold text-xs uppercase text-slate-500 text-right">Vol (Final)</TableHead>
                            <TableHead className="font-semibold text-xs uppercase text-slate-500 text-right">Total Price</TableHead>
                            <TableHead className="font-semibold text-xs uppercase text-slate-500">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedLogs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-12 text-slate-400">
                                    {search ? 'No logs match your search.' : 'No inventory data available.'}
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedLogs.map((log) => (
                                <TableRow key={log.id} className="hover:bg-slate-50/50">
                                    <TableCell className="font-mono font-bold text-slate-900">{log.tagId}</TableCell>
                                    <TableCell className="text-slate-600 text-sm">{formatDate(log.purchaseDate)}</TableCell>
                                    <TableCell className="text-sm">
                                        <span className="text-slate-900">{log.supplier.name}</span>
                                        <span className="text-slate-400 mx-1">•</span>
                                        <span className="text-slate-500">{log.woodType.name}</span>
                                    </TableCell>
                                    <TableCell className="font-mono text-sm text-slate-600">
                                        {log.circumference}cm × {log.length}cm
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-sm text-slate-400">
                                        {formatCurrency(log.volumeRaw)}
                                    </TableCell>
                                    <TableCell className="text-right font-mono font-bold text-slate-900">
                                        {log.volumeFinal}
                                    </TableCell>
                                    <TableCell className="text-right font-mono font-semibold text-green-600">
                                        Rp {formatCurrency(log.totalPurchasePrice)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={log.status === 'IN_STOCK' ? 'default' : 'secondary'}
                                            className={log.status === 'IN_STOCK'
                                                ? 'bg-blue-100 text-blue-700 hover:bg-blue-100 border-0'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-100 border-0'
                                            }
                                        >
                                            {log.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
                        <p className="text-sm text-slate-500">
                            Showing {currentPage * ITEMS_PER_PAGE + 1} to {Math.min((currentPage + 1) * ITEMS_PER_PAGE, filteredLogs.length)} of {filteredLogs.length}
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                                disabled={currentPage === 0}
                            >
                                Previous
                            </Button>
                            <span className="text-sm text-slate-600 px-2">
                                Page {currentPage + 1} of {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                                disabled={currentPage >= totalPages - 1}
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
