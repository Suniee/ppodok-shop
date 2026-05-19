import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { fetchMyAllCoupons } from "@/lib/supabase/coupons"
import { calcDiscount, isCouponValid } from "@/lib/supabase/coupon-utils"
import type { UserCoupon } from "@/lib/supabase/coupon-utils"
import { Ticket } from "lucide-react"

function couponStatus(uc: UserCoupon): "available" | "used" | "expired" {
    if (uc.isUsed)                return "used"
    if (!isCouponValid(uc.coupon)) return "expired"
    return "available"
}

const STATUS_META = {
    available: { label: "사용 가능",  bg: "#E8F8F5", color: "#00A878" },
    used:      { label: "사용 완료",  bg: "#F2F4F6", color: "#8B95A1" },
    expired:   { label: "기간 만료",  bg: "#FFF0F0", color: "#FF4E4E" },
}

function discountText(uc: UserCoupon): string {
    const c = uc.coupon
    if (c.discountType === "fixed") return `${c.discountValue.toLocaleString()}원 할인`
    let s = `${c.discountValue}% 할인`
    if (c.maxDiscountAmount) s += ` (최대 ${c.maxDiscountAmount.toLocaleString()}원)`
    return s
}

function CouponCard({ uc }: { uc: UserCoupon }) {
    const status = couponStatus(uc)
    const meta   = STATUS_META[status]
    const c      = uc.coupon

    return (
        <div
            data-ui-id={`card-coupon-${uc.id}`}
            className="bg-white rounded-3xl overflow-hidden"
            style={{
                border:  "1px solid var(--toss-border)",
                opacity: status === "available" ? 1 : 0.6,
            }}
        >
            {/* 상단 컬러 바 + 할인 정보 */}
            <div
                className="px-5 py-5 flex items-center justify-between"
                style={{ backgroundColor: status === "available" ? "var(--toss-blue-light)" : "var(--toss-page-bg)" }}
            >
                <div>
                    <p className="text-xs font-bold mb-1" style={{ color: "var(--toss-text-secondary)" }}>
                        {c.type === "cart" ? "장바구니 쿠폰" : "상품 쿠폰"}
                    </p>
                    <p
                        className="text-2xl font-black"
                        style={{ color: status === "available" ? "var(--toss-blue)" : "var(--toss-text-tertiary)", letterSpacing: "-0.03em" }}
                    >
                        {discountText(uc)}
                    </p>
                    {c.minOrderAmount > 0 && (
                        <p className="text-xs mt-0.5" style={{ color: "var(--toss-text-tertiary)" }}>
                            {c.minOrderAmount.toLocaleString()}원 이상 주문 시
                        </p>
                    )}
                </div>
                <Ticket
                    className="size-10 flex-shrink-0 ml-4"
                    style={{ color: status === "available" ? "var(--toss-blue)" : "var(--toss-text-tertiary)", opacity: 0.5 }}
                />
            </div>

            {/* 하단: 쿠폰 상세 */}
            <div className="px-5 py-4 flex items-center justify-between gap-3"
                style={{ borderTop: "1px dashed var(--toss-border)" }}>
                <div className="min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: "var(--toss-text-primary)" }}>{c.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--toss-text-tertiary)" }}>
                        {new Date(c.validFrom).toLocaleDateString("ko-KR")} ~{" "}
                        {new Date(c.validUntil).toLocaleDateString("ko-KR")}
                    </p>
                    <p className="text-[11px] font-mono mt-0.5" style={{ color: "var(--toss-text-tertiary)" }}>{c.code}</p>
                </div>
                <span
                    className="text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                    style={{ backgroundColor: meta.bg, color: meta.color }}
                >
                    {meta.label}
                </span>
            </div>
        </div>
    )
}

export default async function CouponsPage() {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/login?next=/coupons")

    const all       = await fetchMyAllCoupons(user.id)
    const available = all.filter((uc) => couponStatus(uc) === "available")
    const used      = all.filter((uc) => couponStatus(uc) === "used")
    const expired   = all.filter((uc) => couponStatus(uc) === "expired")

    return (
        <div data-ui-id="page-coupons" className="max-w-2xl mx-auto px-5 py-8 pb-16">
            <div className="mb-6 flex items-center gap-3">
                <Ticket className="size-6" style={{ color: "var(--toss-blue)" }} />
                <div>
                    <h1 className="text-xl font-black" style={{ color: "var(--toss-text-primary)", letterSpacing: "-0.03em" }}>쿠폰함</h1>
                    <p className="text-sm mt-0.5" style={{ color: "var(--toss-text-secondary)" }}>
                        사용 가능 {available.length}장 · 전체 {all.length}장
                    </p>
                </div>
            </div>

            {all.length === 0 ? (
                <div className="flex flex-col items-center py-20 gap-3">
                    <Ticket className="size-14 opacity-20" style={{ color: "var(--toss-text-tertiary)" }} />
                    <p className="text-sm font-medium" style={{ color: "var(--toss-text-tertiary)" }}>보유한 쿠폰이 없습니다.</p>
                    <a href="/products"
                        className="mt-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white"
                        style={{ backgroundColor: "var(--toss-blue)" }}>
                        쇼핑 시작하기
                    </a>
                </div>
            ) : (
                <div className="space-y-8">
                    {available.length > 0 && (
                        <section className="space-y-3">
                            <h2 className="text-sm font-bold" style={{ color: "var(--toss-text-secondary)" }}>
                                사용 가능 <span className="font-black" style={{ color: "var(--toss-blue)" }}>{available.length}</span>
                            </h2>
                            {available.map((uc) => <CouponCard key={uc.id} uc={uc} />)}
                        </section>
                    )}
                    {used.length > 0 && (
                        <section className="space-y-3">
                            <h2 className="text-sm font-bold" style={{ color: "var(--toss-text-secondary)" }}>사용 완료</h2>
                            {used.map((uc) => <CouponCard key={uc.id} uc={uc} />)}
                        </section>
                    )}
                    {expired.length > 0 && (
                        <section className="space-y-3">
                            <h2 className="text-sm font-bold" style={{ color: "var(--toss-text-secondary)" }}>기간 만료</h2>
                            {expired.map((uc) => <CouponCard key={uc.id} uc={uc} />)}
                        </section>
                    )}
                </div>
            )}
        </div>
    )
}
