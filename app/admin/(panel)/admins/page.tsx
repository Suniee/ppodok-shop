import { redirect } from "next/navigation"
import { Suspense } from "react"
import AdminsClient from "./AdminsClient"
import { fetchPendingUsers } from "@/lib/supabase/admins"
import { createSupabaseServerClient, ADMIN_STORAGE_KEY } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export default async function AdminsPage() {
    // 수퍼관리자만 접근 허용 — 직접 URL 입력 방어
    const supabase = await createSupabaseServerClient(ADMIN_STORAGE_KEY)
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

    const pending = await fetchPendingUsers().catch(() => [])

    return (
        <div data-ui-id="page-admin-admins">
            <Suspense>
                <AdminsClient pending={pending} />
            </Suspense>
        </div>
    )
}
