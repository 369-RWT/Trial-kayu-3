import { getInStockLogs, getProducts } from '@/app/actions'
import ProductionForm from './production-form'

// Force dynamic because inventory changes frequently
export const dynamic = 'force-dynamic'

export default async function ProductionPage() {
    // 1. Fetch Fresh Data
    const availableLogs = await getInStockLogs()
    const productTypes = await getProducts()

    // 2. Render Client Form
    return (
        <ProductionForm
            availableLogs={availableLogs}
            productTypes={productTypes}
        />
    )
}
