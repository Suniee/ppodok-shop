"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { savePayment } from "@/lib/supabase/payments"
import { fetchTossPaymentByOrderId } from "@/lib/toss"

type SyncResult = {
    synced:  number   // 새로 저장된 건수
    skipped: number   // 이미 존재하거나 Toss 조회 실패
    errors:  string[] // 실패한 orderId 목록
}

// payments 테이블에 없는 confirmed 이상 주문을 Toss API로 역조회해 일괄 저장
export async function syncMissingPaymentsAction(): Promise<SyncResult> {
    const admin = createAdminClient()

    // 결제가 완료된 주문(pending·cancelled 제외) 중 payments 레코드가 없는 것 조회
    const { data: orders, error } = await admin
        .from("orders")
        .select("id")
        .not("status", "in", "(pending,cancelled)")

    if (error || !orders) return { synced: 0, skipped: 0, errors: [] }

    // 이미 저장된 paymentKey 목록
    const { data: existing } = await admin
        .from("payments")
        .select("order_id")

    const savedOrderIds = new Set((existing ?? []).map((r: { order_id: string }) => r.order_id))
    const missing = orders.filter((o: { id: string }) => !savedOrderIds.has(o.id))

    let synced  = 0
    let skipped = 0
    const errors: string[] = []

    for (const order of missing) {
        try {
            const detail = await fetchTossPaymentByOrderId(order.id)
            if (!detail) { skipped++; continue }

            await savePayment({
                orderId:     order.id,
                paymentKey:  detail.paymentKey,
                orderName:   detail.orderName,
                method:      detail.method,
                amount:      detail.totalAmount,
                status:      detail.status,
                requestedAt: detail.requestedAt,
                approvedAt:  detail.approvedAt,
                rawResponse: detail as unknown as Record<string, unknown>,
            })
            synced++
        } catch {
            errors.push(order.id.slice(0, 8).toUpperCase())
        }
    }

    revalidatePath("/admin/sales/payments")
    revalidatePath("/admin/reconcile")
    return { synced, skipped, errors }
}

export type PaymentStats = {
    doneAmount:  number
    doneCount:   number
    cancelCount: number
    cancelAmount: number
    totalCount:  number
}

type AdminPayment = {
    id: string; orderId: string; paymentKey: string; orderName: string
    method: string; provider: string | null; amount: number; status: string
    requestedAt: string | null; approvedAt: string | null; createdAt: string
}

function rowToPayment(row: Record<string, unknown>): AdminPayment {
    const raw    = (row.raw_response ?? {}) as Record<string, unknown>
    const easyPay = raw.easyPay as { provider?: string } | null
    return {
        id:          row.id          as string,
        orderId:     row.order_id    as string,
        paymentKey:  row.payment_key as string,
        orderName:   row.order_name  as string,
        method:      row.method      as string,
        provider:    easyPay?.provider ?? null,
        amount:      row.amount      as number,
        status:      row.status      as string,
        requestedAt: row.requested_at as string | null,
        approvedAt:  row.approved_at  as string | null,
        createdAt:   row.created_at   as string,
    }
}

export async function fetchPaymentsPagedAction(
    page: number,
    pageSize: number,
    startDate?: string,
    endDate?: string,
    query?: string,
): Promise<{ items: AdminPayment[]; total: number; stats: PaymentStats }> {
    const admin = createAdminClient()
    const from  = (page - 1) * pageSize
    const to    = from + pageSize - 1
    const q     = (query ?? "").trim()

    let builder = admin
        .from("payments")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to)

    // approvedAt 기준 날짜 필터
    if (startDate) builder = builder.gte("approved_at", `${startDate}T00:00:00+09:00`)
    if (endDate)   builder = builder.lte("approved_at", `${endDate}T23:59:59+09:00`)
    if (q) builder = builder.or(`order_id.ilike.%${q}%,order_name.ilike.%${q}%,payment_key.ilike.%${q}%`)

    const { data, count, error } = await builder
    if (error || !data) return { items: [], total: 0, stats: { doneAmount: 0, doneCount: 0, cancelCount: 0, cancelAmount: 0, totalCount: 0 } }

    const items = (data as Record<string, unknown>[]).map(rowToPayment)

    // 날짜 범위 통계 (페이지 무관 — 요약 카드용)
    let statsQ = admin.from("payments").select("status, amount")
    if (startDate) statsQ = statsQ.gte("approved_at", `${startDate}T00:00:00+09:00`)
    if (endDate)   statsQ = statsQ.lte("approved_at", `${endDate}T23:59:59+09:00`)

    const { data: allRows } = await statsQ
    const stats: PaymentStats = { doneAmount: 0, doneCount: 0, cancelCount: 0, cancelAmount: 0, totalCount: allRows?.length ?? 0 }
    for (const r of allRows ?? []) {
        if (r.status === "DONE") { stats.doneAmount += r.amount; stats.doneCount++ }
        if ((r.status as string).includes("CANCELED")) { stats.cancelAmount += r.amount; stats.cancelCount++ }
    }

    return { items, total: count ?? 0, stats }
}
