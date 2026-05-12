"use client"

import { useState, useTransition, useMemo } from "react"
import { Search, TrendingUp, ShoppingCart, Package, Truck, CheckCircle2, XCircle, Clock } from "lucide-react"
import { updateOrderStatusAction } from "./actions"
import type { AdminOrder, OrderStatus } from "@/lib/supabase/orders"

const STATUS_META: Record<OrderStatus, { label: string; bg: string; color: string; icon: React.ElementType }> = {
    pending:   { label: "결제 대기", bg: "#FFF8E1", color: "#FFB800", icon: Clock },
    confirmed: { label: "주문 확인", bg: "#EBF3FF", color: "#0064FF", icon: ShoppingCart },
    shipping:  { label: "배송 중",   bg: "#F3E8FF", color: "#9333EA", icon: Truck },
    delivered: { label: "배송 완료", bg: "#E8F8F5", color: "#00A878", icon: CheckCircle2 },
    cancelled: { label: "취소됨",   bg: "#FFF0F0", color: "#FF4E4E", icon: XCircle },
}

const PAYMENT_LABEL: Record<string, string> = {
    card:     "카드",
    transfer: "계좌이체",
    kakaopay: "카카오페이",
    naverpay: "네이버페이",
    tosspay:  "토스페이",
}

const STATUS_FLOW: OrderStatus[] = ["pending", "confirmed", "shipping", "delivered", "cancelled"]

function formatDate(iso: string) {
    const d = new Date(iso)
    return d.toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
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

export default function SalesClient({ orders: initial }: { orders: AdminOrder[] }) {
    const [orders, setOrders] = useState<AdminOrder[]>(initial)
    const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all")
    const [search, setSearch] = useState("")
    const [isPending, startTransition] = useTransition()

    // 필터링
    const filtered = useMemo(() => {
        return orders.filter((o) => {
            const matchStatus = statusFilter === "all" || o.status === statusFilter
            const q = search.trim().toLowerCase()
            const matchSearch = !q
                || o.recipientName.toLowerCase().includes(q)
                || o.id.toLowerCase().includes(q)
                || o.itemsSummary.toLowerCase().includes(q)
            return matchStatus && matchSearch
        })
    }, [orders, statusFilter, search])

    // 요약 통계
    const stats = useMemo(() => {
        const total = orders.reduce((s, o) => s + o.totalPrice, 0)
        const counts = Object.fromEntries(
            STATUS_FLOW.map((s) => [s, orders.filter((o) => o.status === s).length])
        ) as Record<OrderStatus, number>
        return { total, counts, totalCount: orders.length }
    }, [orders])

    // 상태 변경
    const handleStatusChange = (id: string, status: OrderStatus) => {
        startTransition(async () => {
            await updateOrderStatusAction(id, status)
            setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o))
        })
    }

    const tabs: { key: OrderStatus | "all"; label: string; count: number }[] = [
        { key: "all",       label: "전체",    count: orders.length },
        { key: "pending",   label: "결제 대기", count: stats.counts.pending },
        { key: "confirmed", label: "주문 확인", count: stats.counts.confirmed },
        { key: "shipping",  label: "배송 중",  count: stats.counts.shipping },
        { key: "delivered", label: "배송 완료", count: stats.counts.delivered },
        { key: "cancelled", label: "취소",     count: stats.counts.cancelled },
    ]

    return (
        <div className="p-7 space-y-6">
            {/* 헤더 */}
            <div>
                <h1 className="text-xl font-black" style={{ color: "var(--toss-text-primary)", letterSpacing: "-0.03em" }}>매출 관리</h1>
                <p className="text-sm mt-0.5" style={{ color: "var(--toss-text-secondary)" }}>총 {orders.length}건의 주문</p>
            </div>

            {/* 요약 카드 */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                <SummaryCard label="총 매출" value={`${(stats.total / 10000).toLocaleString()}만원`}
                    sub={`${stats.totalCount}건`} color="#0064FF" icon={TrendingUp} />
                <SummaryCard label="결제 대기" value={`${stats.counts.pending}건`}
                    color="#FFB800" icon={Clock} />
                <SummaryCard label="배송 중" value={`${stats.counts.shipping}건`}
                    color="#9333EA" icon={Truck} />
                <SummaryCard label="배송 완료" value={`${stats.counts.delivered}건`}
                    color="#00A878" icon={CheckCircle2} />
            </div>

            {/* 필터 + 검색 */}
            <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid var(--toss-border)" }}>
                <div className="px-5 pt-4 pb-0 flex items-center justify-between gap-4 flex-wrap">
                    {/* 상태 탭 */}
                    <div className="flex gap-0.5 overflow-x-auto">
                        {tabs.map((t) => (
                            <button
                                key={t.key}
                                onClick={() => setStatusFilter(t.key)}
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

                    {/* 검색 */}
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-1"
                        style={{ backgroundColor: "var(--toss-page-bg)", border: "1px solid var(--toss-border)", minWidth: 220 }}>
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
                </div>

                {/* 테이블 */}
                <div className="overflow-x-auto">
                    {filtered.length === 0 ? (
                        <div className="py-16 text-center text-sm" style={{ color: "var(--toss-text-tertiary)" }}>
                            <Package className="size-10 mx-auto mb-3 opacity-30" />
                            조건에 맞는 주문이 없습니다
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr style={{ borderTop: "1px solid var(--toss-border)", borderBottom: "1px solid var(--toss-border)" }}>
                                    {["주문번호", "받는 분", "주문 상품", "결제금액", "결제수단", "상태", "주문일시"].map((h) => (
                                        <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold whitespace-nowrap"
                                            style={{ color: "var(--toss-text-tertiary)", backgroundColor: "var(--toss-page-bg)" }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((o, i) => {
                                    const meta = STATUS_META[o.status]
                                    return (
                                        <tr
                                            key={o.id}
                                            className="hover:bg-gray-50 transition-colors"
                                            style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--toss-border)" : undefined }}
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

                                            {/* 상태 변경 */}
                                            <td className="px-4 py-3">
                                                <select
                                                    value={o.status}
                                                    disabled={isPending}
                                                    onChange={(e) => handleStatusChange(o.id, e.target.value as OrderStatus)}
                                                    className="text-[11px] font-bold px-2 py-1 rounded-lg cursor-pointer outline-none transition-opacity disabled:opacity-50"
                                                    style={{ backgroundColor: meta.bg, color: meta.color, border: "none" }}
                                                >
                                                    {STATUS_FLOW.map((s) => (
                                                        <option key={s} value={s}>{STATUS_META[s].label}</option>
                                                    ))}
                                                </select>
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

                {/* 하단 요약 */}
                {filtered.length > 0 && (
                    <div className="px-5 py-3 flex items-center justify-between" style={{ borderTop: "1px solid var(--toss-border)" }}>
                        <p className="text-xs" style={{ color: "var(--toss-text-tertiary)" }}>
                            {filtered.length}건 표시 중
                        </p>
                        <p className="text-xs font-bold" style={{ color: "var(--toss-text-primary)" }}>
                            합계 {filtered.reduce((s, o) => s + o.totalPrice, 0).toLocaleString()}원
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
