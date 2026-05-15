import { Suspense } from "react"
import CancelRequestsClient from "./CancelRequestsClient"

export default function CancelRequestsPage() {
    return (
        <Suspense>
            <CancelRequestsClient />
        </Suspense>
    )
}
