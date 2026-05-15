"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { type Review } from "@/lib/data/reviews"

export type AdminReview = Review & { productName: string }

type DbRow = {
    id: string
    product_id: string
    user_id: string
    user_name: string
    rating: number
    content: string
    created_at: string
    products: { name: string } | null
}

function toAdminReview(row: DbRow): AdminReview {
    return {
        id: row.id,
        productId: row.product_id,
        productName: row.products?.name ?? "알 수 없음",
        userId: row.user_id,
        userName: row.user_name,
        rating: row.rating,
        content: row.content,
        createdAt: row.created_at,
    }
}

export async function fetchAdminReviewsAction(
    page: number,
    pageSize: number,
    ratingFilter: number | null,
    query: string
): Promise<{ items: AdminReview[]; total: number }> {
    const admin = createAdminClient()
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let builder = admin
        .from("product_reviews")
        .select("*, products(name)", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to)

    if (ratingFilter !== null) builder = builder.eq("rating", ratingFilter)
    if (query.trim())          builder = builder.ilike("content", `%${query.trim()}%`)

    const { data, count, error } = await builder
    if (error) return { items: [], total: 0 }
    return { items: (data as DbRow[]).map(toAdminReview), total: count ?? 0 }
}

export async function deleteAdminReviewAction(reviewId: string): Promise<void> {
    const admin = createAdminClient()
    const { error } = await admin.from("product_reviews").delete().eq("id", reviewId)
    if (error) throw new Error(error.message)
}
