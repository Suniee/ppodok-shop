"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ShoppingBag, Truck, CreditCard, Loader2, ChevronRight, Clock, Ticket, ChevronDown, X, Check, MessageSquare } from "lucide-react"
import { loadTossPayments, ANONYMOUS } from "@tosspayments/tosspayments-sdk"
import AddressInput, { type AddressValue } from "@/components/ui/AddressInput"
import { useCart } from "@/lib/store/CartContext"
import { createOrderAction } from "./actions"
import type { UserCoupon } from "@/lib/supabase/coupon-utils"
import { calcDiscount } from "@/lib/supabase/coupon-utils"

interface InitialProfile {
    name:          string | null
    phone:         string | null
    postalCode:    string | null
    address:       string | null
    addressDetail: string | null
}

const PAYMENT_METHODS = [
    { id: "card",      label: "신용카드/체크카드", icon: "💳", ready: true  },
    { id: "transfer",  label: "계좌이체",           icon: "🏦", ready: true  },
    { id: "kakaopay",  label: "카카오페이",         icon: "🟡", ready: false },
    { id: "naverpay",  label: "네이버페이",          icon: "🟢", ready: false },
    { id: "tosspay",   label: "토스페이",            icon: "🔵", ready: false },
]

const MEMO_PRESETS = ["문 앞에 놓아주세요", "경비실에 맡겨주세요", "부재시 연락 주세요", "직접 입력"]

const FREE_SHIPPING_MIN = 50_000
const SHIPPING_FEE      = 3_000

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

const inputCls   = "w-full rounded-2xl px-4 py-3 text-sm outline-none transition-all"
const inputStyle: React.CSSProperties = {
    backgroundColor: "#fff",
    border:          "1.5px solid var(--toss-border)",
    color:           "var(--toss-text-primary)",
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

// ── 쿠폰 바텀시트 피커 ───────────────────────────────────────
function CouponBottomSheet({
    coupons,
    selected,
    baseAmount,
    onChange,
    placeholder,
    title,
}: {
    coupons:     UserCoupon[]
    selected:    UserCoupon | null
    baseAmount:  number
    onChange:    (uc: UserCoupon | null) => void
    placeholder: string
    title:       string
}) {
    const [open, setOpen]       = useState(false)
    const [visible, setVisible] = useState(false)

    const openSheet = () => {
        setOpen(true)
        setTimeout(() => setVisible(true), 16)
    }

    const closeSheet = () => {
        setVisible(false)
        setTimeout(() => setOpen(false), 300)
    }

    const handleSelect = (uc: UserCoupon | null) => {
        onChange(uc)
        closeSheet()
    }

    useEffect(() => {
        if (!open) return
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") closeSheet() }
        window.addEventListener("keydown", handler)
        return () => window.removeEventListener("keydown", handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open])

    const selectedDiscount = selected ? calcDiscount(selected.coupon, baseAmount) : 0

    return (
        <>
            {/* 트리거 버튼 */}
            <button
                type="button"
                onClick={openSheet}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all"
                style={{
                    border:          selected ? "1.5px solid var(--toss-blue)" : "1.5px solid var(--toss-border)",
                    backgroundColor: selected ? "var(--toss-blue-light)" : "#fff",
                }}>
                <Ticket className="size-4 flex-shrink-0"
                    style={{ color: selected ? "var(--toss-blue)" : "var(--toss-text-tertiary)" }} />
                <div className="flex-1 min-w-0">
                    {selected ? (
                        <>
                            <p className="text-sm font-bold truncate" style={{ color: "var(--toss-blue)" }}>
                                {selected.coupon.name}
                            </p>
                            <p className="text-xs font-semibold mt-0.5" style={{ color: "var(--toss-red)" }}>
                                -{selectedDiscount.toLocaleString()}원 할인 적용
                            </p>
                        </>
                    ) : (
                        <p className="text-sm" style={{ color: coupons.length === 0 ? "var(--toss-text-tertiary)" : "var(--toss-text-secondary)" }}>
                            {coupons.length === 0 ? "보유한 쿠폰이 없습니다" : placeholder}
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                    {selected && (
                        <span
                            role="button"
                            onClick={(e) => { e.stopPropagation(); onChange(null) }}
                            className="p-1 rounded-full transition-colors hover:bg-blue-100 cursor-pointer">
                            <X className="size-3.5" style={{ color: "var(--toss-blue)" }} />
                        </span>
                    )}
                    {coupons.length > 0 && (
                        <ChevronDown className="size-4"
                            style={{ color: selected ? "var(--toss-blue)" : "var(--toss-text-tertiary)" }} />
                    )}
                </div>
            </button>

            {/* 바텀시트 */}
            {open && (
                <>
                    <div
                        className="transition-opacity duration-300"
                        style={{
                            position:        "fixed",
                            inset:           0,
                            zIndex:          50,
                            backgroundColor: "rgba(0,0,0,0.45)",
                            opacity:         visible ? 1 : 0,
                        }}
                        onClick={closeSheet}
                    />
                    <div
                        className="bg-white rounded-t-3xl transition-transform duration-300"
                        style={{
                            position:  "fixed",
                            left:      0,
                            right:     0,
                            bottom:    0,
                            zIndex:    51,
                            maxHeight: "65vh",
                            overflow:  "hidden",
                            boxShadow: "0 -4px 24px rgba(0,0,0,0.12)",
                            transform: visible ? "translateY(0)" : "translateY(100%)",
                        }}>

                        {/* 핸들 */}
                        <div className="flex justify-center pt-3 pb-1">
                            <div className="w-10 h-1 rounded-full" style={{ backgroundColor: "var(--toss-border)" }} />
                        </div>

                        {/* 헤더 */}
                        <div className="flex items-center justify-between px-5 py-4"
                            style={{ borderBottom: "1px solid var(--toss-border)" }}>
                            <div>
                                <p className="text-base font-bold" style={{ color: "var(--toss-text-primary)", letterSpacing: "-0.02em" }}>
                                    {title}
                                </p>
                                {coupons.length > 0 && (
                                    <p className="text-xs mt-0.5" style={{ color: "var(--toss-text-tertiary)" }}>
                                        {coupons.length}장 보유
                                    </p>
                                )}
                            </div>
                            <button type="button" onClick={closeSheet}
                                className="p-1.5 rounded-xl hover:bg-gray-100 transition-colors">
                                <X className="size-5" style={{ color: "var(--toss-text-secondary)" }} />
                            </button>
                        </div>

                        {/* 쿠폰 목록 */}
                        <div className="overflow-y-auto" style={{ maxHeight: "calc(65vh - 90px)" }}>
                            {/* 해제 옵션 */}
                            {selected && (
                                <button type="button" onClick={() => handleSelect(null)}
                                    className="w-full flex items-center gap-2 px-5 py-4 text-left text-sm font-medium transition-colors hover:bg-gray-50"
                                    style={{ borderBottom: "1px solid var(--toss-border)", color: "var(--toss-text-tertiary)" }}>
                                    <X className="size-3.5" />
                                    쿠폰 사용 안함
                                </button>
                            )}

                            {coupons.length === 0 ? (
                                <div className="flex flex-col items-center py-14 gap-3">
                                    <Ticket className="size-10 opacity-20" style={{ color: "var(--toss-text-tertiary)" }} />
                                    <p className="text-sm font-medium" style={{ color: "var(--toss-text-tertiary)" }}>
                                        사용 가능한 쿠폰이 없습니다
                                    </p>
                                </div>
                            ) : (
                                coupons.map((uc, i) => {
                                    const isSelected = selected?.id === uc.id
                                    const applicable = uc.coupon.minOrderAmount <= baseAmount
                                    const discount   = calcDiscount(uc.coupon, baseAmount)
                                    return (
                                        <button key={uc.id} type="button"
                                            onClick={() => applicable && handleSelect(uc)}
                                            disabled={!applicable}
                                            className="w-full text-left px-5 py-4 transition-colors disabled:cursor-not-allowed"
                                            style={{
                                                borderBottom:    i < coupons.length - 1 ? "1px solid var(--toss-border)" : undefined,
                                                backgroundColor: isSelected ? "var(--toss-blue-light)" : undefined,
                                                opacity:         applicable ? 1 : 0.45,
                                            }}>
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="text-sm font-bold"
                                                            style={{ color: isSelected ? "var(--toss-blue)" : "var(--toss-text-primary)" }}>
                                                            {uc.coupon.name}
                                                        </p>
                                                        {isSelected && (
                                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                                                style={{ backgroundColor: "var(--toss-blue)", color: "#fff" }}>
                                                                적용중
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs mt-1" style={{ color: "var(--toss-text-secondary)" }}>
                                                        {uc.coupon.discountType === "fixed"
                                                            ? `${uc.coupon.discountValue.toLocaleString()}원 할인`
                                                            : `${uc.coupon.discountValue}% 할인`}
                                                        {uc.coupon.maxDiscountAmount
                                                            ? ` · 최대 ${uc.coupon.maxDiscountAmount.toLocaleString()}원`
                                                            : ""}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                        {uc.coupon.minOrderAmount > 0 && (
                                                            <span className="text-xs" style={{ color: "var(--toss-text-tertiary)" }}>
                                                                {uc.coupon.minOrderAmount.toLocaleString()}원 이상 구매 시
                                                            </span>
                                                        )}
                                                        <span className="text-xs" style={{ color: "var(--toss-text-tertiary)" }}>
                                                            ~{new Date(uc.coupon.validUntil).toLocaleDateString("ko-KR", { month: "long", day: "numeric" })}까지
                                                        </span>
                                                    </div>
                                                    {!applicable && (
                                                        <p className="text-xs mt-1 font-semibold" style={{ color: "var(--toss-red)" }}>
                                                            최소 {uc.coupon.minOrderAmount.toLocaleString()}원 이상 주문 필요
                                                        </p>
                                                    )}
                                                </div>
                                                {applicable && (
                                                    <p className="text-base font-black flex-shrink-0"
                                                        style={{ color: isSelected ? "var(--toss-blue)" : "var(--toss-red)" }}>
                                                        -{discount.toLocaleString()}원
                                                    </p>
                                                )}
                                            </div>
                                        </button>
                                    )
                                })
                            )}
                        </div>
                    </div>
                </>
            )}
        </>
    )
}

// ── 배송 메모 바텀시트 피커 ──────────────────────────────────
function MemoBottomSheet({
    preset,
    custom,
    presets,
    onPresetChange,
    onCustomChange,
}: {
    preset:         string
    custom:         string
    presets:        string[]
    onPresetChange: (v: string) => void
    onCustomChange: (v: string) => void
}) {
    const [open, setOpen]       = useState(false)
    const [visible, setVisible] = useState(false)

    const openSheet = () => {
        setOpen(true)
        setTimeout(() => setVisible(true), 16)
    }

    const closeSheet = () => {
        setVisible(false)
        setTimeout(() => setOpen(false), 300)
    }

    const handleSelect = (value: string) => {
        onPresetChange(value)
        closeSheet()
    }

    useEffect(() => {
        if (!open) return
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") closeSheet() }
        window.addEventListener("keydown", handler)
        return () => window.removeEventListener("keydown", handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open])

    const isCustom      = preset === "직접 입력"
    const displayLabel  = isCustom ? (custom.trim() || "직접 입력") : preset

    return (
        <>
            {/* 트리거 버튼 */}
            <button
                type="button"
                onClick={openSheet}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all"
                style={{
                    border:          "1.5px solid var(--toss-border)",
                    backgroundColor: "#fff",
                }}>
                <MessageSquare className="size-4 flex-shrink-0" style={{ color: "var(--toss-text-tertiary)" }} />
                <span className="flex-1 text-sm truncate" style={{ color: "var(--toss-text-primary)" }}>
                    {displayLabel}
                </span>
                <ChevronDown className="size-4 flex-shrink-0" style={{ color: "var(--toss-text-tertiary)" }} />
            </button>

            {/* 직접 입력 시 텍스트 필드 */}
            {isCustom && (
                <input
                    className={inputCls}
                    style={inputStyle}
                    value={custom}
                    onChange={(e) => onCustomChange(e.target.value)}
                    placeholder="배송 메모를 입력해주세요"
                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--toss-blue)")}
                    onBlur={(e)  => (e.currentTarget.style.borderColor = "var(--toss-border)")}
                    autoFocus
                />
            )}

            {/* 바텀시트 */}
            {open && (
                <>
                    <div
                        className="transition-opacity duration-300"
                        style={{
                            position:        "fixed",
                            inset:           0,
                            zIndex:          50,
                            backgroundColor: "rgba(0,0,0,0.45)",
                            opacity:         visible ? 1 : 0,
                        }}
                        onClick={closeSheet}
                    />
                    <div
                        className="bg-white rounded-t-3xl transition-transform duration-300"
                        style={{
                            position:  "fixed",
                            left:      0,
                            right:     0,
                            bottom:    0,
                            zIndex:    51,
                            maxHeight: "60vh",
                            overflow:  "hidden",
                            boxShadow: "0 -4px 24px rgba(0,0,0,0.12)",
                            transform: visible ? "translateY(0)" : "translateY(100%)",
                        }}>

                        {/* 핸들 */}
                        <div className="flex justify-center pt-3 pb-1">
                            <div className="w-10 h-1 rounded-full" style={{ backgroundColor: "var(--toss-border)" }} />
                        </div>

                        {/* 헤더 */}
                        <div className="flex items-center justify-between px-5 py-4"
                            style={{ borderBottom: "1px solid var(--toss-border)" }}>
                            <p className="text-base font-bold" style={{ color: "var(--toss-text-primary)", letterSpacing: "-0.02em" }}>
                                배송 메모 선택
                            </p>
                            <button type="button" onClick={closeSheet}
                                className="p-1.5 rounded-xl hover:bg-gray-100 transition-colors">
                                <X className="size-5" style={{ color: "var(--toss-text-secondary)" }} />
                            </button>
                        </div>

                        {/* 옵션 목록 */}
                        <div className="overflow-y-auto" style={{ maxHeight: "calc(60vh - 82px)" }}>
                            {presets.map((p, i) => {
                                const isSelected = preset === p
                                return (
                                    <button key={p} type="button"
                                        onClick={() => handleSelect(p)}
                                        className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors hover:bg-gray-50"
                                        style={{
                                            borderBottom:    i < presets.length - 1 ? "1px solid var(--toss-border)" : undefined,
                                            backgroundColor: isSelected ? "var(--toss-blue-light)" : undefined,
                                        }}>
                                        <span className="text-sm font-medium"
                                            style={{ color: isSelected ? "var(--toss-blue)" : "var(--toss-text-primary)" }}>
                                            {p}
                                        </span>
                                        {isSelected && (
                                            <Check className="size-4" style={{ color: "var(--toss-blue)" }} />
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </>
            )}
        </>
    )
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────
export default function OrderForm({
    profile,
    availableCoupons,
}: {
    profile:          InitialProfile
    availableCoupons: UserCoupon[]
}) {
    const { items, clearCart } = useCart()

    // 배송 정보
    const [recipientName, setRecipientName] = useState(profile.name  ?? "")
    const [phone, setPhone]                 = useState(profile.phone ?? "")
    const [address, setAddress]             = useState<AddressValue>({
        postalCode:    profile.postalCode    ?? "",
        address:       profile.address       ?? "",
        addressDetail: profile.addressDetail ?? "",
    })
    const [memoPreset, setMemoPreset] = useState(MEMO_PRESETS[0])
    const [memoCustom, setMemoCustom] = useState("")

    // 결제 수단
    const [paymentMethod, setPaymentMethod] = useState("card")

    // 쿠폰 선택 state
    const cartCoupons:    UserCoupon[] = availableCoupons.filter((uc) => uc.coupon.type === "cart")
    const productCoupons: UserCoupon[] = availableCoupons.filter((uc) => uc.coupon.type === "product")

    const [selectedCartCoupon, setSelectedCartCoupon]         = useState<UserCoupon | null>(null)
    // 상품별 쿠폰: productId → UserCoupon
    const [productCouponMap, setProductCouponMap]             = useState<Record<string, UserCoupon | null>>({})

    // 제출 상태
    const [submitting, setSubmitting] = useState(false)
    const [error, setError]           = useState<string | null>(null)

    const itemsTotal  = items.reduce((s, i) => s + i.product.price * i.quantity, 0)
    const shippingFee = itemsTotal >= FREE_SHIPPING_MIN ? 0 : SHIPPING_FEE
    const memo        = memoPreset === "직접 입력" ? memoCustom : memoPreset

    // 쿠폰 할인액 계산
    const cartDiscount = selectedCartCoupon
        ? calcDiscount(selectedCartCoupon.coupon, itemsTotal)
        : 0

    const productDiscountTotal = items.reduce((sum, item) => {
        const uc = productCouponMap[item.product.id]
        if (!uc) return sum
        return sum + calcDiscount(uc.coupon, item.product.price * item.quantity)
    }, 0)

    const totalDiscount = cartDiscount + productDiscountTotal
    const totalPrice    = Math.max(0, itemsTotal + shippingFee - totalDiscount)

    // 이미 다른 상품에 적용된 쿠폰은 중복 선택 불가
    const usedProductCouponIds = new Set(
        Object.values(productCouponMap).filter(Boolean).map((uc) => uc!.id)
    )

    const availableProductCouponsFor = (productId: string): UserCoupon[] => {
        const currentId = productCouponMap[productId]?.id
        return productCoupons.filter(
            (uc) => uc.id === currentId || !usedProductCouponIds.has(uc.id)
        )
    }

    const handleSubmit = async () => {
        setError(null)

        // 클라이언트 사전 검증
        if (!recipientName.trim()) { setError("받는 분 이름을 입력해주세요."); return }
        if (!phone.trim())         { setError("연락처를 입력해주세요."); return }
        if (!/^\d{2,3}-\d{3,4}-\d{4}$/.test(phone.trim())) {
            setError("올바른 전화번호 형식이 아닙니다. (예: 010-1234-5678)")
            return
        }
        if (!address.postalCode.trim()) { setError("배송지 주소를 입력해주세요."); return }
        if (!address.addressDetail.trim()) { setError("상세 주소를 입력해주세요."); return }

        setSubmitting(true)
        try {
            // 상품쿠폰 매핑: itemIndex → userCouponId
            const itemCoupons = items
                .map((item, idx) => ({
                    itemIndex:    idx,
                    userCouponId: productCouponMap[item.product.id]?.id ?? null,
                }))
                .filter((x) => x.userCouponId !== null) as { itemIndex: number; userCouponId: string }[]

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
                cartCouponId: selectedCartCoupon?.id ?? null,
                itemCoupons,
            })

            const tossPayments = await loadTossPayments(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!)
            const payment      = tossPayments.payment({ customerKey: ANONYMOUS })

            const orderName = items.length === 1
                ? items[0].product.name
                : `${items[0].product.name} 외 ${items.length - 1}개`

            const base = {
                amount:              { currency: "KRW" as const, value: totalPrice },
                orderId,
                orderName,
                successUrl:          `${window.location.origin}/order/complete/${orderId}`,
                failUrl:             `${window.location.origin}/order/fail`,
                customerName:        recipientName,
                customerMobilePhone: phone.replace(/-/g, ""),
            }

            if (paymentMethod === "transfer") {
                await payment.requestPayment({ ...base, method: "TRANSFER" })
            } else {
                await payment.requestPayment({ ...base, method: "CARD" })
            }
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
                <a href="/products" className="px-5 py-2.5 rounded-full text-sm font-semibold text-white"
                    style={{ backgroundColor: "var(--toss-blue)" }}>
                    쇼핑 계속하기
                </a>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

            {/* ── 왼쪽 ── */}
            <div className="lg:col-span-7 space-y-4">

                {/* 주문 상품 */}
                <Section icon={<ShoppingBag className="size-4" />} title={`주문 상품 ${items.length}개`}>
                    <ul className="space-y-4">
                        {items.map((item) => {
                            const itemDiscount = productCouponMap[item.product.id]
                                ? calcDiscount(productCouponMap[item.product.id]!.coupon, item.product.price * item.quantity)
                                : 0
                            return (
                                <li key={item.product.id} className="space-y-2">
                                    <div className="flex gap-3">
                                        <div className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden text-2xl"
                                            style={{ backgroundColor: "var(--toss-page-bg)" }}>
                                            {item.product.images?.[0]
                                                ? <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                                                : item.product.emoji
                                            }
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold line-clamp-1" style={{ color: "var(--toss-text-primary)" }}>
                                                {item.product.name}
                                            </p>
                                            <p className="text-xs mt-0.5" style={{ color: "var(--toss-text-tertiary)" }}>수량 {item.quantity}개</p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-sm font-black" style={{ color: "var(--toss-text-primary)" }}>
                                                {(item.product.price * item.quantity).toLocaleString()}원
                                            </p>
                                            {itemDiscount > 0 && (
                                                <p className="text-xs font-bold" style={{ color: "var(--toss-red)" }}>
                                                    -{itemDiscount.toLocaleString()}원
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* 상품별 쿠폰 선택 */}
                                    {productCoupons.length > 0 && (
                                        <div className="ml-[68px]">
                                            <CouponBottomSheet
                                                coupons={availableProductCouponsFor(item.product.id)}
                                                selected={productCouponMap[item.product.id] ?? null}
                                                baseAmount={item.product.price * item.quantity}
                                                placeholder="상품 쿠폰 선택"
                                                title="상품 쿠폰 선택"
                                                onChange={(uc) => setProductCouponMap((prev) => ({ ...prev, [item.product.id]: uc }))}
                                            />
                                        </div>
                                    )}
                                </li>
                            )
                        })}
                    </ul>
                </Section>

                {/* 쿠폰 적용 — 항상 표시 */}
                <Section icon={<Ticket className="size-4" />} title="쿠폰 적용">
                    <div className="space-y-4">
                        <Field label="장바구니 쿠폰">
                            <CouponBottomSheet
                                coupons={cartCoupons}
                                selected={selectedCartCoupon}
                                baseAmount={itemsTotal}
                                placeholder="쿠폰을 선택해 주세요"
                                title="장바구니 쿠폰 선택"
                                onChange={setSelectedCartCoupon}
                            />
                        </Field>

                        {/* 할인 요약 */}
                        {totalDiscount > 0 && (
                            <div className="flex items-center justify-between px-4 py-3 rounded-2xl"
                                style={{ backgroundColor: "#FFF5F5" }}>
                                <span className="text-sm font-semibold" style={{ color: "var(--toss-red)" }}>
                                    쿠폰 할인 합계
                                </span>
                                <span className="text-base font-black" style={{ color: "var(--toss-red)" }}>
                                    -{totalDiscount.toLocaleString()}원
                                </span>
                            </div>
                        )}
                    </div>
                </Section>

                {/* 배송 정보 */}
                <Section icon={<Truck className="size-4" />} title="배송 정보">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="받는 분" required>
                                <input className={inputCls} style={inputStyle} value={recipientName}
                                    onChange={(e) => setRecipientName(e.target.value)} placeholder="이름 입력"
                                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--toss-blue)")}
                                    onBlur={(e)  => (e.currentTarget.style.borderColor = "var(--toss-border)")} />
                            </Field>
                            <Field label="연락처" required>
                                <input className={inputCls} style={inputStyle} value={phone}
                                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                                    placeholder="010-0000-0000" inputMode="tel"
                                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--toss-blue)")}
                                    onBlur={(e)  => (e.currentTarget.style.borderColor = "var(--toss-border)")} />
                            </Field>
                        </div>
                        <Field label="배송 주소" required>
                            <AddressInput value={address} onChange={setAddress} />
                        </Field>
                        <Field label="배송 메모">
                            <MemoBottomSheet
                                preset={memoPreset}
                                custom={memoCustom}
                                presets={MEMO_PRESETS}
                                onPresetChange={setMemoPreset}
                                onCustomChange={setMemoCustom}
                            />
                        </Field>
                    </div>
                </Section>
            </div>

            {/* ── 오른쪽 ── */}
            <div className="lg:col-span-5 lg:sticky lg:top-[80px] space-y-4">

                {/* 결제 수단 */}
                <Section icon={<CreditCard className="size-4" />} title="결제 수단">
                    <div className="grid grid-cols-1 gap-2">
                        {PAYMENT_METHODS.map((pm) => (
                            <motion.button key={pm.id}
                                whileTap={pm.ready ? { scale: 0.98 } : {}}
                                onClick={() => pm.ready && setPaymentMethod(pm.id)}
                                disabled={!pm.ready}
                                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all text-left"
                                style={{
                                    border:           paymentMethod === pm.id ? "1.5px solid var(--toss-blue)" : "1.5px solid var(--toss-border)",
                                    backgroundColor:  !pm.ready ? "var(--toss-page-bg)" : paymentMethod === pm.id ? "var(--toss-blue-light)" : "#fff",
                                    color:            !pm.ready ? "var(--toss-text-tertiary)" : paymentMethod === pm.id ? "var(--toss-blue)" : "var(--toss-text-primary)",
                                    cursor:           pm.ready ? "pointer" : "default",
                                    opacity:          pm.ready ? 1 : 0.6,
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

                {/* 결제 금액 */}
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

                    {totalDiscount > 0 && (
                        <div className="flex justify-between text-sm font-semibold" style={{ color: "var(--toss-red)" }}>
                            <span>쿠폰 할인</span>
                            <span>-{totalDiscount.toLocaleString()}원</span>
                        </div>
                    )}

                    <div className="flex justify-between items-center pt-3 mt-1"
                        style={{ borderTop: "1px solid var(--toss-border)" }}>
                        <span className="text-base font-bold" style={{ color: "var(--toss-text-primary)" }}>최종 결제금액</span>
                        <span className="text-xl font-black" style={{ color: "var(--toss-blue)" }}>
                            {totalPrice.toLocaleString()}원
                        </span>
                    </div>

                    {error && (
                        <p className="text-xs font-medium px-1" style={{ color: "var(--toss-red)" }}>{error}</p>
                    )}

                    <motion.button data-ui-id="btn-order-submit"
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="w-full py-4 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-50 mt-2"
                        style={{ backgroundColor: "var(--toss-blue)" }}>
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
