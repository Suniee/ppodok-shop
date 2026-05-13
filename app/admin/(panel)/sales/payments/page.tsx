import { fetchAllPaymentsForAdmin } from "@/lib/supabase/payments"
import PaymentsClient from "./PaymentsClient"

export default async function PaymentsPage() {
    const payments = await fetchAllPaymentsForAdmin()

    return <PaymentsClient payments={payments} />
}
