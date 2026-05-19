import { createAdminClient } from "./admin"
import type { Coupon, CouponType, DiscountType, UserCoupon, CouponInput, CouponIssuance } from "./coupon-utils"

export type { Coupon, CouponType, DiscountType, UserCoupon, CouponInput, CouponIssuance }
export { isCouponValid, calcDiscount } from "./coupon-utils"

// ── 내부 매핑 ──────────────────────────────────────────────────────
function rowToCoupon(r: Record<string, unknown>): Coupon {
    return {
        id:                 r.id                  as string,
        code:               r.code                as string,
        name:               r.name                as string,
        type:               r.type                as CouponType,
        discountType:       r.discount_type       as DiscountType,
        discountValue:      r.discount_value      as number,
        minOrderAmount:     r.min_order_amount    as number,
        maxDiscountAmount:  r.max_discount_amount as number | null,
        validFrom:          r.valid_from          as string,
        validUntil:         r.valid_until         as string,
        usageLimit:         r.usage_limit         as number | null,
        usageCount:         r.usage_count         as number,
        isActive:           r.is_active           as boolean,
        createdAt:          r.created_at          as string,
        productIds:         (r.product_ids  as string[]  | null) ?? null,
        categoryIds:        (r.category_ids as number[]  | null) ?? null,
    }
}

function rowToUserCoupon(r: Record<string, unknown>): UserCoupon {
    return {
        id:       r.id        as string,
        userId:   r.user_id   as string,
        couponId: r.coupon_id as string,
        coupon:   rowToCoupon(r.coupons as Record<string, unknown>),
        issuedAt: r.issued_at as string,
        usedAt:   r.used_at   as string | null,
        orderId:  r.order_id  as string | null,
        isUsed:   r.is_used   as boolean,
    }
}

// ── Admin 함수 ────────────────────────────────────────────────────
export async function fetchCouponsPaged(
    page: number,
    pageSize: number,
    query: string,
): Promise<{ items: Coupon[]; total: number }> {
    const admin = createAdminClient()
    const from  = (page - 1) * pageSize
    const to    = from + pageSize - 1
    const q     = query.trim()

    let qb = admin
        .from("coupons")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to)

    if (q) qb = qb.or(`name.ilike.%${q}%,code.ilike.%${q}%`)

    const { data, count, error } = await qb
    if (error || !data) return { items: [], total: 0 }

    return {
        items: data.map((r) => rowToCoupon(r as Record<string, unknown>)),
        total: count ?? 0,
    }
}

export async function createCoupon(input: CouponInput): Promise<void> {
    const admin = createAdminClient()
    const { error } = await admin.from("coupons").insert({
        code:                 input.code,
        name:                 input.name,
        type:                 input.type,
        discount_type:        input.discountType,
        discount_value:       input.discountValue,
        min_order_amount:     input.minOrderAmount,
        max_discount_amount:  input.maxDiscountAmount ?? null,
        valid_from:           input.validFrom,
        valid_until:          input.validUntil,
        usage_limit:          input.usageLimit ?? null,
        is_active:            input.isActive,
        // product 쿠폰이 아니면 항상 null. product_ids / category_ids 는 배타적으로 사용.
        product_ids:          input.type === "product" ? (input.productIds  ?? null) : null,
        category_ids:         input.type === "product" ? (input.categoryIds ?? null) : null,
    })
    if (error) throw new Error(error.message)
}

export async function updateCoupon(id: string, input: Partial<CouponInput>): Promise<void> {
    const admin = createAdminClient()
    const patch: Record<string, unknown> = {}
    if (input.code               !== undefined) patch.code                = input.code
    if (input.name               !== undefined) patch.name                = input.name
    if (input.type               !== undefined) patch.type                = input.type
    if (input.discountType       !== undefined) patch.discount_type       = input.discountType
    if (input.discountValue      !== undefined) patch.discount_value      = input.discountValue
    if (input.minOrderAmount     !== undefined) patch.min_order_amount    = input.minOrderAmount
    if (input.maxDiscountAmount  !== undefined) patch.max_discount_amount = input.maxDiscountAmount
    if (input.validFrom          !== undefined) patch.valid_from          = input.validFrom
    if (input.validUntil         !== undefined) patch.valid_until         = input.validUntil
    if (input.usageLimit         !== undefined) patch.usage_limit         = input.usageLimit
    if (input.isActive           !== undefined) patch.is_active           = input.isActive
    if (input.productIds  !== undefined || input.categoryIds !== undefined || input.type !== undefined) {
        // product_ids / category_ids 는 배타적으로 사용. type 변경 시 둘 다 덮어씀.
        const resolvedType = input.type ?? "product"
        if (resolvedType === "product") {
            if (input.productIds  !== undefined) patch.product_ids  = input.productIds  ?? null
            if (input.categoryIds !== undefined) patch.category_ids = input.categoryIds ?? null
        } else {
            patch.product_ids  = null
            patch.category_ids = null
        }
    }
    const { error } = await admin.from("coupons").update(patch).eq("id", id)
    if (error) throw new Error(error.message)
}

export async function deleteCoupon(id: string): Promise<void> {
    const admin = createAdminClient()
    const { error } = await admin.from("coupons").delete().eq("id", id)
    if (error) throw new Error(error.message)
}

export async function issueCouponToUser(
    couponId: string,
    userId:   string,
): Promise<{ ok: boolean; message?: string }> {
    const admin = createAdminClient()
    const { error } = await admin
        .from("user_coupons")
        .insert({ coupon_id: couponId, user_id: userId })
    if (error) return { ok: false, message: error.message }
    return { ok: true }
}

// ── 사용자 함수 ───────────────────────────────────────────────────

// 사용 가능한 쿠폰 목록 (주문서에서 사용)
export async function fetchMyAvailableCoupons(userId: string): Promise<UserCoupon[]> {
    const admin = createAdminClient()
    const { data } = await admin
        .from("user_coupons")
        .select("*, coupons(*)")
        .eq("user_id", userId)
        .eq("is_used", false)
        .order("issued_at", { ascending: false })

    const now = new Date()
    return (data ?? [])
        .map((r) => rowToUserCoupon(r as Record<string, unknown>))
        .filter((uc) =>
            uc.coupon.isActive
            && new Date(uc.coupon.validFrom)  <= now
            && new Date(uc.coupon.validUntil) >= now
        )
}

// 전체 쿠폰 목록 (쿠폰함 페이지용)
export async function fetchMyAllCoupons(userId: string): Promise<UserCoupon[]> {
    const admin = createAdminClient()
    const { data } = await admin
        .from("user_coupons")
        .select("*, coupons(*)")
        .eq("user_id", userId)
        .order("issued_at", { ascending: false })

    return (data ?? []).map((r) => rowToUserCoupon(r as Record<string, unknown>))
}

// ── 발급 내역 목록 (어드민 쿠폰 발급 화면용) ─────────────────────
export async function fetchCouponIssuancesPaged(
    couponId: string,
    page:     number,
    pageSize: number,
): Promise<{ items: CouponIssuance[]; total: number }> {
    const admin = createAdminClient()
    const from  = (page - 1) * pageSize
    const to    = from + pageSize - 1

    const { data: ucData, count, error } = await admin
        .from("user_coupons")
        .select("id, user_id, issued_at, used_at, is_used, order_id", { count: "exact" })
        .eq("coupon_id", couponId)
        .order("issued_at", { ascending: false })
        .range(from, to)

    if (error || !ucData) return { items: [], total: 0 }

    // user_id 목록으로 customer_profiles를 별도 조회 (cross-schema join 회피)
    const userIds = ucData.map((r) => r.user_id as string)
    const profileMap = new Map<string, { name: string | null; email: string; phone: string | null }>()
    if (userIds.length > 0) {
        const { data: pData } = await admin
            .from("customer_profiles")
            .select("id, name, email, phone")
            .in("id", userIds)
        for (const p of pData ?? []) {
            profileMap.set(p.id as string, {
                name:  p.name  as string | null,
                email: p.email as string,
                phone: p.phone as string | null,
            })
        }
    }

    return {
        items: ucData.map((r) => {
            const p = profileMap.get(r.user_id as string)
            return {
                id:       r.id       as string,
                userId:   r.user_id  as string,
                userName: p?.name   ?? null,
                email:    p?.email  ?? "(이메일 없음)",
                phone:    p?.phone  ?? null,
                issuedAt: r.issued_at as string,
                usedAt:   r.used_at   as string | null,
                isUsed:   r.is_used   as boolean,
                orderId:  r.order_id  as string | null,
            }
        }),
        total: count ?? 0,
    }
}

// 쿠폰 사용 처리 (주문 생성 시 호출)
export async function markCouponUsed(userCouponId: string, orderId: string): Promise<void> {
    const admin = createAdminClient()

    // user_coupons: 사용 처리
    const { data: uc } = await admin
        .from("user_coupons")
        .update({ is_used: true, used_at: new Date().toISOString(), order_id: orderId })
        .eq("id", userCouponId)
        .select("coupon_id")
        .single()

    // coupons: usage_count 증가 (race condition 허용 — 소규모 쇼핑몰 기준 무시)
    if (uc?.coupon_id) {
        const { data: coupon } = await admin
            .from("coupons")
            .select("usage_count")
            .eq("id", uc.coupon_id)
            .single()
        if (coupon) {
            await admin
                .from("coupons")
                .update({ usage_count: (coupon.usage_count as number) + 1 })
                .eq("id", uc.coupon_id)
        }
    }
}

// 쿠폰 유효성 검증 (Server Action에서 사용)
export async function validateUserCoupon(
    userCouponId: string,
    userId:       string,
): Promise<{ valid: boolean; userCoupon?: UserCoupon; message?: string }> {
    const admin = createAdminClient()
    const { data } = await admin
        .from("user_coupons")
        .select("*, coupons(*)")
        .eq("id", userCouponId)
        .eq("user_id", userId)
        .single()

    if (!data) return { valid: false, message: "쿠폰을 찾을 수 없습니다." }

    const uc = rowToUserCoupon(data as Record<string, unknown>)

    if (uc.isUsed)                      return { valid: false, message: "이미 사용된 쿠폰입니다." }
    if (!uc.coupon.isActive)            return { valid: false, message: "비활성화된 쿠폰입니다." }
    if (new Date(uc.coupon.validFrom)  > new Date()) return { valid: false, message: "아직 사용 기간이 아닙니다." }
    if (new Date(uc.coupon.validUntil) < new Date()) return { valid: false, message: "만료된 쿠폰입니다." }

    if (uc.coupon.usageLimit !== null && uc.coupon.usageCount >= uc.coupon.usageLimit) {
        return { valid: false, message: "쿠폰 사용 한도를 초과했습니다." }
    }

    return { valid: true, userCoupon: uc }
}
