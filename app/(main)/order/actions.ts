"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export type OrderItemInput = {
    productId: string
    productName: string
    price: number
    quantity: number
    emoji: string
    imageUrl: string | null
}

export type CreateOrderInput = {
    recipientName: string
    phone: string
    postalCode: string
    address: string
    addressDetail: string
    memo: string
    paymentMethod: string
    items: OrderItemInput[]
}

// 5만 원 이상 무료배송
const FREE_SHIPPING_MIN = 50_000
const SHIPPING_FEE = 3_000

// 결제 전 미결(pending) 주문을 먼저 DB에 저장하고 orderId 반환
// 실제 결제 승인은 confirmPaymentAction에서 처리
export async function createOrderAction(input: CreateOrderInput): Promise<string> {
    if (!input.recipientName.trim()) throw new Error("받는 분 이름을 입력해주세요.")
    if (!input.phone.trim())         throw new Error("연락처를 입력해주세요.")
    if (!input.postalCode.trim())    throw new Error("배송지 주소를 입력해주세요.")
    if (input.items.length === 0)    throw new Error("주문 상품이 없습니다.")

    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    const admin = createAdminClient()

    const itemsTotal  = input.items.reduce((s, i) => s + i.price * i.quantity, 0)
    const shippingFee = itemsTotal >= FREE_SHIPPING_MIN ? 0 : SHIPPING_FEE
    const totalPrice  = itemsTotal + shippingFee

    const { data: order, error: orderError } = await admin
        .from("orders")
        .insert({
            user_id:        user?.id ?? null,
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
        })
        .select("id")
        .single()

    if (orderError) throw new Error(orderError.message)

    const { error: itemsError } = await admin
        .from("order_items")
        .insert(
            input.items.map((i) => ({
                order_id:     order.id,
                product_id:   i.productId,
                product_name: i.productName,
                price:        i.price,
                quantity:     i.quantity,
                emoji:        i.emoji,
                image_url:    i.imageUrl,
            }))
        )

    if (itemsError) throw new Error(itemsError.message)

    return order.id
}
