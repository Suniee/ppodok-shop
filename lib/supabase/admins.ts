import { createAdminClient } from "./admin"
import type { MemberStatus } from "./members"

export const SUPER_ADMIN_EMAIL = "super@ppodok.kr"

export type AdminRole = 'super' | 'general'

export type AdminUser = {
    id:           string
    email:        string
    name:         string | null
    phone:        string | null
    status:       MemberStatus
    createdAt:    string
    adminRole:    AdminRole
    isSuperAdmin: boolean
}

export async function fetchAdminUsers(): Promise<AdminUser[]> {
    const admin = createAdminClient()
    const { data, error } = await admin
        .from("admin_profiles")
        .select("id, email, name, phone, status, admin_role, created_at")
        .order("created_at", { ascending: true })
    if (error || !data) return []
    return data.map((p) => ({
        id:           p.id,
        email:        p.email,
        name:         p.name,
        phone:        p.phone,
        status:       p.status as MemberStatus,
        createdAt:    p.created_at,
        adminRole:    (p.admin_role ?? 'general') as AdminRole,
        isSuperAdmin: (p.admin_role ?? 'general') === 'super',
    }))
}

export async function updateAdminStatus(id: string, status: "active" | "inactive"): Promise<void> {
    const admin = createAdminClient()
    await admin.from("admin_profiles").update({ status }).eq("id", id)
}

export async function updateAdminProfile(
    id: string,
    data: { name: string | null; phone: string | null; adminRole: AdminRole }
): Promise<void> {
    const admin = createAdminClient()
    await admin.from("admin_profiles")
        .update({ name: data.name, phone: data.phone, admin_role: data.adminRole })
        .eq("id", id)
}
