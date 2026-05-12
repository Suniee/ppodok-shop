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

export async function fetchAllPaymentsForAdmin(): Promise<AdminPayment[]> {
    const admin = createAdminClient()
    const { data, error } = await admin
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500)

    if (error || !data) return []

    return data.map((row: Record<string, unknown>) => {
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
    })
}
