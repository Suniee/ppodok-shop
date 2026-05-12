import { createAdminClient } from "./admin"

export type PaymentRecord = {
    orderId:     string
    paymentKey:  string
    orderName:   string
    method:      string
    amount:      number
    status:      string
    requestedAt: string | null
    approvedAt:  string | null
    rawResponse: Record<string, unknown>
}

export type AdminPayment = {
    id:          string
    orderId:     string
    paymentKey:  string
    orderName:   string
    method:      string
    provider:    string | null  // 간편결제 제공사 (raw_response.easyPay.provider)
    amount:      number
    status:      string
    requestedAt: string | null
    approvedAt:  string | null
    createdAt:   string
}

export async function savePayment(data: PaymentRecord): Promise<void> {
    const admin = createAdminClient()
    await admin.from("payments").upsert({
        order_id:     data.orderId,
        payment_key:  data.paymentKey,
        order_name:   data.orderName,
        method:       data.method,
        amount:       data.amount,
        status:       data.status,
        requested_at: data.requestedAt,
        approved_at:  data.approvedAt,
        raw_response: data.rawResponse,
    }, { onConflict: "payment_key" })
}

function rowToAdminPayment(row: Record<string, unknown>): AdminPayment {
    const raw = (row.raw_response ?? {}) as Record<string, unknown>
    const easyPay = raw.easyPay as { provider?: string } | null
    return {
        id:          row.id as string,
        orderId:     row.order_id as string,
        paymentKey:  row.payment_key as string,
        orderName:   row.order_name as string,
        method:      row.method as string,
        provider:    easyPay?.provider ?? null,
        amount:      row.amount as number,
        status:      row.status as string,
        requestedAt: row.requested_at as string | null,
        approvedAt:  row.approved_at as string | null,
        createdAt:   row.created_at as string,
    }
}

export async function fetchAllPaymentsForAdmin(): Promise<AdminPayment[]> {
    const admin = createAdminClient()
    const { data, error } = await admin
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500)

    if (error || !data) return []
    return data.map((row: Record<string, unknown>) => rowToAdminPayment(row))
}

// 특정 날짜 범위의 결제 조회 (대사 테이블용 — 전체 상태 포함)
export async function fetchPaymentsByDateRange(
    startIso: string,
    endIso: string,
): Promise<AdminPayment[]> {
    const admin = createAdminClient()
    const { data, error } = await admin
        .from("payments")
        .select("*")
        .gte("approved_at", startIso)
        .lte("approved_at", endIso)
        .order("approved_at", { ascending: false })

    if (error || !data) return []
    return data.map((row: Record<string, unknown>) => rowToAdminPayment(row))
}

// 특정 날짜 범위의 완료(DONE) 결제 합계 (대사 요약 카드용)
export async function fetchDonePaymentsTotalByDateRange(
    startIso: string,
    endIso: string,
): Promise<{ total: number; count: number }> {
    const admin = createAdminClient()
    const { data, error } = await admin
        .from("payments")
        .select("amount")
        .eq("status", "DONE")
        .gte("approved_at", startIso)
        .lte("approved_at", endIso)

    if (error || !data) return { total: 0, count: 0 }
    const total = (data as { amount: number }[]).reduce((s, r) => s + r.amount, 0)
    return { total, count: data.length }
}
