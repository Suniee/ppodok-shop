import AdminSidebar from "@/components/admin/AdminSidebar"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { fetchAdminUsers } from "@/lib/supabase/admins"
import type { AdminUser, AdminRole } from "@/lib/supabase/admins"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    let currentUser: { id: string; email: string; name: string | null; adminRole: AdminRole } | null = null
    let admins: AdminUser[] = []

    if (user) {
        const adminClient = createAdminClient()
        const [{ data: profile }, adminList] = await Promise.all([
            adminClient.from("profiles").select("name, admin_role").eq("id", user.id).single(),
            fetchAdminUsers().catch(() => [] as AdminUser[]),
        ])
        currentUser = {
            id:        user.id,
            email:     user.email ?? "",
            name:      profile?.name ?? null,
            adminRole: (profile?.admin_role ?? 'general') as AdminRole,
        }
        admins = adminList
    }

    return (
        <div className="admin-mode flex h-screen overflow-hidden bg-white">
            <AdminSidebar currentUser={currentUser} admins={admins} />
            <div className="flex-1 overflow-auto" style={{ backgroundColor: "var(--toss-page-bg)" }}>
                {children}
            </div>
        </div>
    )
}
