import { getProductInventory } from '@/app/actions'
import WarehouseClient from './warehouse-client'

export default async function WarehousePage() {
    const { products, kpis } = await getProductInventory()

    return <WarehouseClient products={products} kpis={kpis} />
}
