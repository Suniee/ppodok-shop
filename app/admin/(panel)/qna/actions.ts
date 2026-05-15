"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { type QnA } from "@/lib/data/qna"

export type AdminQnA = QnA & { productName: string }

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
    products: { name: string } | null
}

function toAdminQnA(row: DbRow): AdminQnA {
    return {
        id: row.id,
        productId: row.product_id,
        productName: row.products?.name ?? "알 수 없음",
        userId: row.user_id,
        userName: row.user_name,
        question: row.question,
        answer: row.answer,
        answeredAt: row.answered_at,
        isSecret: row.is_secret,
        createdAt: row.created_at,
    }
}

export async function fetchAdminQnAAction(
    page: number,
    pageSize: number,
    filter: "all" | "pending" | "answered",
    query: string
): Promise<{ items: AdminQnA[]; total: number }> {
    const admin = createAdminClient()
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // 기본 쿼리 빌드 후 필터 조건을 순차 적용
    let builder = admin
        .from("product_qna")
        .select("*, products(name)", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to)

    if (filter === "pending")  builder = builder.is("answer", null)
    if (filter === "answered") builder = builder.not("answer", "is", null)
    if (query.trim())          builder = builder.ilike("question", `%${query.trim()}%`)

    const { data, count, error } = await builder
    if (error) return { items: [], total: 0 }
    return { items: (data as DbRow[]).map(toAdminQnA), total: count ?? 0 }
}

export async function answerQnAAction(qnaId: string, answer: string): Promise<void> {
    const admin = createAdminClient()
    const { error } = await admin
        .from("product_qna")
        .update({ answer: answer.trim(), answered_at: new Date().toISOString() })
        .eq("id", qnaId)
    if (error) throw new Error(error.message)
}

export async function deleteAdminQnAAction(qnaId: string): Promise<void> {
    const admin = createAdminClient()
    const { error } = await admin.from("product_qna").delete().eq("id", qnaId)
    if (error) throw new Error(error.message)
}
