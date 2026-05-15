"use server"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { type QnA } from "@/lib/data/qna"

type QnADbRow = {
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

async function getCurrentUser() {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("로그인이 필요합니다.")

    // 본인 프로필 조회 (profiles_own_select RLS 통과)
    const { data: profile } = await supabase
        .from("profiles")
        .select("name, email")
        .eq("id", user.id)
        .single()

    const userName = profile?.name || profile?.email?.split("@")[0] || "익명"
    return { supabase, user, userName }
}

export async function createReviewAction(
    productId: string,
    rating: number,
    content: string
): Promise<void> {
    const { supabase, user, userName } = await getCurrentUser()

    const { error } = await supabase.from("product_reviews").insert({
        product_id: productId,
        user_id: user.id,
        user_name: userName,
        rating,
        content,
    })

    if (error) throw new Error(error.message)
}

export async function deleteReviewAction(reviewId: string): Promise<void> {
    const { supabase } = await getCurrentUser()
    const { error } = await supabase
        .from("product_reviews")
        .delete()
        .eq("id", reviewId)
    if (error) throw new Error(error.message)
}

export async function createQnAAction(
    productId: string,
    question: string,
    isSecret: boolean
): Promise<void> {
    const { supabase, user, userName } = await getCurrentUser()

    const { error } = await supabase.from("product_qna").insert({
        product_id: productId,
        user_id: user.id,
        user_name: userName,
        question,
        is_secret: isSecret,
    })

    if (error) throw new Error(error.message)
}

export async function deleteQnAAction(qnaId: string): Promise<void> {
    const { supabase } = await getCurrentUser()
    const { error } = await supabase
        .from("product_qna")
        .delete()
        .eq("id", qnaId)
    if (error) throw new Error(error.message)
}

// 비밀글 포함 전체 Q&A 조회 — service_role로 RLS 우회 후 서버에서 마스킹
// 클라이언트에 비밀글 원문이 전달되지 않도록 서버에서 처리한다
export async function fetchQnAAction(
    productId: string,
    page: number,
    pageSize: number
): Promise<{ items: QnA[]; total: number }> {
    // 현재 로그인 사용자 확인 (비로그인 시 null)
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    const currentUserId = user?.id ?? null

    const admin = createAdminClient()
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data, count, error } = await admin
        .from("product_qna")
        .select("*", { count: "exact" })
        .eq("product_id", productId)
        .order("created_at", { ascending: false })
        .range(from, to)

    if (error) return { items: [], total: 0 }

    const items = (data as QnADbRow[]).map((row): QnA => {
        const canView = !row.is_secret || row.user_id === currentUserId
        return {
            id:         row.id,
            productId:  row.product_id,
            userId:     row.user_id,
            userName:   row.user_name,
            question:   canView ? row.question : "비밀글입니다.",
            answer:     canView ? row.answer : null,
            answeredAt: canView ? row.answered_at : null,
            isSecret:   row.is_secret,
            createdAt:  row.created_at,
        }
    })

    return { items, total: count ?? 0 }
}
