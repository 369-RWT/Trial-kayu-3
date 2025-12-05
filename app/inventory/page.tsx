import { getInventory } from '@/app/actions'
import InventoryTable from './inventory-table'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function InventoryPage() {
    const { logs, kpis } = await getInventory()

    return (
        <main className="min-h-screen bg-slate-100">
            {/* Header */}
            <header className="bg-slate-900 text-white py-4 px-6 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h1 className="text-lg font-bold tracking-tight">AL FATH KAYU</h1>
                        <span className="text-slate-500">|</span>
                        <span className="text-sm text-slate-400">Inventory Dashboard</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/pembelian">
                            <Button variant="outline" size="sm" className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
                                + New Log
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto py-6 px-6">
                <InventoryTable initialLogs={logs} kpis={kpis} />
            </div>

            {/* Footer */}
            <footer className="border-t border-slate-200 bg-white py-4 mt-8">
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-xs text-slate-400">
                    <span>© 2025 Al Fath Kayu • Timber Manufacturing System</span>
                    <span className="font-mono">v1.0.0</span>
                </div>
            </footer>
        </main>
    )
}
