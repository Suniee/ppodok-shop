import { redirect } from "next/navigation"
import { Suspense } from "react"
import AdminsClient from "./AdminsClient"
import { fetchAdminUsers, fetchPendingUsers } from "@/lib/supabase/admins"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export default async function AdminsPage() {
    // 수퍼관리자만 접근 허용 — 직접 URL 입력 방어
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect("/admin/login")

    const adminClient = createAdminClient()
    const { data: profile } = await adminClient
        .from("profiles")
        .select("admin_role")
        .eq("id", user.id)
        .maybeSingle()

    if (profile?.admin_role !== 'super') {
        redirect("/admin/dashboard")
    }

    const [admins, pending] = await Promise.all([
        fetchAdminUsers().catch(() => []),
        fetchPendingUsers().catch(() => []),
    ])

    return (
        <div data-ui-id="page-admin-admins">
            <Suspense>
                <AdminsClient admins={admins} pending={pending} />
            </Suspense>
        </div>
    )
}
