import { createAdminClient } from "./admin"
import type { AdminRole } from "./admins"

export type MemberStatus = "pending" | "active" | "inactive" | "suspended"
export type MemberGrade  = "일반" | "실버" | "골드" | "VIP"
export type MemberRole   = "customer" | "admin"

export type AdminMember = {
    id:          string
    email:       string
    name:        string | null
    phone:       string | null
    role:        MemberRole
    status:      MemberStatus
    grade:       MemberGrade
    createdAt:   string
    orderCount:  number
    totalSpent:  number
}

export async function fetchAllMembersForAdmin(): Promise<AdminMember[]> {
    const admin = createAdminClient()

    const [{ data: profiles, error }, { data: orderRows }] = await Promise.all([
        admin
            .from("profiles")
            .select("id, email, name, phone, role, status, grade, created_at")
            .eq("role", "customer")   // admin 계정 제외
            .order("created_at", { ascending: false }),
        admin
            .from("orders")
            .select("user_id, total_price")
            .not("user_id", "is", null)
            .neq("status", "cancelled"),
    ])

    if (error || !profiles) return []

    // user_id별 주문 집계
    const statsMap = new Map<string, { count: number; total: number }>()
    for (const o of orderRows ?? []) {
        if (!o.user_id) continue
        const s = statsMap.get(o.user_id) ?? { count: 0, total: 0 }
        statsMap.set(o.user_id, { count: s.count + 1, total: s.total + (o.total_price ?? 0) })
    }

    return profiles.map((p) => {
        const stats = statsMap.get(p.id) ?? { count: 0, total: 0 }
        return {
            id:         p.id,
            email:      p.email,
            name:       p.name,
            phone:      p.phone,
            role:       p.role as MemberRole,
            status:     p.status as MemberStatus,
            grade:      p.grade as MemberGrade,
            createdAt:  p.created_at,
            orderCount: stats.count,
            totalSpent: stats.total,
        }
    })
}

export async function updateMemberStatus(id: string, status: MemberStatus): Promise<void> {
    const admin = createAdminClient()
    await admin.from("profiles").update({ status }).eq("id", id)
}

export async function updateMemberGrade(id: string, grade: MemberGrade): Promise<void> {
    const admin = createAdminClient()
    await admin.from("profiles").update({ grade }).eq("id", id)
}

// 회원 가입 신청 승인: role='customer'로 활성화
export async function approveMember(id: string, role: MemberRole): Promise<void> {
    const admin = createAdminClient()
    await admin.from("profiles").update({ status: "active", role }).eq("id", id)
}

// 관리자 가입 신청 승인: role='admin' 고정, admin_role로 등급 지정
export async function approveAdminMember(id: string, adminRole: AdminRole): Promise<void> {
    const admin = createAdminClient()
    await admin.from("profiles")
        .update({ status: "active", role: "admin", admin_role: adminRole })
        .eq("id", id)
}

// 가입 신청 거절: auth.users 삭제 → profiles CASCADE 삭제
export async function rejectMember(id: string): Promise<void> {
    const admin = createAdminClient()
    await admin.auth.admin.deleteUser(id)
}
