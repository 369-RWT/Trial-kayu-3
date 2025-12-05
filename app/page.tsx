import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function Home() {
    return (
        <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <Card className="max-w-md w-full">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">Al Fath Kayu</CardTitle>
                    <CardDescription>Timber Manufacturing System</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <Link href="/pembelian">
                        <Button className="w-full h-12 text-lg">
                            + New Purchase Entry
                        </Button>
                    </Link>
                    <Link href="/produksi">
                        <Button variant="outline" className="w-full h-12 text-lg border-amber-500 text-amber-600 hover:bg-amber-50">
                            🏭 Production Studio
                        </Button>
                    </Link>
                    <Link href="/inventory">
                        <Button variant="outline" className="w-full h-12 text-lg">
                            View Inventory
                        </Button>
                    </Link>
                    <div className="text-xs text-center text-slate-400 pt-2">
                        System Version 1.0.0
                    </div>
                </CardContent>
            </Card>
        </main>
    )
}
