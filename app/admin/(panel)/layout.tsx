import { redirect } from "next/navigation"
import AdminSidebar from "@/components/admin/AdminSidebar"
import { createSupabaseServerClient, ADMIN_STORAGE_KEY } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { fetchAdminUsers } from "@/lib/supabase/admins"
import { fetchMenuConfig } from "@/lib/supabase/menu"
import type { AdminUser, AdminRole } from "@/lib/supabase/admins"
import type { MenuConfig } from "@/lib/admin-menu"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createSupabaseServerClient(ADMIN_STORAGE_KEY)
    const { data: { user } } = await supabase.auth.getUser()

    // 비로그인 상태면 로그인 페이지로
    if (!user) {
        redirect("/admin/login")
    }

    const adminClient = createAdminClient()
    const [{ data: profile }, adminList, menuCfg] = await Promise.all([
        adminClient.from("profiles").select("name, admin_role, role, status").eq("id", user.id).single(),
        fetchAdminUsers().catch(() => [] as AdminUser[]),
        fetchMenuConfig().catch(() => [] as MenuConfig[]),
    ])

    // 관리자 권한이 없으면 로그인 페이지로
    if (!profile || profile.role !== "admin" || profile.status !== "active") {
        redirect("/admin/login")
    }

    const currentUser: { id: string; email: string; name: string | null; adminRole: AdminRole } = {
        id:        user.id,
        email:     user.email ?? "",
        name:      profile.name ?? null,
        adminRole: (profile.admin_role ?? "general") as AdminRole,
    }
    const admins: AdminUser[]     = adminList
    const menuConfig: MenuConfig[] = menuCfg

    return (
        <div className="admin-mode flex h-screen overflow-hidden bg-white">
            <AdminSidebar currentUser={currentUser} admins={admins} menuConfig={menuConfig} />
            <div className="flex-1 overflow-auto" style={{ backgroundColor: "var(--toss-page-bg)" }}>
                {children}
            </div>
        </div>
    )
}
