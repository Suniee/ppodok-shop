"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import {
    fetchCouponsPaged,
    issueCouponToUser,
    fetchCouponIssuancesPaged,
} from "@/lib/supabase/coupons"
import type { Coupon, CouponIssuance } from "@/lib/supabase/coupon-utils"

export async function fetchCouponsPagedAction(
    page:     number,
    pageSize: number,
    query:    string,
): Promise<{ items: Coupon[]; total: number }> {
    return fetchCouponsPaged(page, pageSize, query)
}

export async function fetchCouponIssuancesPagedAction(
    couponId: string,
    page:     number,
    pageSize: number,
): Promise<{ items: CouponIssuance[]; total: number }> {
    return fetchCouponIssuancesPaged(couponId, page, pageSize)
}

export async function issueCouponAction(
    couponId: string,
    userId:   string,
): Promise<{ ok: boolean; message?: string }> {
    const result = await issueCouponToUser(couponId, userId)
    if (result.ok) revalidatePath("/admin/coupon-issuance")
    return result
}

// 회원 검색 (쿠폰 발급 모달용)
export type MemberSearchResult = {
    id:    string
    name:  string | null
    email: string
    phone: string | null
}

export async function searchMembersForCouponAction(query: string): Promise<MemberSearchResult[]> {
    if (!query.trim()) return []
    const admin = createAdminClient()
    const q = query.trim()
    const { data } = await admin
        .from("customer_profiles")
        .select("id, name, email, phone")
        .eq("status", "active")
        .or(`name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`)
        .limit(10)

    return (data ?? []).map((r) => ({
        id:    r.id    as string,
        name:  r.name  as string | null,
        email: r.email as string,
        phone: r.phone as string | null,
    }))
}
