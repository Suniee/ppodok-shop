"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import {
    fetchCouponsPaged, createCoupon, updateCoupon, deleteCoupon,
} from "@/lib/supabase/coupons"
import type { Coupon, CouponInput } from "@/lib/supabase/coupon-utils"

export async function fetchCouponsPagedAction(
    page:     number,
    pageSize: number,
    query:    string,
): Promise<{ items: Coupon[]; total: number }> {
    return fetchCouponsPaged(page, pageSize, query)
}

export async function createCouponAction(input: CouponInput): Promise<{ ok: boolean; message?: string }> {
    try {
        await createCoupon(input)
        revalidatePath("/admin/coupons")
        return { ok: true }
    } catch (e) {
        return { ok: false, message: (e as Error).message }
    }
}

export async function updateCouponAction(id: string, input: Partial<CouponInput>): Promise<{ ok: boolean; message?: string }> {
    try {
        await updateCoupon(id, input)
        revalidatePath("/admin/coupons")
        return { ok: true }
    } catch (e) {
        return { ok: false, message: (e as Error).message }
    }
}

export async function deleteCouponAction(id: string): Promise<void> {
    await deleteCoupon(id)
    revalidatePath("/admin/coupons")
}

// 카테고리 전체 조회 (상품 쿠폰 편집 드로어용)
export type CategoryResult = {
    id:   number
    name: string
    icon: string
}

export async function fetchCategoriesForCouponAction(): Promise<CategoryResult[]> {
    const admin = createAdminClient()
    const { data } = await admin
        .from("categories")
        .select("id, name, icon")
        .eq("is_active", true)
        .order("sort_order")
    return (data ?? []).map((r) => ({
        id:   r.id   as number,
        name: r.name as string,
        icon: r.icon as string,
    }))
}

// 상품 검색 (상품 쿠폰 편집 드로어용)
export type ProductSearchResult = {
    id:    string
    name:  string
    price: number
    emoji: string
}

export async function searchProductsForCouponAction(query: string): Promise<ProductSearchResult[]> {
    const admin = createAdminClient()
    const q = query.trim()
    let qb = admin
        .from("products")
        .select("id, name, price, emoji")
        .eq("is_visible", true)
        .order("name")
        .limit(20)

    if (q) qb = qb.ilike("name", `%${q}%`)

    const { data } = await qb
    return (data ?? []).map((r) => ({
        id:    r.id    as string,
        name:  r.name  as string,
        price: r.price as number,
        emoji: r.emoji as string,
    }))
}

// 여러 상품 ID로 상품 정보 조회 (편집 시 기존 선택 상품 로드용)
export async function fetchProductsByIdsAction(ids: string[]): Promise<ProductSearchResult[]> {
    if (ids.length === 0) return []
    const admin = createAdminClient()
    const { data } = await admin
        .from("products")
        .select("id, name, price, emoji")
        .in("id", ids)
    return (data ?? []).map((r) => ({
        id:    r.id    as string,
        name:  r.name  as string,
        price: r.price as number,
        emoji: r.emoji as string,
    }))
}

