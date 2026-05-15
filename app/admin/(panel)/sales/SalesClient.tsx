"use client"

import { useState, useTransition, useCallback, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Search, TrendingUp, ShoppingCart, Package, Truck, CheckCircle2, XCircle, Clock, BadgeCheck, PenLine, ArrowLeftRight, Undo2 } from "lucide-react"
import { updateOrderStatusAction, fetchOrdersPagedAction } from "./actions"
import type { OrderCounts } from "./actions"
import AdminPagination from "@/components/admin/AdminPagination"
import LoadingOverlay from "@/components/admin/LoadingOverlay"
import type { AdminOrder, OrderStatus } from "@/lib/supabase/orders"
import type { CancelRequestType, CancelRequestStatus } from "@/lib/supabase/cancelRequests"

const STATUS_META: Record<OrderStatus, { label: string; bg: string; color: string; icon: React.ElementType }> = {
    pending:   { label: "결제 대기", bg: "#FFF8E1", color: "#FFB800", icon: Clock },
    confirmed: { label: "주문 확인", bg: "#EBF3FF", color: "#0064FF", icon: ShoppingCart },
    shipping:  { label: "배송 중",   bg: "#F3E8FF", color: "#9333EA", icon: Truck },
    delivered: { label: "배송 완료", bg: "#E8F8F5", color: "#00A878", icon: CheckCircle2 },
    purchase_confirmed: { label: "구매 확정", bg: "#ECFDF5", color: "#059669", icon: BadgeCheck },
    review_written:     { label: "리뷰 작성", bg: "#FFF7ED", color: "#EA580C", icon: PenLine },
    cancelled:          { label: "취소됨",   bg: "#FFF0F0", color: "#FF4E4E", icon: XCircle },
}

const PAYMENT_LABEL: Record<string, string> = {
    card:     "카드",
    transfer: "계좌이체",
    kakaopay: "카카오페이",
    naverpay: "네이버페이",
    tosspay:  "토스페이",
}

const STATUS_FLOW: OrderStatus[] = ["pending", "confirmed", "shipping", "delivered", "purchase_confirmed", "review_written", "cancelled"]

const CANCEL_REQUEST_META: Record<CancelRequestType, { label: string; bg: string; color: string; icon: React.ElementType }> = {
    exchange: { label: "교환 신청", bg: "#F3E8FF", color: "#9333EA", icon: ArrowLeftRight },
    refund:   { label: "환불 신청", bg: "#EBF3FF", color: "#0064FF", icon: Undo2 },
}

const CANCEL_REQUEST_STATUS_STYLE: Record<CancelRequestStatus, { suffix: string; bg: string; color: string }> = {
    pending:  { suffix: "대기",   bg: "#FFF8E1", color: "#B07D00" },
    approved: { suffix: "승인",   bg: "#ECFDF5", color: "#059669" },
    rejected: { suffix: "거절",   bg: "#FFF0F0", color: "#FF4E4E" },
}

function formatDate(iso: string) {
    const d = new Date(iso)
    return d.toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
}

// KST 기준 "YYYY-MM-DD" 반환
function toKSTDateString(date: Date): string {
    return date.toLocaleDateString("ko-KR", {
        timeZone: "Asia/Seoul",
        year: "numeric", month: "2-digit", day: "2-digit",
    }).replace(/\. /g, "-").replace(/\.$/, "").replace(/ /g, "")
}

function getPresetRange(preset: "today" | "7d" | "1m" | "3m"): { start: string; end: string } {
    const now = new Date()
    const end = toKSTDateString(now)
    if (preset === "today") return { start: end, end }
    const start = new Date(now)
    if (preset === "7d") start.setDate(start.getDate() - 6)
    if (preset === "1m") start.setMonth(start.getMonth() - 1)
    if (preset === "3m") start.setMonth(start.getMonth() - 3)
    return { start: toKSTDateString(start), end }
}

function SummaryCard({
    label, value, sub, color, icon: Icon,
}: { label: string; value: string; sub?: string; color: string; icon: React.ElementType }) {
    return (
        <div className="bg-white rounded-2xl px-5 py-4 flex items-center gap-4" style={{ border: "1px solid var(--toss-border)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: color + "18" }}>
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

export default function SalesClient({ totalRevenue, totalRevenueCount }: {
    totalRevenue: number
    totalRevenueCount: number
}) {
    const searchParams = useSearchParams()
    const [items,    setItems]    = useState<AdminOrder[]>([])
    const [total,    setTotal]    = useState(0)
    const [counts,   setCounts]   = useState<OrderCounts>({ all: 0, pending: 0, confirmed: 0, shipping: 0, delivered: 0, purchase_confirmed: 0, review_written: 0, cancelled: 0 })
    const [page,     setPage]     = useState(1)
    const [pageSize, setPageSize] = useState(20)
    const [loading,  setLoading]  = useState(true)

    const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all")
    const [search,       setSearch]       = useState("")
    const [isPending,    startTransition] = useTransition()

    const defaultRange = getPresetRange("1m")
    const [inputStart,   setInputStart]   = useState(defaultRange.start)
    const [inputEnd,     setInputEnd]     = useState(defaultRange.end)
    const [activeStart,  setActiveStart]  = useState(defaultRange.start)
    const [activeEnd,    setActiveEnd]    = useState(defaultRange.end)

    useEffect(() => {
        const orderId     = searchParams.get("orderId")
        const searchParam = searchParams.get("search")
        if (orderId)       setSearch(orderId.slice(0, 8).toUpperCase())
        else if (searchParam) setSearch(searchParam)
    }, [searchParams])

    const load = useCallback(async () => {
        setLoading(true)
        const { items: rows, total: cnt, counts: c } = await fetchOrdersPagedAction(
            page, pageSize, statusFilter, search, activeStart || undefined, activeEnd || undefined
        )
        setItems(rows); setTotal(cnt); setCounts(c)
        setLoading(false)
    }, [page, pageSize, statusFilter, search, activeStart, activeEnd])

    useEffect(() => { load() }, [load])

    const handleFetch = () => {
        setActiveStart(inputStart)
        setActiveEnd(inputEnd)
        setPage(1)
    }
    const handleReset = () => {
        setInputStart(""); setInputEnd("")
        setActiveStart(""); setActiveEnd("")
        setPage(1)
    }
    const applyPreset = (preset: "today" | "7d" | "1m" | "3m") => {
        const { start, end } = getPresetRange(preset)
        setInputStart(start); setInputEnd(end)
        setActiveStart(start); setActiveEnd(end)
        setPage(1)
    }

    const handleStatusChange = (id: string, status: OrderStatus) => {
        startTransition(async () => {
            await updateOrderStatusAction(id, status)
            setItems((prev) => prev.map((o) => o.id === id ? { ...o, status } : o))
        })
    }

    const tabs: { key: OrderStatus | "all"; label: string; count: number }[] = [
        { key: "all",                label: "전체",    count: counts.all },
        { key: "pending",            label: "결제 대기", count: counts.pending },
        { key: "confirmed",          label: "주문 확인", count: counts.confirmed },
        { key: "shipping",           label: "배송 중",  count: counts.shipping },
        { key: "delivered",          label: "배송 완료", count: counts.delivered },
        { key: "purchase_confirmed", label: "구매 확정", count: counts.purchase_confirmed },
        { key: "review_written",     label: "리뷰 작성", count: counts.review_written },
        { key: "cancelled",          label: "취소",     count: counts.cancelled },
    ]

    return (
        <div className="p-7 space-y-6">
            <LoadingOverlay show={loading} label="조회 중..." />

            {/* 헤더 */}
            <div>
                <h1 className="text-xl font-black" style={{ color: "var(--toss-text-primary)", letterSpacing: "-0.03em" }}>주문 조회</h1>
                <p className="text-sm mt-0.5" style={{ color: "var(--toss-text-secondary)" }}>총 {total}건의 주문</p>
            </div>


            {/* 요약 카드 */}
            <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-3">
                <SummaryCard label="총 매출" value={`${(totalRevenue / 10000).toLocaleString()}만원`}
                    sub={`${totalRevenueCount}건 (결제 완료)`} color="#0064FF" icon={TrendingUp} />
                <SummaryCard label="결제 대기" value={`${counts.pending}건`}
                    color="#FFB800" icon={Clock} />
                <SummaryCard label="배송 중" value={`${counts.shipping}건`}
                    color="#9333EA" icon={Truck} />
                <SummaryCard label="배송 완료" value={`${counts.delivered}건`}
                    color="#00A878" icon={CheckCircle2} />
                <SummaryCard label="구매 확정" value={`${counts.purchase_confirmed}건`}
                    color="#059669" icon={BadgeCheck} />
                <SummaryCard label="리뷰 작성" value={`${counts.review_written}건`}
                    color="#EA580C" icon={PenLine} />
            </div>

            {/* 필터 + 검색 */}
            <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid var(--toss-border)" }}>

                {/* 1행: 조회 기간 + 검색창 + 조회/초기화 버튼 */}
                <div className="px-5 py-3 flex items-center gap-2 flex-wrap"
                    style={{ borderBottom: "1px solid var(--toss-border)" }}>

                    <span className="text-xs font-semibold flex-shrink-0" style={{ color: "var(--toss-text-secondary)" }}>조회 기간</span>

                    {/* 프리셋 */}
                    {(["today", "7d", "1m", "3m"] as const).map((p) => {
                        const label = { today: "오늘", "7d": "7일", "1m": "1개월", "3m": "3개월" }[p]
                        return (
                            <button
                                key={p}
                                onClick={() => applyPreset(p)}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors hover:opacity-80 flex-shrink-0"
                                style={{ backgroundColor: "var(--toss-page-bg)", border: "1px solid var(--toss-border)", color: "var(--toss-text-secondary)" }}
                            >
                                {label}
                            </button>
                        )
                    })}

                    <div className="w-px h-4 flex-shrink-0" style={{ backgroundColor: "var(--toss-border)" }} />

                    {/* 날짜 입력 */}
                    <input
                        type="date"
                        value={inputStart}
                        onChange={(e) => setInputStart(e.target.value)}
                        className="px-2.5 py-1 rounded-lg text-xs outline-none flex-shrink-0"
                        style={{ backgroundColor: "var(--toss-page-bg)", border: "1px solid var(--toss-border)", color: "var(--toss-text-primary)" }}
                    />
                    <span className="text-xs flex-shrink-0" style={{ color: "var(--toss-text-tertiary)" }}>~</span>
                    <input
                        type="date"
                        value={inputEnd}
                        onChange={(e) => setInputEnd(e.target.value)}
                        className="px-2.5 py-1 rounded-lg text-xs outline-none flex-shrink-0"
                        style={{ backgroundColor: "var(--toss-page-bg)", border: "1px solid var(--toss-border)", color: "var(--toss-text-primary)" }}
                    />

                    <div className="w-px h-4 flex-shrink-0" style={{ backgroundColor: "var(--toss-border)" }} />

                    {/* 검색창 */}
                    <div className="flex items-center gap-2 px-3 py-1 rounded-lg flex-1 min-w-[160px]"
                        style={{ backgroundColor: "var(--toss-page-bg)", border: "1px solid var(--toss-border)" }}>
                        <Search className="size-3.5 flex-shrink-0" style={{ color: "var(--toss-text-tertiary)" }} />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="이름, 주문번호, 상품 검색"
                            className="bg-transparent text-xs outline-none flex-1"
                            style={{ color: "var(--toss-text-primary)" }}
                        />
                    </div>

                    {/* 조회 버튼 */}
                    <button
                        onClick={handleFetch}
                        disabled={loading}
                        className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold text-white flex-shrink-0 transition-opacity disabled:opacity-60"
                        style={{ backgroundColor: "var(--toss-blue)" }}
                    >
                        <Search className="size-3" />
                        {loading ? "조회 중..." : "조회"}
                    </button>

                    {/* 초기화 버튼 */}
                    {(inputStart || inputEnd) && (
                        <button
                            onClick={handleReset}
                            disabled={loading}
                            className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold flex-shrink-0 transition-opacity disabled:opacity-60"
                            style={{ backgroundColor: "var(--toss-page-bg)", border: "1px solid var(--toss-border)", color: "var(--toss-text-tertiary)" }}
                        >
                            <XCircle className="size-3" />
                            초기화
                        </button>
                    )}
                </div>

                {/* 2행: 상태 탭 */}
                <div className="px-5 py-1">
                    <div className="flex gap-0.5 overflow-x-auto scrollbar-hide">
                        {tabs.map((t) => (
                            <button
                                key={t.key}
                                onClick={() => { setStatusFilter(t.key); setPage(1) }}
                                className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl transition-colors"
                                style={{
                                    backgroundColor: statusFilter === t.key ? "var(--toss-blue)" : "transparent",
                                    color: statusFilter === t.key ? "#fff" : "var(--toss-text-secondary)",
                                }}
                            >
                                {t.label}
                                <span
                                    className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                                    style={{
                                        backgroundColor: statusFilter === t.key ? "rgba(255,255,255,0.25)" : "var(--toss-page-bg)",
                                        color: statusFilter === t.key ? "#fff" : "var(--toss-text-tertiary)",
                                    }}
                                >
                                    {t.count}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 테이블 */}
                <div className="overflow-x-auto" style={{ borderTop: "1px solid var(--toss-border)" }}>
                    {items.length === 0 && !loading ? (
                        <div className="py-16 text-center text-sm" style={{ color: "var(--toss-text-tertiary)" }}>
                            <Package className="size-10 mx-auto mb-3 opacity-30" />
                            조건에 맞는 주문이 없습니다
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr style={{ borderTop: "1px solid var(--toss-border)", borderBottom: "1px solid var(--toss-border)" }}>
                                    {["주문번호", "받는 분", "주문 상품", "결제금액", "결제수단", "주문 상태", "교환/환불", "처리 상태", "주문일시"].map((h) => (
                                        <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold whitespace-nowrap"
                                            style={{ color: "var(--toss-text-tertiary)", backgroundColor: "var(--toss-page-bg)" }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((o, i) => {
                                    const meta = STATUS_META[o.status]
                                    return (
                                        <tr
                                            key={o.id}
                                            className="hover:bg-gray-50 transition-colors"
                                            style={{ borderBottom: i < items.length - 1 ? "1px solid var(--toss-border)" : undefined }}
                                        >
                                            {/* 주문번호 */}
                                            <td className="px-4 py-3">
                                                <span className="font-mono text-xs font-semibold" style={{ color: "var(--toss-text-secondary)" }}>
                                                    {o.id.slice(0, 8).toUpperCase()}
                                                </span>
                                            </td>

                                            {/* 받는 분 */}
                                            <td className="px-4 py-3">
                                                <p className="text-xs font-semibold" style={{ color: "var(--toss-text-primary)" }}>{o.recipientName}</p>
                                                <p className="text-[11px]" style={{ color: "var(--toss-text-tertiary)" }}>{o.phone}</p>
                                            </td>

                                            {/* 상품 */}
                                            <td className="px-4 py-3 max-w-[180px]">
                                                <p className="text-xs truncate" style={{ color: "var(--toss-text-secondary)" }}>{o.itemsSummary}</p>
                                            </td>

                                            {/* 결제금액 */}
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <p className="text-xs font-black" style={{ color: "var(--toss-text-primary)" }}>
                                                    {o.totalPrice.toLocaleString()}원
                                                </p>
                                                {o.shippingFee === 0 && (
                                                    <p className="text-[10px]" style={{ color: "var(--toss-blue)" }}>무료배송</p>
                                                )}
                                            </td>

                                            {/* 결제수단 */}
                                            <td className="px-4 py-3">
                                                <span className="text-[11px]" style={{ color: "var(--toss-text-secondary)" }}>
                                                    {PAYMENT_LABEL[o.paymentMethod] ?? o.paymentMethod}
                                                </span>
                                            </td>

                                            {/* 주문 상태 변경 */}
                                            <td className="px-4 py-3">
                                                <select
                                                    value={o.status}
                                                    disabled={isPending || o.cancelRequest?.status === "pending" || o.status === "cancelled" || o.status === "pending"}
                                                    title={
                                                        o.cancelRequest?.status === "pending" ? "교환/환불 신청 처리 후 변경할 수 있습니다." :
                                                        o.status === "cancelled" ? "취소된 주문은 상태를 변경할 수 없습니다." :
                                                        o.status === "pending"   ? "결제 대기 중인 주문은 상태를 변경할 수 없습니다." :
                                                        undefined
                                                    }
                                                    onChange={(e) => handleStatusChange(o.id, e.target.value as OrderStatus)}
                                                    className="text-[11px] font-bold px-2 py-1 rounded-lg outline-none transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                                                    style={{ backgroundColor: meta.bg, color: meta.color, border: "none", cursor: (o.status === "cancelled" || o.status === "pending" || o.cancelRequest?.status === "pending") ? "not-allowed" : "pointer" }}
                                                >
                                                    {STATUS_FLOW.map((s) => (
                                                        <option key={s} value={s}>{STATUS_META[s].label}</option>
                                                    ))}
                                                </select>
                                            </td>

                                            {/* 교환/환불 신청 유형 */}
                                            <td className="px-4 py-3">
                                                {o.cancelRequest ? (() => {
                                                    const typeMeta = CANCEL_REQUEST_META[o.cancelRequest.type]
                                                    const Icon     = typeMeta.icon
                                                    return (
                                                        <a
                                                            href={`/admin/sales/cancel-requests?orderId=${o.id}`}
                                                            className="flex items-center gap-1.5 w-fit px-2.5 py-1.5 rounded-xl hover:opacity-80 transition-opacity"
                                                            style={{ backgroundColor: typeMeta.bg }}
                                                        >
                                                            <Icon className="size-3.5 flex-shrink-0" style={{ color: typeMeta.color }} />
                                                            <span className="text-[11px] font-bold whitespace-nowrap" style={{ color: typeMeta.color }}>
                                                                {typeMeta.label}
                                                            </span>
                                                        </a>
                                                    )
                                                })() : (
                                                    <span className="text-[11px]" style={{ color: "var(--toss-text-tertiary)" }}>—</span>
                                                )}
                                            </td>

                                            {/* 처리 상태 */}
                                            <td className="px-4 py-3">
                                                {o.cancelRequest ? (() => {
                                                    const statusStyle = CANCEL_REQUEST_STATUS_STYLE[o.cancelRequest.status]
                                                    return (
                                                        <span
                                                            className="inline-flex items-center text-[11px] font-bold px-2.5 py-1.5 rounded-xl whitespace-nowrap"
                                                            style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}
                                                        >
                                                            {statusStyle.suffix}
                                                        </span>
                                                    )
                                                })() : (
                                                    <span className="text-[11px]" style={{ color: "var(--toss-text-tertiary)" }}>—</span>
                                                )}
                                            </td>

                                            {/* 주문일시 */}
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className="text-[11px]" style={{ color: "var(--toss-text-tertiary)" }}>
                                                    {formatDate(o.createdAt)}
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* 헤더: 전체 건수 */}
                {total > 0 && (
                    <div className="px-5 py-3 flex items-center justify-between" style={{ borderTop: "1px solid var(--toss-border)" }}>
                        <p className="text-xs" style={{ color: "var(--toss-text-tertiary)" }}>
                            총 {total}건 중 {items.length}건 표시
                        </p>
                        <p className="text-xs font-bold" style={{ color: "var(--toss-text-primary)" }}>
                            주문확인 합계 {items.filter((o) => o.status === "confirmed").reduce((s, o) => s + o.totalPrice, 0).toLocaleString()}원
                        </p>
                    </div>
                )}
            </div>

            {/* 페이지네이션 */}
            <AdminPagination
                page={page}
                pageSize={pageSize}
                total={total}
                pageSizeId="select-sales-pagesize"
                onPageChange={(p) => setPage(p)}
                onSizeChange={(s) => { setPageSize(s); setPage(1) }}
            />
        </div>
    )
}
