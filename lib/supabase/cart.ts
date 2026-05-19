"use server"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { CartItem } from "@/lib/store/CartContext"
import type { Product } from "@/lib/data/products"

type ProductRow = {
    id: string   // products.id는 text 타입
    name: string
    price: number
    original_price: number | null
    emoji: string
    bg_color: string
    is_new: boolean | null
    is_best: boolean | null
    badge: string | null
    is_visible: boolean | null
    images: string[] | null
    detail_images: string[] | null
    description: string | null
    product_categories: {
        categories: { id: number; name: string; slug: string; icon: string } | null
    }[]
}

function mapDbProduct(p: ProductRow): Product {
    return {
        id:            p.id,
        name:          p.name,
        price:         p.price,
        originalPrice: p.original_price ?? undefined,
        emoji:         p.emoji,
        bgColor:       p.bg_color,
        isNew:         p.is_new  ?? undefined,
        isBest:        p.is_best ?? undefined,
        badge:         p.badge   ?? undefined,
        isVisible:     p.is_visible ?? undefined,
        images:        p.images       ?? undefined,
        detailImages:  p.detail_images ?? undefined,
        description:   p.description  ?? undefined,
        categories:    (p.product_categories ?? [])
            .map((pc) => pc.categories)
            .filter((c): c is NonNullable<typeof c> => c != null),
    }
}

// 로그인 사용자의 장바구니를 products 정보와 함께 조회
export async function fetchCartAction(): Promise<CartItem[]> {
    const supabase = await createSupabaseServerClient()
    const { data } = await supabase
        .from("carts")
        .select("quantity, products(*, product_categories(categories(*)))")
        .order("created_at")

    if (!data) return []

    return data
        .filter((row) => row.products != null)
        .map((row) => ({
            product:  mapDbProduct(row.products as unknown as ProductRow),
            quantity: row.quantity,
        }))
}

// 장바구니 항목 추가 또는 수량 변경 (user_id + product_id 조합으로 upsert)
export async function upsertCartItemAction(productId: string, quantity: number): Promise<void> {
    if (quantity <= 0) {
        await removeCartItemAction(productId)
        return
    }
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from("carts").upsert(
        { user_id: user.id, product_id: productId, quantity, updated_at: new Date().toISOString() },
        { onConflict: "user_id,product_id" },
    )
}

// 장바구니 항목 삭제
export async function removeCartItemAction(productId: string): Promise<void> {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from("carts").delete().eq("user_id", user.id).eq("product_id", productId)
}

// 장바구니 전체 비우기
export async function clearCartAction(): Promise<void> {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from("carts").delete().eq("user_id", user.id)
}

// 로컬 카트를 DB에 병합 — 로그인 직후 기존 localStorage 항목을 DB로 옮김
// 같은 상품이 DB에 이미 있으면 수량을 합산한다
export async function mergeLocalCartAction(
    items: { productId: string; quantity: number }[],
): Promise<void> {
    if (items.length === 0) return
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // 기존 DB 수량 조회
    const { data: existing } = await supabase
        .from("carts")
        .select("product_id, quantity")
        .eq("user_id", user.id)

    const existingMap = new Map((existing ?? []).map((r) => [r.product_id, r.quantity]))

    const upserts = items.map(({ productId, quantity }) => ({
        user_id:    user.id,
        product_id: productId,
        quantity:   (existingMap.get(productId) ?? 0) + quantity,
        updated_at: new Date().toISOString(),
    }))

    await supabase.from("carts").upsert(upserts, { onConflict: "user_id,product_id" })
}
