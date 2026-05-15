"use server"

import { revalidatePath } from "next/cache"
import { updateMemberStatus, updateMemberGrade, approveMember, rejectMember } from "@/lib/supabase/members"
import type { MemberStatus, MemberGrade, MemberRole, AdminMember } from "@/lib/supabase/members"
import { createAdminClient } from "@/lib/supabase/admin"

export type MemberCounts = { all: number; active: number; inactive: number; suspended: number }

export async function fetchMembersPagedAction(
    page: number,
    pageSize: number,
    status: "all" | "active" | "inactive" | "suspended",
    dateStart: string | null,
    dateEnd: string | null,
    query: string,
): Promise<{ items: AdminMember[]; total: number; counts: MemberCounts }> {
    const admin = createAdminClient()
    const from = (page - 1) * pageSize
    const to   = from + pageSize - 1
    const q    = query.trim()

    const empty = { items: [], total: 0, counts: { all: 0, active: 0, inactive: 0, suspended: 0 } }

    // 페이지 프로필 쿼리
    let profilesQ = admin
        .from("profiles")
        .select("id, email, name, phone, role, status, grade, created_at", { count: "exact" })
        .eq("role", "customer")
        .neq("status", "pending")
        .order("created_at", { ascending: false })
        .range(from, to)

    if (status !== "all") profilesQ = profilesQ.eq("status", status)
    if (dateStart) profilesQ = profilesQ.gte("created_at", `${dateStart}T00:00:00+09:00`)
    if (dateEnd)   profilesQ = profilesQ.lte("created_at", `${dateEnd}T23:59:59+09:00`)
    if (q)         profilesQ = profilesQ.or(`name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`)

    const { data: profiles, count, error } = await profilesQ
    if (error || !profiles) return empty

    // 현재 페이지 ID에 대한 주문 통계만 조회
    const ids = (profiles as { id: string }[]).map((p) => p.id)
    const { data: orderRows } = ids.length > 0
        ? await admin
            .from("orders")
            .select("user_id, total_price")
            .in("user_id", ids)
            .eq("status", "delivered")
        : { data: [] }

    const statsMap = new Map<string, { count: number; total: number }>()
    for (const o of orderRows ?? []) {
        const s = statsMap.get(o.user_id) ?? { count: 0, total: 0 }
        statsMap.set(o.user_id, { count: s.count + 1, total: s.total + (o.total_price ?? 0) })
    }

    // 전체 상태별 카운트 (요약 카드용 — 날짜/검색 필터 미적용)
    const { data: countRows } = await admin
        .from("profiles")
        .select("status")
        .eq("role", "customer")
        .neq("status", "pending")

    const counts: MemberCounts = { all: 0, active: 0, inactive: 0, suspended: 0 }
    for (const r of countRows ?? []) {
        counts.all++
        if (r.status === "active")    counts.active++
        if (r.status === "inactive")  counts.inactive++
        if (r.status === "suspended") counts.suspended++
    }

    const items: AdminMember[] = (profiles as Record<string, unknown>[]).map((p) => {
        const s = statsMap.get(p.id as string) ?? { count: 0, total: 0 }
        return {
            id:         p.id as string,
            email:      p.email as string,
            name:       p.name as string | null,
            phone:      p.phone as string | null,
            role:       p.role as MemberRole,
            status:     p.status as MemberStatus,
            grade:      p.grade as MemberGrade,
            createdAt:  p.created_at as string,
            orderCount: s.count,
            totalSpent: s.total,
        }
    })

    return { items, total: count ?? 0, counts }
}

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
