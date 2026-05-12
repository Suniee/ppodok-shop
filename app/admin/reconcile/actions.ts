"use server"

import { revalidatePath } from "next/cache"
import { fetchTossPayment, cancelTossPayment } from "@/lib/toss"
import { savePayment } from "@/lib/supabase/payments"
import { updateOrderStatus } from "@/lib/supabase/orders"
import { createAdminClient } from "@/lib/supabase/admin"

// DB 미저장 건을 Toss 단건 조회 후 재저장
export async function resavePaymentAction(paymentKey: string, orderId: string): Promise<{ ok: boolean; message: string }> {
    try {
        const detail = await fetchTossPayment(paymentKey)
        if (!detail) return { ok: false, message: "토스에서 결제 정보를 조회할 수 없습니다." }

        await savePayment({
            orderId,
            paymentKey:  detail.paymentKey,
            orderName:   detail.orderName,
            method:      detail.method,
            amount:      detail.totalAmount,
            status:      detail.status,
            requestedAt: detail.requestedAt,
            approvedAt:  detail.approvedAt,
            rawResponse: detail as unknown as Record<string, unknown>,
        })

        revalidatePath("/admin/reconcile")
        return { ok: true, message: "재저장 완료" }
    } catch (e) {
        return { ok: false, message: e instanceof Error ? e.message : "재저장에 실패했습니다." }
    }
}

// Toss 조회 결과로 payments 테이블 상태 일괄 갱신 (paymentKey 기준)
export async function syncPaymentStatusesAction(
    updates: { paymentKey: string; status: string }[]
): Promise<{ updated: number; skipped: number; errors: string[] }> {
    const admin = createAdminClient()
    let updated = 0
    let skipped = 0
    const errors: string[] = []

    for (const { paymentKey, status } of updates) {
        try {
            const { data, error } = await admin
                .from("payments")
                .update({ status })
                .eq("payment_key", paymentKey)
                .select("id")

            if (error) throw error
            if (data && data.length > 0) updated++
            else skipped++ // payments 테이블에 해당 paymentKey 없음
        } catch {
            errors.push(paymentKey.slice(0, 12))
        }
    }

    revalidatePath("/admin/reconcile")
    revalidatePath("/admin/sales/payments")
    return { updated, skipped, errors }
}

// 토스 결제 취소 + DB 상태 업데이트 + 주문 취소
export async function cancelPaymentAction(
    paymentKey: string,
    orderId: string,
    cancelReason: string,
): Promise<{ ok: boolean; message: string }> {
    try {
        const tossResponse = await cancelTossPayment(paymentKey, cancelReason)

        // payments 테이블 상태를 CANCELED로 업데이트
        const admin = createAdminClient()
        await admin
            .from("payments")
            .update({ status: "CANCELED", raw_response: tossResponse })
            .eq("payment_key", paymentKey)

        // 주문 상태도 취소로 변경
        await updateOrderStatus(orderId, "cancelled")

        revalidatePath("/admin/reconcile")
        revalidatePath("/admin/sales")
        return { ok: true, message: "결제 취소 완료" }
    } catch (e) {
        return { ok: false, message: e instanceof Error ? e.message : "결제 취소에 실패했습니다." }
    }
}
