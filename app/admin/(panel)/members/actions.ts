"use server"

import { revalidatePath } from "next/cache"
import { updateMemberStatus, updateMemberGrade, approveMember, rejectMember } from "@/lib/supabase/members"
import type { MemberStatus, MemberGrade, AdminMember } from "@/lib/supabase/members"
import { createAdminClient } from "@/lib/supabase/admin"

export type WithdrawnMember = {
    id:          string
    email:       string
    withdrawnAt: string
}

export type MemberCounts = {
    all:       number
    active:    number
    inactive:  number
    suspended: number
    pending:   number   // 이메일 미인증 (status = 'pending')
    withdrawn: number   // 탈퇴 (withdrawn_profiles 테이블)
}

export type MemberTabFilter = "all" | "active" | "inactive" | "suspended" | "pending" | "withdrawn"

export async function fetchMembersPagedAction(
    page:      number,
    pageSize:  number,
    status:    MemberTabFilter,
    dateStart: string | null,
    dateEnd:   string | null,
    query:     string,
): Promise<{ items: AdminMember[]; withdrawnItems: WithdrawnMember[]; total: number; counts: MemberCounts }> {
    const admin = createAdminClient()
    const from = (page - 1) * pageSize
    const to   = from + pageSize - 1
    const q    = query.trim()

    const emptyResult = {
        items: [], withdrawnItems: [], total: 0,
        counts: { all: 0, active: 0, inactive: 0, suspended: 0, pending: 0, withdrawn: 0 },
    }

    // 탭 카운트 집계 (항상 실행)
    const [statusCountResult, { count: pendingCount }, { count: withdrawnCount }] = await Promise.all([
        admin.from("customer_profiles").select("status").neq("status", "pending"),
        admin.from("customer_profiles").select("id", { count: "exact", head: true }).eq("status", "pending"),
        admin.from("withdrawn_profiles").select("id", { count: "exact", head: true }),
    ])

    const counts: MemberCounts = {
        all: 0, active: 0, inactive: 0, suspended: 0,
        pending:   pendingCount   ?? 0,
        withdrawn: withdrawnCount ?? 0,
    }
    for (const r of statusCountResult.data ?? []) {
        counts.all++
        if (r.status === "active")    counts.active++
        if (r.status === "inactive")  counts.inactive++
        if (r.status === "suspended") counts.suspended++
    }

    // ── 탈퇴 회원 탭 ─────────────────────────────────────────────
    if (status === "withdrawn") {
        let wq = admin
            .from("withdrawn_profiles")
            .select("id, email, withdrawn_at", { count: "exact" })
            .order("withdrawn_at", { ascending: false })
            .range(from, to)
        if (q) wq = wq.ilike("email", `%${q}%`)

        const { data, count, error } = await wq
        if (error || !data) return emptyResult

        return {
            items: [],
            withdrawnItems: data.map((r) => ({
                id:          r.id           as string,
                email:       r.email        as string,
                withdrawnAt: r.withdrawn_at as string,
            })),
            total:  count ?? 0,
            counts,
        }
    }

    // ── customer_profiles 기반 탭 (all / active / inactive / suspended / pending) ──
    let profilesQ = admin
        .from("customer_profiles")
        .select("id, email, name, phone, status, grade, created_at", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to)

    if (status === "pending") {
        profilesQ = profilesQ.eq("status", "pending")
    } else {
        profilesQ = profilesQ.neq("status", "pending")
        if (status !== "all") profilesQ = profilesQ.eq("status", status)
    }

    if (dateStart) profilesQ = profilesQ.gte("created_at", `${dateStart}T00:00:00+09:00`)
    if (dateEnd)   profilesQ = profilesQ.lte("created_at", `${dateEnd}T23:59:59+09:00`)
    if (q)         profilesQ = profilesQ.or(`name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`)

    const { data: profiles, count, error } = await profilesQ
    if (error || !profiles) return emptyResult

    const ids = (profiles as { id: string }[]).map((p) => p.id)
    const { data: orderRows } = ids.length > 0
        ? await admin.from("orders").select("user_id, total_price").in("user_id", ids).eq("status", "delivered")
        : { data: [] }

    const statsMap = new Map<string, { count: number; total: number }>()
    for (const o of orderRows ?? []) {
        const s = statsMap.get(o.user_id) ?? { count: 0, total: 0 }
        statsMap.set(o.user_id, { count: s.count + 1, total: s.total + (o.total_price ?? 0) })
    }

    const items: AdminMember[] = (profiles as Record<string, unknown>[]).map((p) => {
        const s = statsMap.get(p.id as string) ?? { count: 0, total: 0 }
        return {
            id:         p.id         as string,
            email:      p.email      as string,
            name:       p.name       as string | null,
            phone:      p.phone      as string | null,
            status:     p.status     as MemberStatus,
            grade:      (p.grade ?? "일반") as MemberGrade,
            createdAt:  p.created_at as string,
            orderCount: s.count,
            totalSpent: s.total,
        }
    })

    return { items, withdrawnItems: [], total: count ?? 0, counts }
}

export async function updateMemberStatusAction(id: string, status: MemberStatus): Promise<void> {
    await updateMemberStatus(id, status)
    revalidatePath("/admin/members")
}

export async function updateMemberGradeAction(id: string, grade: MemberGrade): Promise<void> {
    await updateMemberGrade(id, grade)
    revalidatePath("/admin/members")
}

export async function approveMemberAction(id: string): Promise<{ ok: boolean; message?: string }> {
    try {
        await approveMember(id)
        revalidatePath("/admin/members")
        return { ok: true }
    } catch {
        return { ok: false, message: "승인 처리 중 오류가 발생했습니다." }
    }
}

export async function rejectMemberAction(id: string): Promise<{ ok: boolean; message?: string }> {
    try {
        await rejectMember(id)
        revalidatePath("/admin/members")
        return { ok: true }
    } catch {
        return { ok: false, message: "거절 처리 중 오류가 발생했습니다." }
    }
}

// 탈퇴 회원 기록을 withdrawn_profiles 테이블에서 완전히 삭제
export async function permanentDeleteWithdrawnMemberAction(id: string): Promise<{ ok: boolean; message?: string }> {
    try {
        const admin = createAdminClient()
        const { error } = await admin
            .from("withdrawn_profiles")
            .delete()
            .eq("id", id)
        if (error) throw error
        revalidatePath("/admin/members")
        return { ok: true }
    } catch {
        return { ok: false, message: "영구 삭제 처리 중 오류가 발생했습니다." }
    }
}
