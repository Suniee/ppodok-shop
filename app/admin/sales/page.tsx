import SalesClient from "./SalesClient"
import { fetchAllOrdersForAdmin } from "@/lib/supabase/orders"

export default async function SalesPage() {
    const orders = await fetchAllOrdersForAdmin().catch(() => [])
    return <SalesClient orders={orders} />
}
