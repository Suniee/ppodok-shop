import { Suspense } from "react"
import SalesClient from "./SalesClient"
import { fetchAllDonePaymentsTotal } from "@/lib/supabase/payments"

export default async function SalesPage() {
    const donePayments = await fetchAllDonePaymentsTotal()
    return (
        <Suspense>
            <SalesClient
                totalRevenue={donePayments.total}
                totalRevenueCount={donePayments.count}
            />
        </Suspense>
    )
}
