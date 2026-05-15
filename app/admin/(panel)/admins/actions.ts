"use server"

import { revalidatePath } from "next/cache"
import { updateAdminStatus, demoteToCustomer, updateAdminProfile, SUPER_ADMIN_EMAIL } from "@/lib/supabase/admins"
import type { AdminRole } from "@/lib/supabase/admins"
import { approveAdminMember, rejectMember } from "@/lib/supabase/members"
import { createAdminClient } from "@/lib/supabase/admin"

function revalidate() {
    revalidatePath("/admin/admins")
    revalidatePath("/admin/members")
}

export async function approveUserAction(
    id: string,
    adminRole: AdminRole
): Promise<{ ok: boolean; message?: string }> {
    try {
        await approveAdminMember(id, adminRole)
        revalidate()
        return { ok: true }
    } catch {
        return { ok: false, message: "승인 처리 중 오류가 발생했습니다." }
    }
}

export async function rejectUserAction(
    id: string
): Promise<{ ok: boolean; message?: string }> {
    try {
        await rejectMember(id)
        revalidate()
        return { ok: true }
    } catch {
        return { ok: false, message: "거절 처리 중 오류가 발생했습니다." }
    }
}

export async function toggleAdminStatusAction(
    id: string,
    email: string,
    currentStatus: string
): Promise<{ ok: boolean; message?: string }> {
    // 수퍼관리자는 상태 변경 불가
    if (email === SUPER_ADMIN_EMAIL) {
        return { ok: false, message: "수퍼관리자 계정은 변경할 수 없습니다." }
    }
    try {
        const next = currentStatus === "active" ? "inactive" : "active"
        await updateAdminStatus(id, next)
        revalidatePath("/admin/admins")
        return { ok: true }
    } catch {
        return { ok: false, message: "처리 중 오류가 발생했습니다." }
    }
}

export async function demoteAdminAction(
    id: string,
    email: string
): Promise<{ ok: boolean; message?: string }> {
    if (email === SUPER_ADMIN_EMAIL) {
        return { ok: false, message: "수퍼관리자 계정은 변경할 수 없습니다." }
    }
    try {
        await demoteToCustomer(id)
        revalidate()
        return { ok: true }
    } catch {
        return { ok: false, message: "처리 중 오류가 발생했습니다." }
    }
}

import type { AdminUser } from "@/lib/supabase/admins"

export async function fetchAdminUsersPagedAction(
    page: number,
    pageSize: number,
    roleFilter: "all" | "super" | "general",
    query: string,
): Promise<{ items: AdminUser[]; total: number }> {
    const admin = createAdminClient()
    const from  = (page - 1) * pageSize
    const to    = from + pageSize - 1
    const q     = query.trim()

    let builder = admin
        .from("profiles")
        .select("id, email, name, phone, status, admin_role, created_at", { count: "exact" })
        .eq("role", "admin")
        .order("created_at", { ascending: true })
        .range(from, to)

    if (roleFilter !== "all") builder = builder.eq("admin_role", roleFilter)
    if (q) builder = builder.or(`name.ilike.%${q}%,email.ilike.%${q}%`)

    const { data, count, error } = await builder
    if (error || !data) return { items: [], total: 0 }

    const items: AdminUser[] = (data as Record<string, unknown>[]).map((p) => ({
        id:           p.id as string,
        email:        p.email as string,
        name:         p.name as string | null,
        phone:        p.phone as string | null,
        status:       p.status as AdminUser["status"],
        createdAt:    p.created_at as string,
        adminRole:    ((p.admin_role ?? "general") as AdminUser["adminRole"]),
        isSuperAdmin: (p.admin_role ?? "general") === "super",
    }))

    return { items, total: count ?? 0 }
}

// 이름·전화번호·등급 수정 — 수퍼관리자 포함 모든 관리자 허용
export async function updateAdminProfileAction(
    id: string,
    data: { name: string; phone: string; adminRole: AdminRole }
): Promise<{ ok: boolean; message?: string }> {
    try {
        await updateAdminProfile(id, {
            name:      data.name.trim()  || null,
            phone:     data.phone.trim() || null,
            adminRole: data.adminRole,
        })
        revalidatePath("/admin/admins")
        return { ok: true }
    } catch {
        return { ok: false, message: "수정 중 오류가 발생했습니다." }
    }
}
