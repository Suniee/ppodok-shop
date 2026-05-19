"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { validateUserCoupon, calcDiscount, markCouponUsed } from "@/lib/supabase/coupons"

export type OrderItemInput = {
    productId:   string
    productName: string
    price:       number
    quantity:    number
    emoji:       string
    imageUrl:    string | null
}

export type CreateOrderInput = {
    recipientName: string
    phone:         string
    postalCode:    string
    address:       string
    addressDetail: string
    memo:          string
    paymentMethod: string
    items:         OrderItemInput[]
    cartCouponId:  string | null
    // 상품별 쿠폰: itemIndex(items 배열 인덱스) → userCouponId
    itemCoupons:   { itemIndex: number; userCouponId: string }[]
}

const FREE_SHIPPING_MIN = 50_000
const SHIPPING_FEE      = 3_000

export async function createOrderAction(input: CreateOrderInput): Promise<string> {
    if (!input.recipientName.trim()) throw new Error("받는 분 이름을 입력해주세요.")
    if (!input.phone.trim())         throw new Error("연락처를 입력해주세요.")
    if (!input.postalCode.trim())    throw new Error("배송지 주소를 입력해주세요.")
    if (input.items.length === 0)    throw new Error("주문 상품이 없습니다.")

    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("로그인이 필요합니다.")

    const admin = createAdminClient()

    // ── 쿠폰 검증 ─────────────────────────────────────────────
    let cartCouponResult:   Awaited<ReturnType<typeof validateUserCoupon>> | null = null
    const itemCouponResults: Map<number, Awaited<ReturnType<typeof validateUserCoupon>>> = new Map()

    if (input.cartCouponId) {
        cartCouponResult = await validateUserCoupon(input.cartCouponId, user.id)
        if (!cartCouponResult.valid) throw new Error(`장바구니 쿠폰: ${cartCouponResult.message}`)
    }

    for (const ic of input.itemCoupons) {
        const res = await validateUserCoupon(ic.userCouponId, user.id)
        if (!res.valid) throw new Error(`상품 쿠폰: ${res.message}`)
        if (res.userCoupon?.coupon.type !== "product") throw new Error("상품 쿠폰만 상품에 적용할 수 있습니다.")
        itemCouponResults.set(ic.itemIndex, res)
    }

    // ── 금액 계산 ──────────────────────────────────────────────
    const itemsTotal  = input.items.reduce((s, i) => s + i.price * i.quantity, 0)
    const shippingFee = itemsTotal >= FREE_SHIPPING_MIN ? 0 : SHIPPING_FEE

    // 장바구니 쿠폰 할인
    const cartDiscount = cartCouponResult?.userCoupon
        ? calcDiscount(cartCouponResult.userCoupon.coupon, itemsTotal)
        : 0

    // 상품별 쿠폰 할인 계산
    const itemDiscounts: number[] = input.items.map((item, idx) => {
        const r = itemCouponResults.get(idx)
        if (!r?.userCoupon) return 0
        const baseAmount = item.price * item.quantity
        if (baseAmount < r.userCoupon.coupon.minOrderAmount) return 0
        return calcDiscount(r.userCoupon.coupon, baseAmount)
    })
    const productDiscountTotal = itemDiscounts.reduce((s, d) => s + d, 0)

    const totalDiscount = cartDiscount + productDiscountTotal
    const totalPrice    = Math.max(0, itemsTotal + shippingFee - totalDiscount)

    // ── 주문 저장 ──────────────────────────────────────────────
    const { data: order, error: orderError } = await admin
        .from("orders")
        .insert({
            user_id:        user.id,
            status:         "pending",
            recipient_name: input.recipientName,
            phone:          input.phone,
            postal_code:    input.postalCode,
            address:        input.address,
            address_detail: input.addressDetail || null,
            memo:           input.memo || null,
            items_total:    itemsTotal,
            shipping_fee:   shippingFee,
            total_price:    totalPrice,
            payment_method: input.paymentMethod,
            cart_coupon_id: input.cartCouponId ?? null,
            cart_discount:  cartDiscount,
        })
        .select("id")
        .single()

    if (orderError) throw new Error(orderError.message)

    // ── 주문 상품 저장 ─────────────────────────────────────────
    const { error: itemsError } = await admin
        .from("order_items")
        .insert(
            input.items.map((i, idx) => ({
                order_id:       order.id,
                product_id:     i.productId,
                product_name:   i.productName,
                price:          i.price,
                quantity:       i.quantity,
                emoji:          i.emoji,
                image_url:      i.imageUrl,
                user_coupon_id: itemCouponResults.get(idx)?.userCoupon?.id ?? null,
                coupon_discount: itemDiscounts[idx] ?? 0,
            }))
        )

    if (itemsError) throw new Error(itemsError.message)

    // ── 사용된 쿠폰 처리 ──────────────────────────────────────
    const couponMarkPromises: Promise<void>[] = []

    if (input.cartCouponId) {
        couponMarkPromises.push(markCouponUsed(input.cartCouponId, order.id))
    }
    for (const ic of input.itemCoupons) {
        couponMarkPromises.push(markCouponUsed(ic.userCouponId, order.id))
    }

    await Promise.all(couponMarkPromises)

    return order.id
}
