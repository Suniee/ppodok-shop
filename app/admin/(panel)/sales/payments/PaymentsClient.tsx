"use client"

import { useState, useTransition, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
    CreditCard, CheckCircle2, XCircle, Clock,
    TrendingUp, Search, ExternalLink, RefreshCw,
} from "lucide-react"
import { syncMissingPaymentsAction, fetchPaymentsPagedAction } from "./actions"
import type { PaymentStats } from "./actions"
import AdminPagination from "@/components/admin/AdminPagination"
import LoadingOverlay from "@/components/admin/LoadingOverlay"

type AdminPayment = {
    id: string; orderId: string; paymentKey: string; orderName: string
    method: string; provider: string | null; amount: number; status: string
    requestedAt: string | null; approvedAt: string | null; createdAt: string
}

function toKSTDateString(date: Date): string {
    return new Date(date.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

function getPresetRange(preset: "today" | "7d" | "1month" | "3month"): { start: string; end: string } {
    const now = new Date()
    const end = toKSTDateString(now)
    if (preset === "today") return { start: end, end }
    const from = new Date(now)
    if (preset === "7d")     from.setDate(from.getDate() - 6)
    if (preset === "1month") from.setMonth(from.getMonth() - 1)
    if (preset === "3month") from.setMonth(from.getMonth() - 3)
    return { start: toKSTDateString(from), end }
}

const PRESETS: { key: "today" | "7d" | "1month" | "3month"; label: string }[] = [
    { key: "today",  label: "오늘" },
    { key: "7d",     label: "7일" },
    { key: "1month", label: "1개월" },
    { key: "3month", label: "3개월" },
]

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

export default function PaymentsClient() {
    const router = useRouter()
    const defaultRange = getPresetRange("1month")
    const [items,    setItems]    = useState<AdminPayment[]>([])
    const [total,    setTotal]    = useState(0)
    const [stats,    setStats]    = useState<PaymentStats>({ doneAmount: 0, doneCount: 0, cancelCount: 0, cancelAmount: 0, totalCount: 0 })
    const [page,     setPage]     = useState(1)
    const [pageSize, setPageSize] = useState(20)
    const [loading,  setLoading]  = useState(true)

    const [inputStart,  setInputStart]  = useState(defaultRange.start)
    const [inputEnd,    setInputEnd]    = useState(defaultRange.end)
    const [activeStart, setActiveStart] = useState<string | null>(defaultRange.start)
    const [activeEnd,   setActiveEnd]   = useState<string | null>(defaultRange.end)
    const [search,      setSearch]      = useState("")
    const [isSyncing,   startSync]      = useTransition()
    const [syncResult,  setSyncResult]  = useState<{ synced: number; skipped: number; errors: string[] } | null>(null)

    const load = useCallback(async () => {
        setLoading(true)
        const result = await fetchPaymentsPagedAction(
            page, pageSize,
            activeStart ?? undefined,
            activeEnd   ?? undefined,
            search || undefined,
        )
        setItems(result.items)
        setTotal(result.total)
        setStats(result.stats)
        setLoading(false)
    }, [page, pageSize, activeStart, activeEnd, search])

    useEffect(() => { load() }, [load])

    const handleSync = () => {
        startSync(async () => {
            const result = await syncMissingPaymentsAction()
            setSyncResult(result)
            if (result.synced > 0) { router.refresh(); load() }
        })
    }

    const handleFetch = () => {
        setActiveStart(inputStart)
        setActiveEnd(inputEnd)
        setPage(1)
    }

    const handleReset = () => {
        const range = getPresetRange("1month")
        setInputStart(range.start); setInputEnd(range.end)
        setActiveStart(null); setActiveEnd(null)
        setPage(1)
    }

    const applyPreset = (preset: "today" | "7d" | "1month" | "3month") => {
        const range = getPresetRange(preset)
        setInputStart(range.start); setInputEnd(range.end)
        setActiveStart(range.start); setActiveEnd(range.end)
        setPage(1)
    }

    const showReset = activeStart !== null || activeEnd !== null

    return (
        <div className="p-7 space-y-6">
            <LoadingOverlay show={loading} label="조회 중..." />

            {/* 헤더 */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-xl font-black" style={{ color: "var(--toss-text-primary)", letterSpacing: "-0.03em" }}>
                        결제 내역
                    </h1>
                    <p className="text-sm mt-0.5" style={{ color: "var(--toss-text-secondary)" }}>
                        전체 {stats.totalCount}건
                    </p>
                </div>
                {/* 누락 결제 동기화는 헤더에 유지 */}
                <button
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
                    style={{
                        backgroundColor: isSyncing ? "var(--toss-page-bg)" : "var(--toss-blue)",
                        color: isSyncing ? "var(--toss-text-tertiary)" : "#fff",
                        border: "1px solid var(--toss-border)",
                    }}
                    title="payments 테이블에 없는 완료 주문을 Toss API로 역조회해 저장합니다"
                >
                    <RefreshCw className={`size-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                    {isSyncing ? "동기화 중…" : "누락 결제 동기화"}
                </button>
            </div>

            {/* 동기화 결과 토스트 */}
            {syncResult && (
                <div
                    className="px-4 py-3 rounded-xl text-xs flex items-center justify-between gap-4"
                    style={{
                        backgroundColor: syncResult.errors.length > 0 ? "#FFF0F0" : "#E8F8F5",
                        border: `1px solid ${syncResult.errors.length > 0 ? "#FFCDD2" : "#B2EFE1"}`,
                        color: syncResult.errors.length > 0 ? "#FF4E4E" : "#00A878",
                    }}
                >
                    <span>
                        {syncResult.synced > 0
                            ? `✅ ${syncResult.synced}건 새로 저장됨`
                            : "이미 모두 동기화된 상태입니다."}
                        {syncResult.skipped > 0 && ` · ${syncResult.skipped}건 Toss 조회 불가`}
                        {syncResult.errors.length > 0 && ` · 오류: ${syncResult.errors.join(", ")}`}
                    </span>
                    <button onClick={() => setSyncResult(null)} className="opacity-60 hover:opacity-100 text-base leading-none">×</button>
                </div>
            )}

            {/* 요약 카드 */}
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
                <SummaryCard
                    label="결제 완료 금액"
                    value={`${(stats.doneAmount / 10000).toLocaleString()}만원`}
                    sub={`${stats.doneCount}건`}
                    color="#00A878" icon={TrendingUp}
                />
                <SummaryCard
                    label="전체 건수"
                    value={`${stats.totalCount}건`}
                    color="#0064FF" icon={CreditCard}
                />
                <SummaryCard
                    label="취소/부분취소"
                    value={`${stats.cancelCount}건`}
                    sub={stats.cancelCount > 0 ? `${stats.cancelAmount.toLocaleString()}원` : undefined}
                    color="#FF4E4E" icon={XCircle}
                />
            </div>

            {/* 거래 목록 테이블 */}
            <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid var(--toss-border)" }}>
                {/* Row 1: 조회 조건 */}
                <div className="px-5 py-3 flex items-center gap-3 flex-wrap"
                    style={{ borderBottom: "1px solid var(--toss-border)" }}>
                    <span className="text-xs font-semibold flex-shrink-0"
                        style={{ color: "var(--toss-text-secondary)" }}>
                        조회기간
                    </span>
                    <div className="flex gap-1">
                        {PRESETS.map((p) => (
                            <button
                                key={p.key}
                                onClick={() => applyPreset(p.key)}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors"
                                style={{
                                    backgroundColor: "var(--toss-page-bg)",
                                    color: "var(--toss-text-secondary)",
                                    border: "1px solid var(--toss-border)",
                                }}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                    <div className="h-4 w-px flex-shrink-0" style={{ backgroundColor: "var(--toss-border)" }} />
                    <div className="flex items-center gap-1.5">
                        <input
                            type="date"
                            value={inputStart}
                            max={inputEnd}
                            onChange={(e) => setInputStart(e.target.value)}
                            className="text-xs outline-none bg-transparent"
                            style={{ color: "var(--toss-text-primary)" }}
                        />
                        <span className="text-xs" style={{ color: "var(--toss-text-tertiary)" }}>~</span>
                        <input
                            type="date"
                            value={inputEnd}
                            min={inputStart}
                            onChange={(e) => setInputEnd(e.target.value)}
                            className="text-xs outline-none bg-transparent"
                            style={{ color: "var(--toss-text-primary)" }}
                        />
                    </div>
                    <div className="h-4 w-px flex-shrink-0" style={{ backgroundColor: "var(--toss-border)" }} />
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl flex-1 min-w-[180px]"
                        style={{ backgroundColor: "var(--toss-page-bg)", border: "1px solid var(--toss-border)" }}>
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
                    <button
                        onClick={handleFetch}
                        className="flex-shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-85"
                        style={{ backgroundColor: "var(--toss-blue)" }}
                    >
                        조회
                    </button>
                    {showReset && (
                        <button
                            onClick={handleReset}
                            className="flex-shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors"
                            style={{
                                backgroundColor: "var(--toss-page-bg)",
                                color: "var(--toss-text-secondary)",
                                border: "1px solid var(--toss-border)",
                            }}
                        >
                            초기화
                        </button>
                    )}
                </div>

                <div className="overflow-x-auto scrollbar-hide">
                    {items.length === 0 && !loading ? (
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
                                {items.map((p, i) => {
                                    const meta = STATUS_META[p.status] ?? {
                                        label: p.status, bg: "#F2F4F6", color: "#8B95A1", icon: Clock,
                                    }
                                    const methodIcon = METHOD_ICON[p.method] ?? "💳"
                                    return (
                                        <tr key={p.id}
                                            className="hover:bg-gray-50 transition-colors"
                                            style={{ borderBottom: i < items.length - 1 ? "1px solid var(--toss-border)" : undefined }}>

                                            {/* 승인 시각 */}
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className="text-[11px]" style={{ color: "var(--toss-text-tertiary)" }}>
                                                    {formatDateTime(p.approvedAt ?? p.requestedAt)}
                                                </span>
                                            </td>

                                            {/* 주문번호 → 주문조회 링크 */}
                                            <td className="px-4 py-3">
                                                <a
                                                    href={`/admin/sales?search=${p.orderId.slice(0, 8)}`}
                                                    className="flex items-center gap-1 font-mono text-xs font-semibold hover:underline"
                                                    style={{ color: "var(--toss-blue)" }}
                                                    title="주문 조회에서 보기"
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
                {total > 0 && (
                    <div className="px-5 py-3 flex items-center justify-between"
                        style={{ borderTop: "1px solid var(--toss-border)" }}>
                        <p className="text-xs" style={{ color: "var(--toss-text-tertiary)" }}>
                            총 {total}건 중 {items.length}건 표시
                        </p>
                        <p className="text-xs font-bold" style={{ color: "var(--toss-text-primary)" }}>
                            완료 합계&nbsp;
                            <span style={{ color: "var(--toss-blue)" }}>
                                {stats.doneAmount.toLocaleString()}원
                            </span>
                        </p>
                    </div>
                )}
            </div>

            {/* 페이지네이션 */}
            <AdminPagination
                page={page}
                pageSize={pageSize}
                total={total}
                pageSizeId="select-payments-pagesize"
                onPageChange={(p) => setPage(p)}
                onSizeChange={(s) => { setPageSize(s); setPage(1) }}
            />
        </div>
    )
}
