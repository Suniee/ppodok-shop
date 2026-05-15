import { supabase } from "./client"
import { type Review } from "@/lib/data/reviews"

type DbRow = {
    id: string
    product_id: string
    user_id: string
    user_name: string
    rating: number
    content: string
    created_at: string
}

function toReview(row: DbRow): Review {
    return {
        id: row.id,
        productId: row.product_id,
        userId: row.user_id,
        userName: row.user_name,
        rating: row.rating,
        content: row.content,
        createdAt: row.created_at,
    }
}

export async function fetchReviews(
    productId: string,
    page: number,
    pageSize: number
): Promise<{ reviews: Review[]; total: number }> {
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data, count, error } = await supabase
        .from("product_reviews")
        .select("*", { count: "exact" })
        .eq("product_id", productId)
        .order("created_at", { ascending: false })
        .range(from, to)

    if (error) return { reviews: [], total: 0 }
    return { reviews: (data as DbRow[]).map(toReview), total: count ?? 0 }
}

export async function fetchReviewCount(productId: string): Promise<number> {
    const { count } = await supabase
        .from("product_reviews")
        .select("*", { count: "exact", head: true })
        .eq("product_id", productId)
    return count ?? 0
}
