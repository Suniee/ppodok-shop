"use client"

import { useState } from "react"
import {
    CreditCard, CheckCircle2, XCircle, Clock,
    TrendingUp, Search, ExternalLink,
} from "lucide-react"
import type { AdminPayment } from "@/lib/supabase/payments"

const STATUS_META: Record<string, { label: string; bg: string; color: string; icon: React.ElementType }> = {
    DONE:                { label: "결제 완료", bg: "#E8F8F5", color: "#00A878", icon: CheckCircle2 },
    CANCELED:            { label: "취소",      bg: "#FFF0F0", color: "#FF4E4E", icon: XCircle },
    PARTIAL_CANCELED:    { label: "부분 취소", bg: "#FFF0F0", color: "#FF4E4E", icon: XCircle },
    WAITING_FOR_DEPOSIT: { label: "입금 대기", bg: "#FFF8E1", color: "#FFB800", icon: Clock },
    IN_PROGRESS:         { label: "처리 중",   bg: "#EBF3FF", color: "#0064FF", icon: Clock },
}

const METHOD_ICON: Record<string, string> = {
    "카드": "💳", "계좌이체": "🏦", "가상계좌": "🏦", "휴대폰": "📱", "간편결제": "⚡",
}

function formatDateTime(iso: string | null) {
    if (!iso) return "-"
    return new Date(iso).toLocaleString("ko-KR", {
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit",
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

export default function PaymentsClient({ payments }: { payments: AdminPayment[] }) {
    const [search, setSearch] = useState("")

    const filtered = payments.filter((p) => {
        const q = search.trim().toLowerCase()
        return !q
            || p.orderId.toLowerCase().includes(q)
            || p.orderName.toLowerCase().includes(q)
            || p.paymentKey.toLowerCase().includes(q)
    })

    const doneList      = payments.filter((p) => p.status === "DONE")
    const cancelledList = payments.filter((p) => p.status.includes("CANCELED"))
    const totalAmount   = doneList.reduce((s, p) => s + p.amount, 0)

    return (
        <div className="p-7 space-y-6">
            {/* 헤더 */}
            <div>
                <h1 className="text-xl font-black" style={{ color: "var(--toss-text-primary)", letterSpacing: "-0.03em" }}>
                    결제 내역
                </h1>
                <p className="text-sm mt-0.5" style={{ color: "var(--toss-text-secondary)" }}>
                    총 {payments.length}건
                </p>
            </div>

            {/* 요약 카드 */}
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
                <SummaryCard
                    label="결제 완료 금액"
                    value={`${(totalAmount / 10000).toLocaleString()}만원`}
                    sub={`${doneList.length}건`}
                    color="#00A878" icon={TrendingUp}
                />
                <SummaryCard
                    label="전체 건수"
                    value={`${payments.length}건`}
                    color="#0064FF" icon={CreditCard}
                />
                <SummaryCard
                    label="취소/부분취소"
                    value={`${cancelledList.length}건`}
                    sub={cancelledList.length > 0
                        ? `${cancelledList.reduce((s, p) => s + p.amount, 0).toLocaleString()}원`
                        : undefined}
                    color="#FF4E4E" icon={XCircle}
                />
            </div>

            {/* 검색 + 테이블 */}
            <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid var(--toss-border)" }}>
                <div className="px-5 py-4 flex items-center justify-between gap-3"
                    style={{ borderBottom: "1px solid var(--toss-border)" }}>
                    <p className="text-sm font-bold" style={{ color: "var(--toss-text-primary)" }}>
                        거래 목록
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

                <div className="overflow-x-auto scrollbar-hide">
                    {filtered.length === 0 ? (
                        <div className="py-16 text-center" style={{ color: "var(--toss-text-tertiary)" }}>
                            <CreditCard className="size-10 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">결제 내역이 없습니다</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr style={{ borderBottom: "1px solid var(--toss-border)" }}>
                                    {["승인 시각", "주문번호", "주문명", "결제 수단", "금액", "상태", "paymentKey"].map((h) => (
                                        <th key={h}
                                            className="px-4 py-3 text-left text-[11px] font-semibold whitespace-nowrap"
                                            style={{ color: "var(--toss-text-tertiary)", backgroundColor: "var(--toss-page-bg)" }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((p, i) => {
                                    const meta = STATUS_META[p.status] ?? {
                                        label: p.status, bg: "#F2F4F6", color: "#8B95A1", icon: Clock,
                                    }
                                    const methodIcon = METHOD_ICON[p.method] ?? "💳"
                                    return (
                                        <tr key={p.id}
                                            className="hover:bg-gray-50 transition-colors"
                                            style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--toss-border)" : undefined }}>

                                            {/* 승인 시각 */}
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className="text-[11px]" style={{ color: "var(--toss-text-tertiary)" }}>
                                                    {formatDateTime(p.approvedAt ?? p.requestedAt)}
                                                </span>
                                            </td>

                                            {/* 주문번호 → 매출관리 링크 */}
                                            <td className="px-4 py-3">
                                                <a
                                                    href={`/admin/sales?search=${p.orderId.slice(0, 8)}`}
                                                    className="flex items-center gap-1 font-mono text-xs font-semibold hover:underline"
                                                    style={{ color: "var(--toss-blue)" }}
                                                    title="매출 관리에서 보기"
                                                >
                                                    {p.orderId.slice(0, 8).toUpperCase()}
                                                    <ExternalLink className="size-2.5 opacity-60" />
                                                </a>
                                            </td>

                                            {/* 주문명 */}
                                            <td className="px-4 py-3 max-w-[160px]">
                                                <p className="text-xs truncate" style={{ color: "var(--toss-text-secondary)" }}>
                                                    {p.orderName}
                                                </p>
                                            </td>

                                            {/* 결제 수단 */}
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className="text-xs" style={{ color: "var(--toss-text-secondary)" }}>
                                                    {methodIcon} {p.method}
                                                    {p.provider && (
                                                        <span className="ml-1 text-[10px]" style={{ color: "var(--toss-text-tertiary)" }}>
                                                            ({p.provider})
                                                        </span>
                                                    )}
                                                </span>
                                            </td>

                                            {/* 금액 */}
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <p className="text-xs font-black" style={{ color: "var(--toss-text-primary)" }}>
                                                    {p.amount.toLocaleString()}원
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
                                                    title={p.paymentKey}
                                                >
                                                    {p.paymentKey.slice(0, 20)}…
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
                                {filtered
                                    .filter((p) => p.status === "DONE")
                                    .reduce((s, p) => s + p.amount, 0)
                                    .toLocaleString()}원
                            </span>
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
