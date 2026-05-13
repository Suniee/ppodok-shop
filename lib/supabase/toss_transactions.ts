import { createAdminClient } from "./admin"
import type { TossTransaction } from "@/lib/toss"

// toss_transactions 테이블 row → TossTransaction 타입으로 변환
function rowToTossTransaction(row: Record<string, unknown>): TossTransaction {
    return {
        transactionKey: row.transaction_key as string,
        paymentKey:     row.payment_key     as string,
        orderId:        row.order_id        as string,
        orderName:      "",                            // 테이블에서 제거된 컬럼
        method:         row.method          as string,
        amount:         row.amount          as number,
        status:         row.status          as string,
        transactionAt:  row.transaction_at  as string,
        currency:       row.currency        as string,
        provider:       (row.provider       as string) ?? null,
    }
}

// 날짜 범위 내 저장된 Toss 거래내역 조회
export async function fetchStoredTossTransactions(
    startIso: string,
    endIso: string,
): Promise<TossTransaction[]> {
    const admin = createAdminClient()
    const { data, error } = await admin
        .from("toss_transactions")
        .select("*")
        .gte("transaction_at", startIso)
        .lte("transaction_at", endIso)
        .order("transaction_at", { ascending: false })

    if (error || !data) return []
    return (data as Record<string, unknown>[]).map(rowToTossTransaction)
}

// 특정 날짜 범위의 기존 데이터 삭제 (transaction_at 기준)
export async function deleteTossTransactionsByDateRange(
    startIso: string,
    endIso: string,
): Promise<void> {
    const admin = createAdminClient()
    await admin
        .from("toss_transactions")
        .delete()
        .gte("transaction_at", startIso)
        .lte("transaction_at", endIso)
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
        order_id:        t.orderId  ?? "",
        method:          t.method   ?? "",
        amount:          t.amount      ?? 0,
        status:          t.status      ?? "",
        transaction_at:  t.transactionAt,
        currency:        t.currency    ?? "KRW",
        provider:        t.provider    ?? null,
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
