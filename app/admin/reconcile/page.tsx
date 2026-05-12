import { fetchTossTransactions } from "@/lib/toss"
import { fetchPaymentsByDateRange } from "@/lib/supabase/payments"
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

    // Toss API와 DB를 병렬 조회
    const [tossTransactions, dbPayments] = await Promise.all([
        fetchTossTransactions(startIso, endIso).catch(() => []),
        fetchPaymentsByDateRange(startIso, `${range.end}T23:59:59+09:00`),
    ])

    // Toss: 승인(DONE) 건만, paymentKey 기준 중복 제거 후 합산
    const doneByKey = new Map<string, number>()
    tossTransactions
        .filter((t) => t.status === "DONE")
        .forEach((t) => { if (!doneByKey.has(t.paymentKey)) doneByKey.set(t.paymentKey, t.amount) })
    const tossApprovedTotal = Array.from(doneByKey.values()).reduce((s, a) => s + a, 0)
    const tossApprovedCount = doneByKey.size

    // DB: DONE 상태 건만 합산
    const dbDone = dbPayments.filter((p) => p.status === "DONE")
    const dbApprovedTotal = dbDone.reduce((s, p) => s + p.amount, 0)
    const dbApprovedCount = dbDone.length

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
