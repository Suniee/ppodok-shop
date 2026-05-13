import { Suspense } from "react"
import MembersClient from "./MembersClient"
import { fetchAllMembersForAdmin } from "@/lib/supabase/members"

export default async function MembersPage() {
    const members = await fetchAllMembersForAdmin().catch(() => [])
    return (
        <Suspense>
            <MembersClient members={members} />
        </Suspense>
    )
}
