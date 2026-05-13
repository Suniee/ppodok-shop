import AdminSidebar from "@/components/admin/AdminSidebar"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { fetchAdminUsers } from "@/lib/supabase/admins"
import { fetchMenuConfig } from "@/lib/supabase/menu"
import type { AdminUser, AdminRole } from "@/lib/supabase/admins"
import type { MenuConfig } from "@/lib/admin-menu"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    let currentUser: { id: string; email: string; name: string | null; adminRole: AdminRole } | null = null
    let admins: AdminUser[] = []
    let menuConfig: MenuConfig[] = []

    if (user) {
        const adminClient = createAdminClient()
        const [{ data: profile }, adminList, menuCfg] = await Promise.all([
            adminClient.from("profiles").select("name, admin_role").eq("id", user.id).single(),
            fetchAdminUsers().catch(() => [] as AdminUser[]),
            fetchMenuConfig().catch(() => [] as MenuConfig[]),
        ])
        currentUser = {
            id:        user.id,
            email:     user.email ?? "",
            name:      profile?.name ?? null,
            adminRole: (profile?.admin_role ?? 'general') as AdminRole,
        }
        admins     = adminList
        menuConfig = menuCfg
    }

    return (
        <div className="admin-mode flex h-screen overflow-hidden bg-white">
            <AdminSidebar currentUser={currentUser} admins={admins} menuConfig={menuConfig} />
            <div className="flex-1 overflow-auto" style={{ backgroundColor: "var(--toss-page-bg)" }}>
                {children}
            </div>
        </div>
    )
}
