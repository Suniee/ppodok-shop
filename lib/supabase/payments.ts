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
