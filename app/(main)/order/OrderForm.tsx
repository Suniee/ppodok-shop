"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ShoppingBag, Truck, CreditCard, Loader2, ChevronRight, Clock } from "lucide-react"
import { loadTossPayments, ANONYMOUS } from "@tosspayments/tosspayments-sdk"
import AddressInput, { type AddressValue } from "@/components/ui/AddressInput"
import { useCart } from "@/lib/store/CartContext"
import { createOrderAction } from "./actions"

interface InitialProfile {
    name: string | null
    phone: string | null
    postalCode: string | null
    address: string | null
    addressDetail: string | null
}

const PAYMENT_METHODS = [
    { id: "card",      label: "신용카드/체크카드", icon: "💳", ready: true  },
    { id: "transfer",  label: "계좌이체",           icon: "🏦", ready: true  },
    { id: "kakaopay",  label: "카카오페이",         icon: "🟡", ready: false },
    { id: "naverpay",  label: "네이버페이",          icon: "🟢", ready: false },
    { id: "tosspay",   label: "토스페이",            icon: "🔵", ready: false },
]

const MEMO_PRESETS = [
    "문 앞에 놓아주세요",
    "경비실에 맡겨주세요",
    "부재시 연락 주세요",
    "직접 입력",
]

const FREE_SHIPPING_MIN = 50_000
const SHIPPING_FEE = 3_000

function formatPhone(raw: string): string {
    const d = raw.replace(/\D/g, "").slice(0, 11)
    if (d.startsWith("02")) {
        if (d.length <= 2)  return d
        if (d.length <= 6)  return `${d.slice(0, 2)}-${d.slice(2)}`
        if (d.length <= 9)  return `${d.slice(0, 2)}-${d.slice(2, 5)}-${d.slice(5)}`
        return                     `${d.slice(0, 2)}-${d.slice(2, 6)}-${d.slice(6, 10)}`
    }
    if (d.length <= 3)  return d
    if (d.length <= 7)  return `${d.slice(0, 3)}-${d.slice(3)}`
    if (d.length <= 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`
    return                     `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7, 11)}`
}

const inputCls = "w-full rounded-2xl px-4 py-3 text-sm outline-none transition-all"
const inputStyle: React.CSSProperties = {
    backgroundColor: "#fff",
    border: "1.5px solid var(--toss-border)",
    color: "var(--toss-text-primary)",
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
    return (
        <div className="bg-white rounded-3xl p-6 shadow-sm" style={{ border: "1px solid var(--toss-border)" }}>
            <div className="flex items-center gap-2 mb-5">
                <span style={{ color: "var(--toss-blue)" }}>{icon}</span>
                <h2 className="text-base font-bold" style={{ color: "var(--toss-text-primary)" }}>{title}</h2>
            </div>
            {children}
        </div>
    )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold" style={{ color: "var(--toss-text-secondary)" }}>
                {label}{required && <span className="ml-0.5" style={{ color: "var(--toss-red)" }}>*</span>}
            </span>
            {children}
        </div>
    )
}

export default function OrderForm({ profile }: { profile: InitialProfile }) {
    const { items, clearCart } = useCart()

    // 배송 정보
    const [recipientName, setRecipientName] = useState(profile.name ?? "")
    const [phone, setPhone] = useState(profile.phone ?? "")
    const [address, setAddress] = useState<AddressValue>({
        postalCode:    profile.postalCode    ?? "",
        address:       profile.address       ?? "",
        addressDetail: profile.addressDetail ?? "",
    })
    const [memoPreset, setMemoPreset] = useState(MEMO_PRESETS[0])
    const [memoCustom, setMemoCustom] = useState("")

    // 결제 수단
    const [paymentMethod, setPaymentMethod] = useState("card")

    // 제출 상태
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const itemsTotal  = items.reduce((s, i) => s + i.product.price * i.quantity, 0)
    const shippingFee = itemsTotal >= FREE_SHIPPING_MIN ? 0 : SHIPPING_FEE
    const totalPrice  = itemsTotal + shippingFee
    const memo = memoPreset === "직접 입력" ? memoCustom : memoPreset

    const handleSubmit = async () => {
        setError(null)
        setSubmitting(true)
        try {
            // 1. 미결(pending) 주문 DB 저장 → orderId 확보
            const orderId = await createOrderAction({
                recipientName,
                phone,
                postalCode:    address.postalCode,
                address:       address.address,
                addressDetail: address.addressDetail,
                memo,
                paymentMethod,
                items: items.map((i) => ({
                    productId:   i.product.id,
                    productName: i.product.name,
                    price:       i.product.price,
                    quantity:    i.quantity,
                    emoji:       i.product.emoji,
                    imageUrl:    i.product.images?.[0] ?? null,
                })),
            })

            // 2. 토스 결제창 호출 — 성공 시 /order/complete/[orderId]로 리다이렉트
            const tossPayments = await loadTossPayments(
                process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!
            )
            const payment = tossPayments.payment({ customerKey: ANONYMOUS })

            const orderName = items.length === 1
                ? items[0].product.name
                : `${items[0].product.name} 외 ${items.length - 1}개`

            const base = {
                amount:      { currency: "KRW" as const, value: totalPrice },
                orderId,
                orderName,
                successUrl:  `${window.location.origin}/order/complete/${orderId}`,
                failUrl:     `${window.location.origin}/order/fail`,
                customerName: recipientName,
                customerMobilePhone: phone.replace(/-/g, ""),
            }

            // payment.requestPayment()는 카드·계좌이체를 지원
            // 간편결제(카카오/네이버/토스)는 결제위젯(Widget) API 필요 → 추후 지원
            if (paymentMethod === "transfer") {
                await payment.requestPayment({ ...base, method: "TRANSFER" })
            } else {
                await payment.requestPayment({ ...base, method: "CARD" })
            }
            // requestPayment는 결제창을 열고 리다이렉트하므로 여기 이후 코드는 실행되지 않음

        } catch (err) {
            setError((err as Error).message ?? "결제 처리 중 오류가 발생했습니다.")
            setSubmitting(false)
        }
    }

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-4" style={{ color: "var(--toss-text-tertiary)" }}>
                <ShoppingBag className="size-14 opacity-30" />
                <p className="text-sm font-medium">장바구니가 비어있어요</p>
                <a
                    href="/products"
                    className="px-5 py-2.5 rounded-full text-sm font-semibold text-white"
                    style={{ backgroundColor: "var(--toss-blue)" }}
                >
                    쇼핑 계속하기
                </a>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

            {/* ── 왼쪽: 주문 상품 + 배송 정보 ── */}
            <div className="lg:col-span-7 space-y-4">

                {/* 주문 상품 */}
                <Section icon={<ShoppingBag className="size-4" />} title={`주문 상품 ${items.length}개`}>
                    <ul className="space-y-4">
                        {items.map((item) => {
                            const discount = item.product.originalPrice
                                ? Math.round(((item.product.originalPrice - item.product.price) / item.product.originalPrice) * 100)
                                : null
                            return (
                                <li key={item.product.id} className="flex gap-3">
                                    <div
                                        className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden text-2xl"
                                        style={{ backgroundColor: "var(--toss-page-bg)" }}
                                    >
                                        {item.product.images?.[0]
                                            ? <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                                            : item.product.emoji
                                        }
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold line-clamp-1" style={{ color: "var(--toss-text-primary)" }}>
                                            {item.product.name}
                                        </p>
                                        <p className="text-xs mt-0.5" style={{ color: "var(--toss-text-tertiary)" }}>
                                            수량 {item.quantity}개
                                        </p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        {discount && (
                                            <p className="text-[10px] font-bold" style={{ color: "var(--toss-red)" }}>{discount}%</p>
                                        )}
                                        <p className="text-sm font-black" style={{ color: "var(--toss-text-primary)" }}>
                                            {(item.product.price * item.quantity).toLocaleString()}원
                                        </p>
                                    </div>
                                </li>
                            )
                        })}
                    </ul>
                </Section>

                {/* 배송 정보 */}
                <Section icon={<Truck className="size-4" />} title="배송 정보">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="받는 분" required>
                                <input
                                    className={inputCls}
                                    style={inputStyle}
                                    value={recipientName}
                                    onChange={(e) => setRecipientName(e.target.value)}
                                    placeholder="이름 입력"
                                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--toss-blue)")}
                                    onBlur={(e) => (e.currentTarget.style.borderColor = "var(--toss-border)")}
                                />
                            </Field>
                            <Field label="연락처" required>
                                <input
                                    className={inputCls}
                                    style={inputStyle}
                                    value={phone}
                                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                                    placeholder="010-0000-0000"
                                    inputMode="tel"
                                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--toss-blue)")}
                                    onBlur={(e) => (e.currentTarget.style.borderColor = "var(--toss-border)")}
                                />
                            </Field>
                        </div>

                        <Field label="배송 주소" required>
                            <AddressInput value={address} onChange={setAddress} />
                        </Field>

                        <Field label="배송 메모">
                            <select
                                className={inputCls}
                                style={inputStyle}
                                value={memoPreset}
                                onChange={(e) => setMemoPreset(e.target.value)}
                                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--toss-blue)")}
                                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--toss-border)")}
                            >
                                {MEMO_PRESETS.map((p) => <option key={p}>{p}</option>)}
                            </select>
                            {memoPreset === "직접 입력" && (
                                <input
                                    className={inputCls}
                                    style={inputStyle}
                                    value={memoCustom}
                                    onChange={(e) => setMemoCustom(e.target.value)}
                                    placeholder="배송 메모를 입력해주세요"
                                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--toss-blue)")}
                                    onBlur={(e) => (e.currentTarget.style.borderColor = "var(--toss-border)")}
                                />
                            )}
                        </Field>
                    </div>
                </Section>
            </div>

            {/* ── 오른쪽: 결제 수단 + 최종 금액 ── */}
            <div className="lg:col-span-5 lg:sticky lg:top-[80px] space-y-4">

                {/* 결제 수단 */}
                <Section icon={<CreditCard className="size-4" />} title="결제 수단">
                    <div className="grid grid-cols-1 gap-2">
                        {PAYMENT_METHODS.map((pm) => (
                            <motion.button
                                key={pm.id}
                                whileTap={pm.ready ? { scale: 0.98 } : {}}
                                onClick={() => pm.ready && setPaymentMethod(pm.id)}
                                disabled={!pm.ready}
                                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all text-left"
                                style={{
                                    border: paymentMethod === pm.id
                                        ? "1.5px solid var(--toss-blue)"
                                        : "1.5px solid var(--toss-border)",
                                    backgroundColor: !pm.ready
                                        ? "var(--toss-page-bg)"
                                        : paymentMethod === pm.id
                                            ? "var(--toss-blue-light)"
                                            : "#fff",
                                    color: !pm.ready
                                        ? "var(--toss-text-tertiary)"
                                        : paymentMethod === pm.id
                                            ? "var(--toss-blue)"
                                            : "var(--toss-text-primary)",
                                    cursor: pm.ready ? "pointer" : "default",
                                    opacity: pm.ready ? 1 : 0.6,
                                }}
                            >
                                <span className="text-lg">{pm.icon}</span>
                                {pm.label}
                                {!pm.ready && (
                                    <span className="ml-auto flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                        style={{ backgroundColor: "#F2F4F6", color: "var(--toss-text-tertiary)" }}>
                                        <Clock className="size-2.5" />준비중
                                    </span>
                                )}
                                {pm.ready && paymentMethod === pm.id && (
                                    <span className="ml-auto text-xs font-bold" style={{ color: "var(--toss-blue)" }}>선택됨</span>
                                )}
                            </motion.button>
                        ))}
                    </div>
                </Section>

                {/* 최종 금액 */}
                <div className="bg-white rounded-3xl p-6 shadow-sm space-y-3" style={{ border: "1px solid var(--toss-border)" }}>
                    <h2 className="text-base font-bold mb-4" style={{ color: "var(--toss-text-primary)" }}>결제 금액</h2>

                    <div className="flex justify-between text-sm" style={{ color: "var(--toss-text-secondary)" }}>
                        <span>상품 금액</span>
                        <span>{itemsTotal.toLocaleString()}원</span>
                    </div>
                    <div className="flex justify-between text-sm" style={{ color: "var(--toss-text-secondary)" }}>
                        <span>배송비</span>
                        {shippingFee === 0
                            ? <span style={{ color: "var(--toss-blue)" }}>무료</span>
                            : <span>{shippingFee.toLocaleString()}원</span>
                        }
                    </div>
                    {shippingFee > 0 && (
                        <p className="text-xs" style={{ color: "var(--toss-text-tertiary)" }}>
                            {(FREE_SHIPPING_MIN - itemsTotal).toLocaleString()}원 더 담으면 무료배송
                        </p>
                    )}

                    <div
                        className="flex justify-between items-center pt-3 mt-1"
                        style={{ borderTop: "1px solid var(--toss-border)" }}
                    >
                        <span className="text-base font-bold" style={{ color: "var(--toss-text-primary)" }}>최종 결제금액</span>
                        <span className="text-xl font-black" style={{ color: "var(--toss-blue)" }}>
                            {totalPrice.toLocaleString()}원
                        </span>
                    </div>

                    {error && (
                        <p className="text-xs font-medium px-1" style={{ color: "var(--toss-red)" }}>{error}</p>
                    )}

                    <motion.button
                        data-ui-id="btn-order-submit"
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="w-full py-4 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-50 mt-2"
                        style={{ backgroundColor: "var(--toss-blue)" }}
                    >
                        {submitting
                            ? <><Loader2 className="size-4 animate-spin" />처리 중...</>
                            : <>{totalPrice.toLocaleString()}원 결제하기 <ChevronRight className="size-4" /></>
                        }
                    </motion.button>

                    <p className="text-[11px] text-center" style={{ color: "var(--toss-text-tertiary)" }}>
                        주문하기 버튼을 누르면 주문 및 결제에 동의하는 것으로 간주합니다
                    </p>
                </div>
            </div>
        </div>
    )
}
