import { getMasterData } from '@/app/actions'
import PurchaseForm from './purchase-form'

export default async function PurchasePage() {
    const { suppliers, woodTypes } = await getMasterData()

    return (
        <main className="min-h-screen bg-slate-50/50 py-12">
            <div className="container mx-auto">
                <div className="mb-8 text-center space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Purchase Input</h1>
                    <p className="text-slate-500">Record incoming raw material logs with precision.</p>
                </div>

                <PurchaseForm suppliers={suppliers} woodTypes={woodTypes} />
            </div>
        </main>
    )
}
