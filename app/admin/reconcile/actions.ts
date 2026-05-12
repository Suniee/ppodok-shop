"use server"

import { revalidatePath } from "next/cache"
import { fetchTossPayment, fetchTossTransactions, cancelTossPayment } from "@/lib/toss"
import { savePayment } from "@/lib/supabase/payments"
import { saveTossTransactions } from "@/lib/supabase/toss_transactions"
import { updateOrderStatus } from "@/lib/supabase/orders"
import { createAdminClient } from "@/lib/supabase/admin"

// Toss 거래내역 API 조회 후 toss_transactions 테이블에 저장
export async function receiveTossDataAction(
    start: string,  // "YYYY-MM-DD"
    end: string,
): Promise<{ saved: number; errors: string[]; message: string }> {
    try {
        const startIso = `${start}T00:00:00`
        const endIso   = `${end}T23:59:59`
        const transactions = await fetchTossTransactions(startIso, endIso)

        if (transactions.length === 0) {
            return { saved: 0, errors: [], message: "조회된 거래내역이 없습니다." }
        }

        const result = await saveTossTransactions(transactions)
        revalidatePath("/admin/reconcile")
        return {
            saved: result.saved,
            errors: result.errors,
            message: result.errors.length === 0
                ? `${start} ~ ${end} · ${result.saved}건 저장 완료`
                : `${start} ~ ${end} · ${result.saved}건 저장, ${result.errors.length}건 오류`,
        }
    } catch (e) {
        return { saved: 0, errors: [], message: e instanceof Error ? e.message : "데이터 수신에 실패했습니다." }
    }
}

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
