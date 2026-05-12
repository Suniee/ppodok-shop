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

    return (
        <ReconcileClient
            tossTransactions={tossTransactions}
            dbPayments={dbPayments}
            initialStart={range.start}
            initialEnd={range.end}
        />
    )
}
