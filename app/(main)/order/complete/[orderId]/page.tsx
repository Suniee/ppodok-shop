import { notFound } from "next/navigation"
import { CheckCircle2, MapPin, CreditCard, Package } from "lucide-react"
import { fetchOrderById, updateOrderStatus, ORDER_STATUS_LABEL } from "@/lib/supabase/orders"
import { confirmTossPayment } from "@/lib/toss"
import { CartClearer } from "./CartClearer"

const PAYMENT_LABEL: Record<string, string> = {
    card:      "신용카드/체크카드",
    kakaopay:  "카카오페이",
    naverpay:  "네이버페이",
    tosspay:   "토스페이",
    transfer:  "계좌이체",
}

interface Props {
    params: Promise<{ orderId: string }>
    searchParams: Promise<{ paymentKey?: string; amount?: string }>
}

export default async function OrderCompletePage({ params, searchParams }: Props) {
    const { orderId } = await params
    const { paymentKey, amount } = await searchParams

    // 토스 결제 리다이렉트인 경우: pending 상태일 때만 승인 처리
    if (paymentKey && amount) {
        const order = await fetchOrderById(orderId)
        if (order?.status === "pending") {
            try {
                await confirmTossPayment(paymentKey, orderId, parseInt(amount, 10))
                await updateOrderStatus(orderId, "confirmed")
            } catch {
                // 승인 실패 → 실패 페이지로 이동 처리는 클라이언트가 담당
                // 서버에서는 최선을 다해 렌더링 시도
            }
        }
    }

    const order = await fetchOrderById(orderId)
    if (!order) notFound()

    const orderDate = new Date(order.createdAt)
    const shortId = order.id.slice(0, 8).toUpperCase()

    return (
        <div data-ui-id={`page-order-complete-${shortId}`} className="max-w-xl mx-auto px-5 py-10 pb-16">
            {/* 결제 완료 후 장바구니 비우기 */}
            {paymentKey && <CartClearer />}

            {/* 성공 헤더 */}
            <div className="flex flex-col items-center text-center mb-8">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                    style={{ backgroundColor: "#E8F8F5" }}>
                    <CheckCircle2 className="size-8" style={{ color: "#00A878" }} />
                </div>
                <h1 className="text-2xl font-black mb-1" style={{ color: "var(--toss-text-primary)", letterSpacing: "-0.03em" }}>
                    주문이 완료되었어요!
                </h1>
                <p className="text-sm" style={{ color: "var(--toss-text-secondary)" }}>
                    주문번호 <span className="font-bold">{shortId}</span>
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--toss-text-tertiary)" }}>
                    {orderDate.toLocaleDateString("ko-KR", {
                        year: "numeric", month: "long", day: "numeric",
                        hour: "2-digit", minute: "2-digit",
                    })}
                </p>
            </div>

            {/* 주문 상품 */}
            <div className="bg-white rounded-3xl p-6 mb-4 shadow-sm" style={{ border: "1px solid var(--toss-border)" }}>
                <div className="flex items-center gap-2 mb-4">
                    <Package className="size-4" style={{ color: "var(--toss-blue)" }} />
                    <h2 className="text-sm font-bold" style={{ color: "var(--toss-text-primary)" }}>
                        주문 상품 {order.items.length}개
                    </h2>
                    <span
                        className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: "#EBF3FF", color: "var(--toss-blue)" }}
                    >
                        {ORDER_STATUS_LABEL[order.status]}
                    </span>
                </div>
                <ul className="space-y-3">
                    {order.items.map((item) => (
                        <li key={item.id} className="flex gap-3 items-center">
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
                                <p className="text-xs" style={{ color: "var(--toss-text-tertiary)" }}>
                                    수량 {item.quantity}개
                                </p>
                            </div>
                            <p className="text-sm font-black flex-shrink-0" style={{ color: "var(--toss-text-primary)" }}>
                                {(item.price * item.quantity).toLocaleString()}원
                            </p>
                        </li>
                    ))}
                </ul>
            </div>

            {/* 배송 + 결제 정보 */}
            <div className="bg-white rounded-3xl p-6 mb-4 shadow-sm space-y-4" style={{ border: "1px solid var(--toss-border)" }}>
                <div className="flex items-start gap-3">
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
                        <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--toss-text-secondary)" }}>결제 수단</p>
                        <p className="text-sm font-semibold" style={{ color: "var(--toss-text-primary)" }}>
                            {PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod}
                        </p>
                    </div>
                </div>
            </div>

            {/* 금액 요약 */}
            <div className="bg-white rounded-3xl p-6 mb-6 shadow-sm space-y-2" style={{ border: "1px solid var(--toss-border)" }}>
                <div className="flex justify-between text-sm" style={{ color: "var(--toss-text-secondary)" }}>
                    <span>상품 금액</span>
                    <span>{order.itemsTotal.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between text-sm" style={{ color: "var(--toss-text-secondary)" }}>
                    <span>배송비</span>
                    {order.shippingFee === 0
                        ? <span style={{ color: "var(--toss-blue)" }}>무료</span>
                        : <span>{order.shippingFee.toLocaleString()}원</span>
                    }
                </div>
                <div className="flex justify-between items-center pt-2" style={{ borderTop: "1px solid var(--toss-border)" }}>
                    <span className="text-base font-bold" style={{ color: "var(--toss-text-primary)" }}>결제 금액</span>
                    <span className="text-xl font-black" style={{ color: "var(--toss-blue)" }}>
                        {order.totalPrice.toLocaleString()}원
                    </span>
                </div>
            </div>

            {/* 하단 버튼 */}
            <div className="grid grid-cols-2 gap-3">
                <a
                    href="/products"
                    className="flex items-center justify-center py-3.5 rounded-2xl text-sm font-semibold transition-colors hover:bg-gray-50"
                    style={{ border: "1.5px solid var(--toss-border)", color: "var(--toss-text-secondary)" }}
                >
                    쇼핑 계속하기
                </a>
                <a
                    href="/"
                    className="flex items-center justify-center py-3.5 rounded-2xl text-sm font-bold text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: "var(--toss-blue)" }}
                >
                    홈으로
                </a>
            </div>
        </div>
    )
}
