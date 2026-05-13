import { createAdminClient } from "./admin"
import type { MemberStatus } from "./members"

// 수퍼관리자 식별 이메일 (고정값)
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
    isSuperAdmin: boolean  // adminRole === 'super' 의 편의 필드
}

export type PendingUser = {
    id:        string
    email:     string
    name:      string | null
    phone:     string | null
    createdAt: string
}

export async function fetchAdminUsers(): Promise<AdminUser[]> {
    const admin = createAdminClient()
    const { data, error } = await admin
        .from("profiles")
        .select("id, email, name, phone, status, admin_role, created_at")
        .eq("role", "admin")
        .order("created_at", { ascending: true }) // 수퍼관리자(최초생성)가 상단
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

export async function fetchPendingUsers(): Promise<PendingUser[]> {
    const admin = createAdminClient()
    const { data, error } = await admin
        .from("profiles")
        .select("id, email, name, phone, created_at")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
    if (error || !data) return []
    return data.map((p) => ({
        id:        p.id,
        email:     p.email,
        name:      p.name,
        phone:     p.phone,
        createdAt: p.created_at,
    }))
}

export async function updateAdminStatus(id: string, status: "active" | "inactive"): Promise<void> {
    const admin = createAdminClient()
    await admin.from("profiles").update({ status }).eq("id", id)
}

// 관리자 → 일반회원 권한 강등
export async function demoteToCustomer(id: string): Promise<void> {
    const admin = createAdminClient()
    await admin.from("profiles").update({ role: "customer" }).eq("id", id)
}

// 관리자 프로필(이름·전화번호·등급) 수정 — 수퍼관리자 포함 허용
export async function updateAdminProfile(
    id: string,
    data: { name: string | null; phone: string | null; adminRole: AdminRole }
): Promise<void> {
    const admin = createAdminClient()
    await admin.from("profiles")
        .update({ name: data.name, phone: data.phone, admin_role: data.adminRole })
        .eq("id", id)
}
