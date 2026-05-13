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
