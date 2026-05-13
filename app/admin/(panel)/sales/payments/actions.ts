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
