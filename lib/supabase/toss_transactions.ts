import { createAdminClient } from "./admin"
import type { TossTransaction } from "@/lib/toss"

export type StoredTossTransaction = TossTransaction & {
    id: string
    createdAt: string
}

// Toss 거래내역을 toss_transactions 테이블에 배치 upsert (transaction_key 기준 중복 방지)
export async function saveTossTransactions(
    transactions: TossTransaction[]
): Promise<{ saved: number; errors: string[] }> {
    if (transactions.length === 0) return { saved: 0, errors: [] }

    const admin = createAdminClient()

    const rows = transactions.map((t) => ({
        transaction_key: t.transactionKey,
        payment_key:     t.paymentKey,
        order_id:        t.orderId,
        order_name:      t.orderName,
        method:          t.method,
        amount:          t.amount,
        status:          t.status,
        transaction_at:  t.transactionAt,
        currency:        t.currency ?? "KRW",
        provider:        t.provider ?? null,
    }))

    const { error } = await admin
        .from("toss_transactions")
        .upsert(rows, { onConflict: "transaction_key" })

    if (error) {
        console.error("[saveTossTransactions]", error.message)
        return { saved: 0, errors: [error.message] }
    }

    return { saved: rows.length, errors: [] }
}
