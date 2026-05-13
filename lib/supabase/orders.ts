import { createAdminClient } from "./admin"
import type { CancelRequestType, CancelRequestStatus } from "./cancelRequests"

export type OrderCancelRequest = {
    type:   CancelRequestType
    status: CancelRequestStatus
}

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
    cancelRequest: OrderCancelRequest | null  // 가장 최근 교환/환불 신청 (pending 우선)
}

export async function fetchAllOrdersForAdmin(
    startDate?: string,  // "YYYY-MM-DD" — 포함
    endDate?:   string,  // "YYYY-MM-DD" — 포함 (해당 일 자정까지)
): Promise<AdminOrder[]> {
    const admin = createAdminClient()
    let query = admin
        .from("orders")
        .select("*, order_items(product_name), cancel_requests(type, status, created_at)")
        .order("created_at", { ascending: false })
        .limit(1000)

    if (startDate) query = query.gte("created_at", `${startDate}T00:00:00+09:00`)
    if (endDate)   query = query.lte("created_at", `${endDate}T23:59:59+09:00`)

    const { data, error } = await query

    if (error || !data) return []

    return data.map((row: Record<string, unknown>) => {
        const items = (row.order_items as { product_name: string }[]) ?? []
        const firstName = items[0]?.product_name ?? "상품"
        const itemsSummary = items.length > 1
            ? `${firstName} 외 ${items.length - 1}개`
            : firstName

        // pending 신청을 우선하고, 없으면 가장 최근 신청을 표시
        const cancelRows = (row.cancel_requests as { type: string; status: string; created_at: string }[]) ?? []
        const pending = cancelRows.find((r) => r.status === "pending")
        const latest  = cancelRows.sort((a, b) => b.created_at.localeCompare(a.created_at))[0]
        const cancelRequest = (pending ?? latest)
            ? { type: (pending ?? latest)!.type as CancelRequestType, status: (pending ?? latest)!.status as CancelRequestStatus }
            : null

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
            cancelRequest,
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
