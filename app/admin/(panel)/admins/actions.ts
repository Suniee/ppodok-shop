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
