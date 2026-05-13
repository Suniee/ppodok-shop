"use client"

import { useState, useTransition } from "react"
import { ChevronDown, ChevronUp, MapPin, CreditCard, Package, X, AlertCircle, CheckCircle2, Clock, XCircle } from "lucide-react"
import type { Order, OrderStatus } from "@/lib/supabase/orders"
import { ORDER_STATUS_LABEL } from "@/lib/supabase/orders"
import type { CancelRequest, CancelRequestType } from "@/lib/supabase/cancelRequests"
import { CANCEL_REQUEST_TYPE_LABEL, CANCEL_REQUEST_STATUS_LABEL } from "@/lib/supabase/cancelRequests"
import { cancelOrderAction, submitCancelRequestAction } from "./actions"

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

const CANCEL_REQUEST_STATUS_STYLE: Record<string, { bg: string; color: string; icon: React.ElementType }> = {
    pending:  { bg: "#FFF8E1", color: "#FFB800", icon: Clock },
    approved: { bg: "#ECFDF5", color: "#059669", icon: CheckCircle2 },
    rejected: { bg: "#FFF0F0", color: "#FF4E4E", icon: XCircle },
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

// ── 주문 취소 확인 모달 ──────────────────────────────────────────
function CancelConfirmModal({
    order,
    onClose,
    onConfirm,
    isPending,
}: {
    order: Order
    onClose: () => void
    onConfirm: () => void
    isPending: boolean
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
            <div
                data-ui-id="modal-order-cancel-confirm"
                className="w-full max-w-md bg-white rounded-3xl overflow-hidden mx-4"
            >
                <div className="p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: "#FFF0F0" }}>
                            <AlertCircle className="size-5" style={{ color: "#FF4E4E" }} />
                        </div>
                        <div>
                            <p className="text-base font-black" style={{ color: "var(--toss-text-primary)" }}>주문을 취소하시겠어요?</p>
                            <p className="text-xs mt-0.5" style={{ color: "var(--toss-text-secondary)" }}>
                                결제 취소까지 즉시 처리됩니다.
                            </p>
                        </div>
                    </div>

                    {/* 주문 요약 */}
                    <div className="rounded-2xl p-4 space-y-1" style={{ backgroundColor: "var(--toss-page-bg)" }}>
                        <p className="text-xs font-semibold" style={{ color: "var(--toss-text-secondary)" }}>
                            {order.items[0]?.productName}{order.items.length > 1 ? ` 외 ${order.items.length - 1}개` : ""}
                        </p>
                        <p className="text-sm font-black" style={{ color: "var(--toss-text-primary)" }}>
                            {order.totalPrice.toLocaleString()}원 환불
                        </p>
                    </div>

                    <div className="flex gap-3 pt-1">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 rounded-2xl text-sm font-bold transition-colors"
                            style={{ backgroundColor: "var(--toss-page-bg)", color: "var(--toss-text-secondary)" }}
                        >
                            돌아가기
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isPending}
                            className="flex-1 py-3 rounded-2xl text-sm font-bold text-white transition-opacity disabled:opacity-60"
                            style={{ backgroundColor: "#FF4E4E" }}
                        >
                            {isPending ? "취소 중..." : "주문 취소"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ── 교환/환불 신청 모달 ──────────────────────────────────────────
const REFUND_REASONS = ["단순 변심", "상품 불량/파손", "오배송", "배송 지연"]

function CancelRequestModal({
    order,
    onClose,
    onSubmit,
    isPending,
}: {
    order: Order
    onClose: () => void
    onSubmit: (type: CancelRequestType, reason: string) => void
    isPending: boolean
}) {
    const [type, setType]     = useState<CancelRequestType>("refund")
    const [reason, setReason] = useState("")
    const [custom, setCustom] = useState("")

    const finalReason = reason === "직접입력" ? custom.trim() : reason

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
            <div
                data-ui-id="modal-cancel-request"
                className="w-full max-w-md bg-white rounded-3xl overflow-hidden mx-4"
            >
                {/* 헤더 */}
                <div className="flex items-center justify-between px-5 py-4"
                    style={{ borderBottom: "1px solid var(--toss-border)" }}>
                    <p className="text-base font-black" style={{ color: "var(--toss-text-primary)" }}>
                        교환/환불 신청
                    </p>
                    <button onClick={onClose} className="p-1 rounded-xl hover:bg-gray-100">
                        <X className="size-4" style={{ color: "var(--toss-text-secondary)" }} />
                    </button>
                </div>

                <div className="p-5 space-y-5">
                    {/* 신청 유형 */}
                    <div>
                        <p className="text-xs font-semibold mb-2" style={{ color: "var(--toss-text-secondary)" }}>신청 유형</p>
                        <div className="flex gap-2">
                            {(["exchange", "refund"] as CancelRequestType[]).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setType(t)}
                                    className="flex-1 py-2.5 rounded-2xl text-sm font-bold transition-colors"
                                    style={{
                                        backgroundColor: type === t ? "var(--toss-blue)" : "var(--toss-page-bg)",
                                        color: type === t ? "#fff" : "var(--toss-text-secondary)",
                                    }}
                                >
                                    {CANCEL_REQUEST_TYPE_LABEL[t]}
                                </button>
                            ))}
                        </div>
                        <p className="text-[11px] mt-1.5" style={{ color: "var(--toss-text-tertiary)" }}>
                            {type === "exchange"
                                ? "동일 상품 또는 다른 상품으로 교환을 원하는 경우 선택하세요."
                                : "결제 금액 환불을 원하는 경우 선택하세요."}
                        </p>
                    </div>

                    {/* 신청 사유 */}
                    <div>
                        <p className="text-xs font-semibold mb-2" style={{ color: "var(--toss-text-secondary)" }}>신청 사유</p>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {[...REFUND_REASONS, "직접입력"].map((r) => (
                                <button
                                    key={r}
                                    onClick={() => setReason(r)}
                                    className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors"
                                    style={{
                                        backgroundColor: reason === r ? "var(--toss-blue)" : "var(--toss-page-bg)",
                                        color: reason === r ? "#fff" : "var(--toss-text-secondary)",
                                        border: "1px solid var(--toss-border)",
                                    }}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                        {reason === "직접입력" && (
                            <textarea
                                value={custom}
                                onChange={(e) => setCustom(e.target.value)}
                                placeholder="사유를 직접 입력해주세요."
                                rows={3}
                                className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none"
                                style={{
                                    backgroundColor: "var(--toss-page-bg)",
                                    border: "1px solid var(--toss-border)",
                                    color: "var(--toss-text-primary)",
                                }}
                            />
                        )}
                    </div>

                    {/* 안내 문구 */}
                    <div className="rounded-2xl p-3 flex items-start gap-2"
                        style={{ backgroundColor: "#FFF8E1" }}>
                        <AlertCircle className="size-3.5 mt-0.5 flex-shrink-0" style={{ color: "#FFB800" }} />
                        <p className="text-[11px] leading-relaxed" style={{ color: "#B07D00" }}>
                            신청 후 담당자 확인을 거쳐 처리됩니다. 승인 시 결제 수단으로 환불되며
                            영업일 기준 3~5일 소요될 수 있습니다.
                        </p>
                    </div>

                    <button
                        onClick={() => onSubmit(type, finalReason)}
                        disabled={isPending || !finalReason}
                        className="w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-opacity disabled:opacity-50"
                        style={{ backgroundColor: "var(--toss-blue)" }}
                    >
                        {isPending ? "신청 중..." : "신청하기"}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ── 주문 카드 ────────────────────────────────────────────────────
function OrderCard({
    order,
    cancelRequests,
}: {
    order: Order
    cancelRequests: CancelRequest[]
}) {
    const [expanded, setExpanded]           = useState(false)
    const [showCancelModal, setShowCancel]  = useState(false)
    const [showRequestModal, setShowRequest]= useState(false)
    const [errorMsg, setErrorMsg]           = useState<string | null>(null)
    const [isPending, startTransition]      = useTransition()

    const statusStyle = STATUS_STYLE[order.status]
    const shortId     = order.id.slice(0, 8).toUpperCase()

    // confirmed → 즉시 취소 가능
    const canCancel  = order.status === "confirmed"
    // shipping / delivered → 교환/환불 신청 가능 (pending 신청이 없는 경우)
    const hasPending = cancelRequests.some((r) => r.status === "pending")
    const canRequest = ["shipping", "delivered"].includes(order.status) && !hasPending

    const handleCancel = () => {
        setErrorMsg(null)
        startTransition(async () => {
            const result = await cancelOrderAction(order.id)
            if (!result.ok) {
                setErrorMsg(result.message ?? "취소 실패")
            }
            setShowCancel(false)
        })
    }

    const handleRequest = (type: CancelRequestType, reason: string) => {
        setErrorMsg(null)
        startTransition(async () => {
            const result = await submitCancelRequestAction(order.id, type, reason)
            if (!result.ok) {
                setErrorMsg(result.message ?? "신청 실패")
            }
            setShowRequest(false)
        })
    }

    return (
        <>
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

                {/* 교환/환불 신청 이력 전체 표시 */}
                {cancelRequests.length > 0 && (
                    <div style={{ borderTop: "1px solid var(--toss-border)" }}>
                        {cancelRequests.map((req, idx) => {
                            const style  = CANCEL_REQUEST_STATUS_STYLE[req.status]
                            const Icon   = style.icon
                            const isLast = idx === cancelRequests.length - 1
                            return (
                                <div
                                    key={req.id}
                                    className="px-5 py-3 space-y-1"
                                    style={{ borderBottom: isLast ? undefined : "1px solid var(--toss-border)" }}
                                >
                                    <div className="flex items-center gap-2">
                                        <Icon className="size-3.5 flex-shrink-0" style={{ color: style.color }} />
                                        <span className="text-xs font-semibold" style={{ color: style.color }}>
                                            {CANCEL_REQUEST_TYPE_LABEL[req.type]} 신청 — {CANCEL_REQUEST_STATUS_LABEL[req.status]}
                                        </span>
                                        <span className="text-[11px] ml-auto flex-shrink-0" style={{ color: "var(--toss-text-tertiary)" }}>
                                            {new Date(req.createdAt).toLocaleDateString("ko-KR", { month: "long", day: "numeric" })}
                                        </span>
                                    </div>
                                    <p className="text-[11px] pl-5" style={{ color: "var(--toss-text-tertiary)" }}>
                                        사유: {req.reason}
                                    </p>
                                    {req.adminNote && (
                                        <p className="text-[11px] pl-5 font-medium"
                                            style={{ color: req.status === "rejected" ? "#FF4E4E" : "var(--toss-text-secondary)" }}>
                                            {req.status === "rejected" ? "거절 사유: " : "처리 메모: "}{req.adminNote}
                                        </p>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* 오류 메시지 */}
                {errorMsg && (
                    <div className="px-5 py-2.5 flex items-center gap-2"
                        style={{ borderTop: "1px solid var(--toss-border)", backgroundColor: "#FFF0F0" }}>
                        <AlertCircle className="size-3.5 flex-shrink-0" style={{ color: "#FF4E4E" }} />
                        <p className="text-xs" style={{ color: "#FF4E4E" }}>{errorMsg}</p>
                    </div>
                )}

                {/* 취소 / 교환환불 신청 버튼 */}
                {(canCancel || canRequest) && (
                    <div
                        className="px-5 py-3 flex gap-2"
                        style={{ borderTop: "1px solid var(--toss-border)" }}
                    >
                        {canCancel && (
                            <button
                                data-ui-id={`btn-order-cancel-${shortId}`}
                                onClick={() => { setErrorMsg(null); setShowCancel(true) }}
                                disabled={isPending}
                                className="flex-1 py-2.5 rounded-2xl text-xs font-bold transition-opacity disabled:opacity-50"
                                style={{ backgroundColor: "#FFF0F0", color: "#FF4E4E" }}
                            >
                                주문 취소
                            </button>
                        )}
                        {canRequest && (
                            <button
                                data-ui-id={`btn-order-request-${shortId}`}
                                onClick={() => { setErrorMsg(null); setShowRequest(true) }}
                                disabled={isPending}
                                className="flex-1 py-2.5 rounded-2xl text-xs font-bold transition-opacity disabled:opacity-50"
                                style={{ backgroundColor: "var(--toss-page-bg)", color: "var(--toss-text-secondary)", border: "1px solid var(--toss-border)" }}
                            >
                                교환/환불 신청
                            </button>
                        )}
                    </div>
                )}

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

            {/* 모달 */}
            {showCancelModal && (
                <CancelConfirmModal
                    order={order}
                    onClose={() => setShowCancel(false)}
                    onConfirm={handleCancel}
                    isPending={isPending}
                />
            )}
            {showRequestModal && (
                <CancelRequestModal
                    order={order}
                    onClose={() => setShowRequest(false)}
                    onSubmit={handleRequest}
                    isPending={isPending}
                />
            )}
        </>
    )
}

// ── 메인 컴포넌트 ────────────────────────────────────────────────
export default function OrdersClient({
    orders,
    cancelRequests,
}: {
    orders: Order[]
    cancelRequests: Record<string, CancelRequest[]>
}) {
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
            {/* 탭 */}
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
                        <OrderCard
                            key={order.id}
                            order={order}
                            cancelRequests={cancelRequests[order.id] ?? []}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
