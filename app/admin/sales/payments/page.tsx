import { fetchTossTransactions } from "@/lib/toss"
import PaymentsClient from "./PaymentsClient"

interface Props {
    searchParams: Promise<{ start?: string; end?: string }>
}

// KST 기준 오늘 00:00 ~ 23:59:59
function todayRange(): { start: string; end: string } {
    const kst = new Date(Date.now() + 9 * 60 * 60 * 1000)
    const ymd = kst.toISOString().slice(0, 10)
    return { start: `${ymd}T00:00:00`, end: `${ymd}T23:59:59` }
}

export default async function PaymentsPage({ searchParams }: Props) {
    const { start, end } = await searchParams
    const range = (start && end) ? { start, end } : todayRange()

    const transactions = await fetchTossTransactions(range.start, range.end).catch(() => [])

    return (
        <PaymentsClient
            transactions={transactions}
            initialStart={range.start.slice(0, 10)}
            initialEnd={range.end.slice(0, 10)}
        />
    )
}
