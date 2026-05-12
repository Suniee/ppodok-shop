import { createAdminClient } from "./admin"
import type { TossTransaction } from "@/lib/toss"

export type StoredTossTransaction = TossTransaction & {
    id: string
    createdAt: string
}

// Toss 거래내역을 toss_transactions 테이블에 upsert (transaction_key 기준 중복 방지)
export async function saveTossTransactions(
    transactions: TossTransaction[]
): Promise<{ saved: number; errors: string[] }> {
    const admin = createAdminClient()
    let saved = 0
    const errors: string[] = []

    for (const t of transactions) {
        const { error } = await admin
            .from("toss_transactions")
            .upsert({
                transaction_key: t.transactionKey,
                payment_key:     t.paymentKey,
                order_id:        t.orderId,
                order_name:      t.orderName,
                method:          t.method,
                amount:          t.amount,
                status:          t.status,
                transaction_at:  t.transactionAt,
                currency:        t.currency,
                provider:        t.provider,
            }, { onConflict: "transaction_key" })

        if (error) errors.push(t.transactionKey.slice(0, 12))
        else saved++
    }

    return { saved, errors }
}
