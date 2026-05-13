import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import AdminLoginForm from "./AdminLoginForm"

export default async function AdminLoginPage() {
    // 이미 로그인된 관리자는 대시보드로 바로 이동
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
        const adminClient = createAdminClient()
        const { data: profile } = await adminClient
            .from("profiles")
            .select("role, status")
            .eq("id", user.id)
            .maybeSingle()

        if (profile?.role === "admin" && profile?.status === "active") {
            redirect("/admin/dashboard")
        }
    }

    return <AdminLoginForm />
}
