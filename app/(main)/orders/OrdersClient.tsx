"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, MapPin, CreditCard, Package } from "lucide-react"
import type { Order, OrderStatus } from "@/lib/supabase/orders"
import { ORDER_STATUS_LABEL } from "@/lib/supabase/orders"

const STATUS_STYLE: Record<OrderStatus, { bg: string; color: string }> = {
    pending:            { bg: "#FFF8E1", color: "#FFB800" },
    confirmed:          { bg: "#EBF3FF", color: "#0064FF" },
    shipping:           { bg: "#F3E8FF", color: "#9333EA" },
    delivered:          { bg: "#E8F8F5", color: "#00A878" },
    purchase_confirmed: { bg: "#ECFDF5", color: "#059669" },
    review_written:     { bg: "#FFF7ED", color: "#EA580C" },
    cancelled:          { bg: "#FFF0F0", color: "#FF4E4E" },
}

const PAYMENT_LABEL: Record<string, string> = {
    card:     "신용카드/체크카드",
    transfer: "계좌이체",
    kakaopay: "카카오페이",
    naverpay: "네이버페이",
    tosspay:  "토스페이",
}

type Tab = "all" | "confirmed" | "shipping" | "delivered" | "cancelled"

// 결제대기(pending)는 사용자에게 노출하지 않음
const VISIBLE_STATUSES: OrderStatus[] = ["confirmed", "shipping", "delivered", "purchase_confirmed", "review_written", "cancelled"]
// 배송완료 탭: 배송 완료 이후 모든 단계 포함
const DELIVERED_STATUSES: OrderStatus[] = ["delivered", "purchase_confirmed", "review_written"]

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("ko-KR", {
        year: "numeric", month: "long", day: "numeric",
    })
}

function OrderCard({ order }: { order: Order }) {
    const [expanded, setExpanded] = useState(false)
    const statusStyle = STATUS_STYLE[order.status]
    const shortId = order.id.slice(0, 8).toUpperCase()

    return (
        <div
            data-ui-id={`card-order-${shortId}`}
            className="bg-white rounded-3xl overflow-hidden shadow-sm"
            style={{ border: "1px solid var(--toss-border)" }}
        >
            {/* 상단: 날짜 + 주문번호 + 상태 */}
            <div
                className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: "1px solid var(--toss-border)" }}
            >
                <div>
                    <p className="text-xs" style={{ color: "var(--toss-text-tertiary)" }}>
                        {formatDate(order.createdAt)}
                    </p>
                    <p className="text-xs font-mono font-semibold mt-0.5" style={{ color: "var(--toss-text-secondary)" }}>
                        주문번호 {shortId}
                    </p>
                </div>
                <span
                    className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}
                >
                    {ORDER_STATUS_LABEL[order.status]}
                </span>
            </div>

            {/* 상품 목록 */}
            <ul className="px-5 py-4 space-y-3">
                {order.items.map((item) => (
                    <li key={item.id} className="flex items-center gap-3">
                        <div
                            className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden text-xl"
                            style={{ backgroundColor: "var(--toss-page-bg)" }}
                        >
                            {item.imageUrl
                                ? <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                                : item.emoji
                            }
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold line-clamp-1" style={{ color: "var(--toss-text-primary)" }}>
                                {item.productName}
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: "var(--toss-text-tertiary)" }}>
                                {item.quantity}개
                            </p>
                        </div>
                        <p className="text-sm font-bold flex-shrink-0" style={{ color: "var(--toss-text-primary)" }}>
                            {(item.price * item.quantity).toLocaleString()}원
                        </p>
                    </li>
                ))}
            </ul>

            {/* 결제 금액 */}
            <div
                className="px-5 py-3 flex items-center justify-between"
                style={{ borderTop: "1px solid var(--toss-border)" }}
            >
                <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: "var(--toss-text-tertiary)" }}>
                        {PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod}
                    </span>
                    {order.shippingFee === 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ backgroundColor: "#EBF3FF", color: "var(--toss-blue)" }}>
                            무료배송
                        </span>
                    )}
                </div>
                <p className="text-base font-black" style={{ color: "var(--toss-blue)" }}>
                    {order.totalPrice.toLocaleString()}원
                </p>
            </div>

            {/* 펼치기 토글 */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-center gap-1 py-2.5 text-xs font-medium transition-colors hover:bg-gray-50"
                style={{ borderTop: "1px solid var(--toss-border)", color: "var(--toss-text-tertiary)" }}
            >
                {expanded ? "접기" : "배송지 · 상세 보기"}
                {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            </button>

            {/* 상세 정보 */}
            {expanded && (
                <div className="px-5 pb-5 space-y-4" style={{ borderTop: "1px solid var(--toss-border)" }}>
                    <div className="flex items-start gap-3 pt-4">
                        <MapPin className="size-4 mt-0.5 flex-shrink-0" style={{ color: "var(--toss-blue)" }} />
                        <div>
                            <p className="text-xs font-semibold mb-1" style={{ color: "var(--toss-text-secondary)" }}>배송지</p>
                            <p className="text-sm font-semibold" style={{ color: "var(--toss-text-primary)" }}>
                                {order.recipientName} · {order.phone}
                            </p>
                            <p className="text-sm mt-0.5" style={{ color: "var(--toss-text-secondary)" }}>
                                [{order.postalCode}] {order.address}
                                {order.addressDetail && ` ${order.addressDetail}`}
                            </p>
                            {order.memo && (
                                <p className="text-xs mt-1" style={{ color: "var(--toss-text-tertiary)" }}>
                                    메모: {order.memo}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3" style={{ borderTop: "1px solid var(--toss-border)", paddingTop: "1rem" }}>
                        <CreditCard className="size-4 flex-shrink-0" style={{ color: "var(--toss-blue)" }} />
                        <div>
                            <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--toss-text-secondary)" }}>결제 금액</p>
                            <div className="flex flex-col gap-1 mt-1">
                                <div className="flex justify-between text-xs gap-16" style={{ color: "var(--toss-text-tertiary)" }}>
                                    <span>상품 금액</span>
                                    <span>{order.itemsTotal.toLocaleString()}원</span>
                                </div>
                                <div className="flex justify-between text-xs gap-16" style={{ color: "var(--toss-text-tertiary)" }}>
                                    <span>배송비</span>
                                    <span>{order.shippingFee === 0 ? "무료" : `${order.shippingFee.toLocaleString()}원`}</span>
                                </div>
                                <div className="flex justify-between text-sm font-bold mt-1 gap-16" style={{ color: "var(--toss-text-primary)" }}>
                                    <span>합계</span>
                                    <span>{order.totalPrice.toLocaleString()}원</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default function OrdersClient({ orders }: { orders: Order[] }) {
    const [tab, setTab] = useState<Tab>("all")

    const visible = orders.filter((o) => VISIBLE_STATUSES.includes(o.status))

    const filtered = visible.filter((o) => {
        if (tab === "confirmed") return o.status === "confirmed"
        if (tab === "shipping")  return o.status === "shipping"
        if (tab === "delivered") return DELIVERED_STATUSES.includes(o.status)
        if (tab === "cancelled") return o.status === "cancelled"
        return true // "all"
    })

    const tabs: { key: Tab; label: string; count: number }[] = [
        { key: "all",       label: "전체",    count: visible.length },
        { key: "confirmed", label: "주문완료", count: visible.filter((o) => o.status === "confirmed").length },
        { key: "shipping",  label: "배송 중",  count: visible.filter((o) => o.status === "shipping").length },
        { key: "delivered", label: "배송 완료", count: visible.filter((o) => DELIVERED_STATUSES.includes(o.status)).length },
        { key: "cancelled", label: "취소",     count: visible.filter((o) => o.status === "cancelled").length },
    ]

    return (
        <div data-ui-id="page-orders">
            {/* 탭 — 넘칠 경우 가로 스크롤 (스크롤바 숨김) */}
            <div className="flex gap-1 mb-6 overflow-x-auto scrollbar-hide pb-0.5">
                {tabs.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                        style={{
                            backgroundColor: tab === t.key ? "var(--toss-blue)" : "var(--toss-page-bg)",
                            color: tab === t.key ? "#fff" : "var(--toss-text-secondary)",
                        }}
                    >
                        {t.label}
                        <span
                            className="text-[11px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{
                                backgroundColor: tab === t.key ? "rgba(255,255,255,0.25)" : "var(--toss-border)",
                                color: tab === t.key ? "#fff" : "var(--toss-text-tertiary)",
                            }}
                        >
                            {t.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* 주문 목록 */}
            {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Package className="size-12 opacity-20" style={{ color: "var(--toss-text-tertiary)" }} />
                    <p className="text-sm" style={{ color: "var(--toss-text-tertiary)" }}>
                        {tab === "cancelled" ? "취소된 주문이 없어요" : "주문 내역이 없어요"}
                    </p>
                    <a
                        href="/products"
                        className="mt-2 px-5 py-2.5 rounded-2xl text-sm font-semibold text-white"
                        style={{ backgroundColor: "var(--toss-blue)" }}
                    >
                        쇼핑하러 가기
                    </a>
                </div>
            ) : (
                <div className="space-y-4">
                    {filtered.map((order) => (
                        <OrderCard key={order.id} order={order} />
                    ))}
                </div>
            )}
        </div>
    )
}
