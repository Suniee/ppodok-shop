import SalesClient from "./SalesClient"
import { fetchAllOrdersForAdmin } from "@/lib/supabase/orders"
import { fetchAllDonePaymentsTotal } from "@/lib/supabase/payments"

export default async function SalesPage() {
    const [orders, donePayments] = await Promise.all([
        fetchAllOrdersForAdmin().catch(() => []),
        fetchAllDonePaymentsTotal(),
    ])
    return (
        <SalesClient
            orders={orders}
            totalRevenue={donePayments.total}
            totalRevenueCount={donePayments.count}
        />
    )
}
