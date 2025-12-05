'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
    { name: 'Purchase', href: '/pembelian' },
    { name: 'Inventory', href: '/inventory' },
    { name: 'Production', href: '/produksi' },
    { name: 'Warehouse', href: '/gudang' },
]

export default function GlobalHeader() {
    const pathname = usePathname()

    const getPageTitle = (path: string) => {
        switch (path) {
            case '/pembelian': return 'Purchase Input'
            case '/inventory': return 'Raw Inventory'
            case '/produksi': return 'Production Studio'
            case '/gudang': return 'Finished Goods'
            case '/': return 'Home'
            default: return ''
        }
    }

    return (
        <header className="h-16 bg-slate-900 text-white flex items-center px-6 justify-between sticky top-0 z-50 shadow-md">
            <div className="flex items-center gap-4">
                <Link href="/" className="font-bold text-lg tracking-tight hover:text-emerald-400 transition-colors">
                    AL FATH KAYU
                </Link>
                <div className="h-6 w-px bg-slate-700 mx-2 hidden md:block" />
                <span className="text-slate-400 text-sm font-medium hidden md:block uppercase tracking-wide">
                    {getPageTitle(pathname)}
                </span>
            </div>

            <nav className="flex items-center gap-1 md:gap-6">
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "text-sm font-medium transition-colors hover:text-white px-3 py-2 rounded-md",
                                isActive
                                    ? "text-white bg-slate-800"
                                    : "text-slate-400"
                            )}
                        >
                            {item.name}
                        </Link>
                    )
                })}
            </nav>
        </header>
    )
}
