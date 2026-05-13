"use server"

import { revalidatePath } from "next/cache"
import { updateMemberStatus, updateMemberGrade, approveMember, rejectMember } from "@/lib/supabase/members"
import type { MemberStatus, MemberGrade, MemberRole } from "@/lib/supabase/members"

export async function updateMemberStatusAction(id: string, status: MemberStatus): Promise<void> {
    await updateMemberStatus(id, status)
    revalidatePath("/admin/members")
}

export async function updateMemberGradeAction(id: string, grade: MemberGrade): Promise<void> {
    await updateMemberGrade(id, grade)
    revalidatePath("/admin/members")
}

export async function approveMemberAction(id: string, role: MemberRole): Promise<{ ok: boolean; message?: string }> {
    try {
        await approveMember(id, role)
        revalidatePath("/admin/members")
        return { ok: true }
    } catch (e) {
        return { ok: false, message: "승인 처리 중 오류가 발생했습니다." }
    }
}

export async function rejectMemberAction(id: string): Promise<{ ok: boolean; message?: string }> {
    try {
        await rejectMember(id)
        revalidatePath("/admin/members")
        return { ok: true }
    } catch (e) {
        return { ok: false, message: "거절 처리 중 오류가 발생했습니다." }
    }
}
