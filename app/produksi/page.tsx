import { getAvailableLogs, getProductTypes } from '@/app/actions'
import ProductionForm from './production-form'

export default async function ProductionPage() {
    const [logs, products] = await Promise.all([
        getAvailableLogs(),
        getProductTypes()
    ])

    return <ProductionForm availableLogs={logs} productTypes={products} />
}
