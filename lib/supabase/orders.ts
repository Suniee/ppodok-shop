import { createAdminClient } from "./admin"

export type OrderStatus = "pending" | "confirmed" | "shipping" | "delivered" | "purchase_confirmed" | "review_written" | "cancelled"

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
    pending:            "결제 대기",
    confirmed:          "주문 확인",
    shipping:           "배송 중",
    delivered:          "배송 완료",
    purchase_confirmed: "구매 확정",
    review_written:     "리뷰 작성",
    cancelled:          "취소됨",
}

export type OrderItem = {
    id: string
    productId: string
    productName: string
    price: number
    quantity: number
    emoji: string | null
    imageUrl: string | null
}

export type Order = {
    id: string
    userId: string | null
    status: OrderStatus
    recipientName: string
    phone: string
    postalCode: string
    address: string
    addressDetail: string | null
    memo: string | null
    itemsTotal: number
    shippingFee: number
    totalPrice: number
    paymentMethod: string
    createdAt: string
    items: OrderItem[]
}

export type AdminOrder = {
    id: string
    status: OrderStatus
    recipientName: string
    phone: string
    itemsSummary: string   // "상품명 외 N개" 형태
    itemsTotal: number
    shippingFee: number
    totalPrice: number
    paymentMethod: string
    createdAt: string
}

export async function fetchAllOrdersForAdmin(): Promise<AdminOrder[]> {
    const admin = createAdminClient()
    const { data, error } = await admin
        .from("orders")
        .select("*, order_items(product_name)")
        .order("created_at", { ascending: false })
        .limit(500)

    if (error || !data) return []

    return data.map((row: Record<string, unknown>) => {
        const items = (row.order_items as { product_name: string }[]) ?? []
        const firstName = items[0]?.product_name ?? "상품"
        const itemsSummary = items.length > 1
            ? `${firstName} 외 ${items.length - 1}개`
            : firstName

        return {
            id:            row.id as string,
            status:        row.status as OrderStatus,
            recipientName: row.recipient_name as string,
            phone:         row.phone as string,
            itemsSummary,
            itemsTotal:    row.items_total as number,
            shippingFee:   row.shipping_fee as number,
            totalPrice:    row.total_price as number,
            paymentMethod: row.payment_method as string,
            createdAt:     row.created_at as string,
        }
    })
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
    const admin = createAdminClient()
    await admin.from("orders").update({ status }).eq("id", id)
}

export async function fetchOrderById(id: string): Promise<Order | null> {
    const admin = createAdminClient()
    const { data, error } = await admin
        .from("orders")
        .select("*, order_items(*)")
        .eq("id", id)
        .single()

    if (error || !data) return null

    return {
        id: data.id,
        userId: data.user_id,
        status: data.status as OrderStatus,
        recipientName: data.recipient_name,
        phone: data.phone,
        postalCode: data.postal_code,
        address: data.address,
        addressDetail: data.address_detail,
        memo: data.memo,
        itemsTotal: data.items_total,
        shippingFee: data.shipping_fee,
        totalPrice: data.total_price,
        paymentMethod: data.payment_method,
        createdAt: data.created_at,
        items: (data.order_items ?? []).map((i: Record<string, unknown>) => ({
            id: i.id as string,
            productId: i.product_id as string,
            productName: i.product_name as string,
            price: i.price as number,
            quantity: i.quantity as number,
            emoji: i.emoji as string | null,
            imageUrl: i.image_url as string | null,
        })),
    }
}
