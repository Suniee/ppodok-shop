// 쿠폰 순수 유틸리티 — 서버/클라이언트 공용, DB 의존성 없음

export type CouponType   = "product" | "cart"
export type DiscountType = "fixed"   | "rate"

export type Coupon = {
    id:                 string
    code:               string
    name:               string
    type:               CouponType
    discountType:       DiscountType
    discountValue:      number
    minOrderAmount:     number
    maxDiscountAmount:  number | null
    validFrom:          string
    validUntil:         string
    usageLimit:         number | null
    usageCount:         number
    isActive:           boolean
    createdAt:          string
    // product 쿠폰 전용: 상품 지정(productIds) 또는 카테고리 지정(categoryIds) 중 하나 사용. 둘 다 NULL이면 전체 적용.
    productIds:         string[]  | null
    categoryIds:        number[]  | null
}

export type UserCoupon = {
    id:       string
    userId:   string
    couponId: string
    coupon:   Coupon
    issuedAt: string
    usedAt:   string | null
    orderId:  string | null
    isUsed:   boolean
}

export type CouponInput = Omit<Coupon, "id" | "usageCount" | "createdAt">

// 쿠폰 발급 내역 (어드민 쿠폰 발급 화면용)
export type CouponIssuance = {
    id:       string
    userId:   string
    userName: string | null
    email:    string
    phone:    string | null
    issuedAt: string
    usedAt:   string | null
    isUsed:   boolean
    orderId:  string | null
}

// 쿠폰 유효 여부 (기간 + 활성화)
export function isCouponValid(coupon: Coupon): boolean {
    const now = new Date()
    return coupon.isActive
        && new Date(coupon.validFrom)  <= now
        && new Date(coupon.validUntil) >= now
}

// 할인액 계산 — baseAmount: 쿠폰이 적용될 금액
export function calcDiscount(coupon: Coupon, baseAmount: number): number {
    if (!isCouponValid(coupon)) return 0
    if (baseAmount < coupon.minOrderAmount) return 0

    let discount = coupon.discountType === "fixed"
        ? coupon.discountValue
        : Math.floor(baseAmount * coupon.discountValue / 100)

    if (coupon.maxDiscountAmount !== null) {
        discount = Math.min(discount, coupon.maxDiscountAmount)
    }

    return Math.min(discount, baseAmount)
}
