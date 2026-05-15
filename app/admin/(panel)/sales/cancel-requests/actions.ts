"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { cancelTossPayment } from "@/lib/toss"
import { updateCancelRequestStatus } from "@/lib/supabase/cancelRequests"

// 교환/환불 신청 승인
// - 환불(refund): Toss 결제 취소 + 주문 상태 cancelled
// - 교환(exchange): 신청 상태만 approved로 변경 (주문 상태는 어드민이 별도 관리)
export async function approveCancelRequestAction(
    requestId: string,
    orderId:   string,
    type:      "exchange" | "refund",
    adminNote: string
): Promise<{ ok: boolean; message?: string }> {
    try {
        const admin = createAdminClient()

        if (type === "refund") {
            // payments 테이블에서 paymentKey 조회
            const { data: payment } = await admin
                .from("payments")
                .select("payment_key")
                .eq("order_id", orderId)
                .eq("status", "DONE")
                .maybeSingle()

            if (payment?.payment_key) {
                const reason = adminNote.trim() || "교환/환불 승인으로 인한 결제 취소"
                await cancelTossPayment(payment.payment_key, reason)
                await admin
                    .from("payments")
                    .update({ status: "CANCELED" })
                    .eq("payment_key", payment.payment_key)
            }

            // 주문 상태를 cancelled로 변경
            await admin.from("orders").update({ status: "cancelled" }).eq("id", orderId)
        }

        await updateCancelRequestStatus(requestId, "approved", adminNote.trim() || undefined)

        revalidatePath("/admin/sales/cancel-requests")
        revalidatePath("/admin/sales")

        return { ok: true }
    } catch (e) {
        return { ok: false, message: e instanceof Error ? e.message : "승인 처리 중 오류가 발생했습니다." }
    }
}

// 교환/환불 신청 거절
export async function rejectCancelRequestAction(
    requestId: string,
    adminNote: string
): Promise<{ ok: boolean; message?: string }> {
    try {
        if (!adminNote.trim()) return { ok: false, message: "거절 사유를 입력해주세요." }

        await updateCancelRequestStatus(requestId, "rejected", adminNote.trim())

        revalidatePath("/admin/sales/cancel-requests")

        return { ok: true }
    } catch (e) {
        return { ok: false, message: e instanceof Error ? e.message : "거절 처리 중 오류가 발생했습니다." }
    }
}

import type { AdminCancelRequest, CancelRequestStatus } from "@/lib/supabase/cancelRequests"

export type CancelRequestCounts = { all: number; pending: number; approved: number; rejected: number }

export async function fetchCancelRequestsPagedAction(
    page: number,
    pageSize: number,
    status: CancelRequestStatus | "all",
    query: string,
    startDate?: string,
    endDate?: string,
): Promise<{ items: AdminCancelRequest[]; total: number; counts: CancelRequestCounts }> {
    const admin = createAdminClient()
    const from  = (page - 1) * pageSize
    const to    = from + pageSize - 1
    const q     = query.trim()

    let builder = admin
        .from("cancel_requests")
        .select("*, orders(recipient_name, total_price, order_items(product_name))", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to)

    if (status !== "all") builder = builder.eq("status", status)
    if (startDate) builder = builder.gte("created_at", `${startDate}T00:00:00+09:00`)
    if (endDate)   builder = builder.lte("created_at", `${endDate}T23:59:59+09:00`)
    if (q) builder = builder.or(`reason.ilike.%${q}%,id.ilike.%${q}%`)

    const { data, count, error } = await builder
    if (error || !data) return { items: [], total: 0, counts: { all: 0, pending: 0, approved: 0, rejected: 0 } }

    const items: AdminCancelRequest[] = (data as Record<string, unknown>[]).map((row) => {
        const order = row.orders as { recipient_name: string; total_price: number; order_items: { product_name: string }[] } | null
        const orderItems   = order?.order_items ?? []
        const firstName    = orderItems[0]?.product_name ?? "상품"
        const itemsSummary = orderItems.length > 1 ? `${firstName} 외 ${orderItems.length - 1}개` : firstName
        return {
            id:            row.id as string,
            orderId:       row.order_id as string,
            type:          row.type as "exchange" | "refund",
            reason:        row.reason as string,
            status:        row.status as CancelRequestStatus,
            adminNote:     row.admin_note as string | null,
            createdAt:     row.created_at as string,
            updatedAt:     row.updated_at as string,
            recipientName: order?.recipient_name ?? "-",
            totalPrice:    order?.total_price    ?? 0,
            itemsSummary,
        }
    })

    // 전체 상태별 카운트 (요약 카드용 — status/검색 필터 미적용)
    const { data: countRows } = await admin
        .from("cancel_requests")
        .select("status")
    const counts: CancelRequestCounts = { all: 0, pending: 0, approved: 0, rejected: 0 }
    for (const r of countRows ?? []) {
        counts.all++
        if (r.status === "pending")  counts.pending++
        if (r.status === "approved") counts.approved++
        if (r.status === "rejected") counts.rejected++
    }

    return { items, total: count ?? 0, counts }
}
