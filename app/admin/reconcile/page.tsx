import { fetchTossTransactions } from "@/lib/toss"
import { fetchPaymentsByDateRange, fetchAllDonePaymentsTotal } from "@/lib/supabase/payments"
import ReconcileClient from "./ReconcileClient"

interface Props {
    searchParams: Promise<{ start?: string; end?: string }>
}

function todayRange() {
    const kst = new Date(Date.now() + 9 * 60 * 60 * 1000)
    const ymd = kst.toISOString().slice(0, 10)
    return { start: ymd, end: ymd }
}

export default async function ReconcilePage({ searchParams }: Props) {
    const { start, end } = await searchParams
    const range = (start && end) ? { start, end } : todayRange()

    const startIso = `${range.start}T00:00:00`
    const endIso   = `${range.end}T23:59:59`

    // Toss API, DB 전체 목록, DB 완료 합계를 병렬 조회
    const [tossTransactions, dbPayments, dbDoneTotal] = await Promise.all([
        fetchTossTransactions(startIso, endIso).catch(() => []),
        fetchPaymentsByDateRange(startIso, `${range.end}T23:59:59+09:00`),
        fetchAllDonePaymentsTotal(),
    ])

    // Toss: paymentKey별 가장 최근 트랜잭션 상태가 DONE인 건만 합산
    // (승인 후 취소된 건은 CANCELED 레코드가 더 늦으므로 제외됨)
    const latestByKey = new Map<string, { amount: number; status: string; at: string }>()
    for (const t of tossTransactions) {
        const cur = latestByKey.get(t.paymentKey)
        if (!cur || t.transactionAt > cur.at) {
            latestByKey.set(t.paymentKey, { amount: t.amount, status: t.status, at: t.transactionAt })
        }
    }
    const doneEntries = Array.from(latestByKey.values()).filter((v) => v.status === "DONE")
    const tossApprovedTotal = doneEntries.reduce((s, v) => s + v.amount, 0)
    const tossApprovedCount = doneEntries.length

    // DB: payments 테이블에서 DONE 상태 건만 DB 쿼리로 직접 집계
    const dbApprovedTotal = dbDoneTotal.total
    const dbApprovedCount = dbDoneTotal.count

    return (
        <ReconcileClient
            tossTransactions={tossTransactions}
            dbPayments={dbPayments}
            initialStart={range.start}
            initialEnd={range.end}
            tossApprovedTotal={tossApprovedTotal}
            tossApprovedCount={tossApprovedCount}
            dbApprovedTotal={dbApprovedTotal}
            dbApprovedCount={dbApprovedCount}
        />
    )
}
