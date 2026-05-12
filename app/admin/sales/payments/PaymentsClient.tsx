"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
    CreditCard, CheckCircle2, XCircle, Clock, AlertCircle,
    TrendingUp, Search, ExternalLink,
} from "lucide-react"
import type { TossTransaction } from "@/lib/toss"

const STATUS_META: Record<string, { label: string; bg: string; color: string; icon: React.ElementType }> = {
    DONE:                  { label: "결제 완료",      bg: "#E8F8F5", color: "#00A878", icon: CheckCircle2 },
    CANCELED:              { label: "취소",           bg: "#FFF0F0", color: "#FF4E4E", icon: XCircle },
    PARTIAL_CANCELED:      { label: "부분 취소",      bg: "#FFF0F0", color: "#FF4E4E", icon: XCircle },
    WAITING_FOR_DEPOSIT:   { label: "입금 대기",      bg: "#FFF8E1", color: "#FFB800", icon: Clock },
    IN_PROGRESS:           { label: "처리 중",        bg: "#EBF3FF", color: "#0064FF", icon: Clock },
}

const METHOD_ICON: Record<string, string> = {
    "카드": "💳", "계좌이체": "🏦", "가상계좌": "🏦",
    "휴대폰": "📱", "간편결제": "⚡",
}

function formatDateTime(iso: string) {
    const d = new Date(iso)
    return d.toLocaleString("ko-KR", {
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
    })
}

function SummaryCard({
    label, value, sub, color, icon: Icon,
}: { label: string; value: string; sub?: string; color: string; icon: React.ElementType }) {
    return (
        <div className="bg-white rounded-2xl px-5 py-4 flex items-center gap-4"
            style={{ border: "1px solid var(--toss-border)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: color + "18" }}>
                <Icon className="size-5" style={{ color }} />
            </div>
            <div>
                <p className="text-xs font-medium" style={{ color: "var(--toss-text-secondary)" }}>{label}</p>
                <p className="text-lg font-black mt-0.5" style={{ color: "var(--toss-text-primary)", letterSpacing: "-0.03em" }}>{value}</p>
                {sub && <p className="text-[11px]" style={{ color: "var(--toss-text-tertiary)" }}>{sub}</p>}
            </div>
        </div>
    )
}

interface Props {
    transactions: TossTransaction[]
    initialStart: string
    initialEnd: string
}

export default function PaymentsClient({ transactions, initialStart, initialEnd }: Props) {
    const router = useRouter()
    const [start, setStart] = useState(initialStart)
    const [end, setEnd]     = useState(initialEnd)
    const [search, setSearch] = useState("")

    const filtered = transactions.filter((t) => {
        const q = search.trim().toLowerCase()
        return !q
            || t.orderId.toLowerCase().includes(q)
            || t.orderName.toLowerCase().includes(q)
            || t.paymentKey.toLowerCase().includes(q)
    })

    // 요약 통계
    const doneList      = transactions.filter((t) => t.status === "DONE")
    const cancelledList = transactions.filter((t) => t.status.includes("CANCELED"))
    const totalAmount   = doneList.reduce((s, t) => s + t.amount, 0)

    const handleSearch = () => {
        router.push(`/admin/sales/payments?start=${start}T00:00:00&end=${end}T23:59:59`)
    }

    return (
        <div className="p-7 space-y-6">
            {/* 헤더 */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-xl font-black" style={{ color: "var(--toss-text-primary)", letterSpacing: "-0.03em" }}>
                        결제 내역
                    </h1>
                    <p className="text-sm mt-0.5" style={{ color: "var(--toss-text-secondary)" }}>
                        토스페이먼츠 실제 결제 데이터
                    </p>
                </div>

                {/* 날짜 범위 조회 */}
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white"
                        style={{ border: "1px solid var(--toss-border)" }}>
                        <input
                            type="date"
                            value={start}
                            max={end}
                            onChange={(e) => setStart(e.target.value)}
                            className="text-sm outline-none bg-transparent"
                            style={{ color: "var(--toss-text-primary)" }}
                        />
                        <span className="text-xs" style={{ color: "var(--toss-text-tertiary)" }}>~</span>
                        <input
                            type="date"
                            value={end}
                            min={start}
                            onChange={(e) => setEnd(e.target.value)}
                            className="text-sm outline-none bg-transparent"
                            style={{ color: "var(--toss-text-primary)" }}
                        />
                    </div>
                    <button
                        onClick={handleSearch}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-85"
                        style={{ backgroundColor: "var(--toss-blue)" }}
                    >
                        <Search className="size-3.5" />
                        조회
                    </button>
                </div>
            </div>

            {/* 요약 카드 */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                <SummaryCard
                    label="결제 완료 금액"
                    value={`${(totalAmount / 10000).toLocaleString()}만원`}
                    sub={`${doneList.length}건`}
                    color="#00A878" icon={TrendingUp}
                />
                <SummaryCard
                    label="전체 거래"
                    value={`${transactions.length}건`}
                    color="#0064FF" icon={CreditCard}
                />
                <SummaryCard
                    label="취소/부분취소"
                    value={`${cancelledList.length}건`}
                    sub={cancelledList.length > 0 ? `${cancelledList.reduce((s, t) => s + t.amount, 0).toLocaleString()}원` : undefined}
                    color="#FF4E4E" icon={XCircle}
                />
                <SummaryCard
                    label="대기/처리중"
                    value={`${transactions.filter((t) => !["DONE", "CANCELED", "PARTIAL_CANCELED"].includes(t.status)).length}건`}
                    color="#FFB800" icon={AlertCircle}
                />
            </div>

            {/* 검색 + 테이블 */}
            <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid var(--toss-border)" }}>
                <div className="px-5 py-4 flex items-center justify-between gap-3"
                    style={{ borderBottom: "1px solid var(--toss-border)" }}>
                    <p className="text-sm font-bold" style={{ color: "var(--toss-text-primary)" }}>
                        거래 목록 <span className="font-normal text-xs ml-1" style={{ color: "var(--toss-text-tertiary)" }}>{initialStart} ~ {initialEnd}</span>
                    </p>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                        style={{ backgroundColor: "var(--toss-page-bg)", border: "1px solid var(--toss-border)", minWidth: 220 }}>
                        <Search className="size-3.5 flex-shrink-0" style={{ color: "var(--toss-text-tertiary)" }} />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="주문번호, 주문명, paymentKey 검색"
                            className="bg-transparent text-xs outline-none flex-1"
                            style={{ color: "var(--toss-text-primary)" }}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {filtered.length === 0 ? (
                        <div className="py-16 text-center" style={{ color: "var(--toss-text-tertiary)" }}>
                            <CreditCard className="size-10 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">조회된 결제 내역이 없습니다</p>
                            <p className="text-xs mt-1">날짜 범위를 변경하거나 테스트 결제를 진행해보세요</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr style={{ borderBottom: "1px solid var(--toss-border)" }}>
                                    {["거래 시각", "주문번호", "주문명", "결제 수단", "금액", "상태", "paymentKey"].map((h) => (
                                        <th key={h}
                                            className="px-4 py-3 text-left text-[11px] font-semibold whitespace-nowrap"
                                            style={{ color: "var(--toss-text-tertiary)", backgroundColor: "var(--toss-page-bg)" }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((t, i) => {
                                    const meta = STATUS_META[t.status] ?? {
                                        label: t.status, bg: "#F2F4F6", color: "#8B95A1", icon: Clock,
                                    }
                                    const methodIcon = METHOD_ICON[t.method] ?? "💳"
                                    return (
                                        <tr key={t.transactionKey}
                                            className="hover:bg-gray-50 transition-colors"
                                            style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--toss-border)" : undefined }}>

                                            {/* 거래 시각 */}
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className="text-[11px]" style={{ color: "var(--toss-text-tertiary)" }}>
                                                    {formatDateTime(t.transactionAt)}
                                                </span>
                                            </td>

                                            {/* 주문번호 → 매출관리 링크 */}
                                            <td className="px-4 py-3">
                                                <a
                                                    href={`/admin/sales?search=${t.orderId.slice(0, 8)}`}
                                                    className="flex items-center gap-1 font-mono text-xs font-semibold hover:underline"
                                                    style={{ color: "var(--toss-blue)" }}
                                                    title="매출 관리에서 보기"
                                                >
                                                    {t.orderId.slice(0, 8).toUpperCase()}
                                                    <ExternalLink className="size-2.5 opacity-60" />
                                                </a>
                                            </td>

                                            {/* 주문명 */}
                                            <td className="px-4 py-3 max-w-[160px]">
                                                <p className="text-xs truncate" style={{ color: "var(--toss-text-secondary)" }}>
                                                    {t.orderName}
                                                </p>
                                            </td>

                                            {/* 결제 수단 */}
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className="text-xs" style={{ color: "var(--toss-text-secondary)" }}>
                                                    {methodIcon} {t.method}
                                                    {t.provider && (
                                                        <span className="ml-1 text-[10px]" style={{ color: "var(--toss-text-tertiary)" }}>
                                                            ({t.provider})
                                                        </span>
                                                    )}
                                                </span>
                                            </td>

                                            {/* 금액 */}
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <p className="text-xs font-black" style={{ color: "var(--toss-text-primary)" }}>
                                                    {t.amount.toLocaleString()}원
                                                </p>
                                            </td>

                                            {/* 상태 */}
                                            <td className="px-4 py-3">
                                                <span
                                                    className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap"
                                                    style={{ backgroundColor: meta.bg, color: meta.color }}
                                                >
                                                    <meta.icon className="size-2.5" />
                                                    {meta.label}
                                                </span>
                                            </td>

                                            {/* paymentKey */}
                                            <td className="px-4 py-3">
                                                <span
                                                    className="font-mono text-[10px] px-2 py-1 rounded-lg select-all cursor-text"
                                                    style={{ backgroundColor: "var(--toss-page-bg)", color: "var(--toss-text-tertiary)" }}
                                                    title={t.paymentKey}
                                                >
                                                    {t.paymentKey.slice(0, 20)}…
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* 하단 합계 */}
                {filtered.length > 0 && (
                    <div className="px-5 py-3 flex items-center justify-between"
                        style={{ borderTop: "1px solid var(--toss-border)" }}>
                        <p className="text-xs" style={{ color: "var(--toss-text-tertiary)" }}>
                            {filtered.length}건 표시 중
                        </p>
                        <p className="text-xs font-bold" style={{ color: "var(--toss-text-primary)" }}>
                            완료 합계&nbsp;
                            <span style={{ color: "var(--toss-blue)" }}>
                                {filtered.filter((t) => t.status === "DONE")
                                    .reduce((s, t) => s + t.amount, 0)
                                    .toLocaleString()}원
                            </span>
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
