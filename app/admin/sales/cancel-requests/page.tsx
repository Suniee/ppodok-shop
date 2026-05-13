import { Suspense } from "react"
import { fetchAllCancelRequestsForAdmin } from "@/lib/supabase/cancelRequests"
import CancelRequestsClient from "./CancelRequestsClient"

export default async function CancelRequestsPage() {
    const requests = await fetchAllCancelRequestsForAdmin()

    return (
        <Suspense>
            <CancelRequestsClient requests={requests} />
        </Suspense>
    )
}
