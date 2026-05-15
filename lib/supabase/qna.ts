import { supabase } from "./client"
import { createAdminClient } from "./admin"
import { type QnA } from "@/lib/data/qna"

type DbRow = {
    id: string
    product_id: string
    user_id: string
    user_name: string
    question: string
    answer: string | null
    answered_at: string | null
    is_secret: boolean
    created_at: string
}

function toQnA(row: DbRow): QnA {
    return {
        id: row.id,
        productId: row.product_id,
        userId: row.user_id,
        userName: row.user_name,
        question: row.question,
        answer: row.answer,
        answeredAt: row.answered_at,
        isSecret: row.is_secret,
        createdAt: row.created_at,
    }
}

export async function fetchQnA(
    productId: string,
    page: number,
    pageSize: number
): Promise<{ items: QnA[]; total: number }> {
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data, count, error } = await supabase
        .from("product_qna")
        .select("*", { count: "exact" })
        .eq("product_id", productId)
        .order("created_at", { ascending: false })
        .range(from, to)

    if (error) return { items: [], total: 0 }
    return { items: (data as DbRow[]).map(toQnA), total: count ?? 0 }
}

// service_role로 비밀글 포함 전체 건수 반환 (서버 컴포넌트 전용)
export async function fetchQnACount(productId: string): Promise<number> {
    const admin = createAdminClient()
    const { count } = await admin
        .from("product_qna")
        .select("*", { count: "exact", head: true })
        .eq("product_id", productId)
    return count ?? 0
}
