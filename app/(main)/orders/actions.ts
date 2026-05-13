"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { cancelTossPayment } from "@/lib/toss"
import { createCancelRequest } from "@/lib/supabase/cancelRequests"
import type { CancelRequestType } from "@/lib/supabase/cancelRequests"

// confirmed 상태 주문 즉시 취소: Toss 결제 취소 + DB 상태 변경
export async function cancelOrderAction(
    orderId: string
): Promise<{ ok: boolean; message?: string }> {
    try {
        const supabase = await createSupabaseServerClient()
        const { data: { user } } = await supabase.auth.getUser()
        const admin = createAdminClient()

        const { data: order, error: orderErr } = await admin
            .from("orders")
            .select("status, user_id")
            .eq("id", orderId)
            .single()

        if (orderErr || !order) return { ok: false, message: "주문을 찾을 수 없습니다." }
        if (order.user_id !== user?.id) return { ok: false, message: "본인 주문만 취소할 수 있습니다." }
        if (order.status !== "confirmed") return { ok: false, message: "주문완료 상태의 주문만 즉시 취소할 수 있습니다." }

        // payments 테이블에서 완료된 결제의 paymentKey 조회
        const { data: payment } = await admin
            .from("payments")
            .select("payment_key")
            .eq("order_id", orderId)
            .eq("status", "DONE")
            .maybeSingle()

        if (payment?.payment_key) {
            // Toss 결제 취소 API 호출
            await cancelTossPayment(payment.payment_key, "고객 요청으로 인한 주문 취소")
            // payments 테이블 상태도 갱신
            await admin
                .from("payments")
                .update({ status: "CANCELED" })
                .eq("payment_key", payment.payment_key)
        }

        // 주문 상태를 cancelled로 변경
        await admin.from("orders").update({ status: "cancelled" }).eq("id", orderId)
        revalidatePath("/orders")

        return { ok: true }
    } catch (e) {
        return { ok: false, message: e instanceof Error ? e.message : "취소 중 오류가 발생했습니다." }
    }
}

// shipping/delivered 상태 주문: 교환/환불 신청 제출
export async function submitCancelRequestAction(
    orderId: string,
    type:    CancelRequestType,
    reason:  string
): Promise<{ ok: boolean; message?: string }> {
    try {
        const supabase = await createSupabaseServerClient()
        const { data: { user } } = await supabase.auth.getUser()
        const admin = createAdminClient()

        const { data: order, error: orderErr } = await admin
            .from("orders")
            .select("status, user_id")
            .eq("id", orderId)
            .single()

        if (orderErr || !order) return { ok: false, message: "주문을 찾을 수 없습니다." }
        if (order.user_id !== user?.id) return { ok: false, message: "본인 주문만 신청할 수 있습니다." }
        if (!["shipping", "delivered"].includes(order.status)) {
            return { ok: false, message: "배송중 또는 배송완료 상태의 주문만 신청할 수 있습니다." }
        }
        if (!reason.trim()) return { ok: false, message: "신청 사유를 입력해주세요." }

        await createCancelRequest(orderId, type, reason.trim())
        revalidatePath("/orders")

        return { ok: true }
    } catch (e) {
        const msg = e instanceof Error ? e.message : "신청 중 오류가 발생했습니다."
        // 이미 신청된 주문인 경우 (unique 인덱스 위반)
        if (msg.includes("unique") || msg.includes("duplicate")) {
            return { ok: false, message: "이미 교환/환불 신청이 접수되어 있습니다." }
        }
        return { ok: false, message: msg }
    }
}
