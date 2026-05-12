import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { Order, OrderStatus } from "@/lib/supabase/orders"
import OrdersClient from "./OrdersClient"

// 서버 전용 — next/headers 의존성이 있어 orders.ts에 두지 않음
async function fetchMyOrders(): Promise<Order[]> {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false })

    if (error || !data) return []

    return data.map((row: Record<string, unknown>) => ({
        id:            row.id as string,
        userId:        row.user_id as string | null,
        status:        row.status as OrderStatus,
        recipientName: row.recipient_name as string,
        phone:         row.phone as string,
        postalCode:    row.postal_code as string,
        address:       row.address as string,
        addressDetail: row.address_detail as string | null,
        memo:          row.memo as string | null,
        itemsTotal:    row.items_total as number,
        shippingFee:   row.shipping_fee as number,
        totalPrice:    row.total_price as number,
        paymentMethod: row.payment_method as string,
        createdAt:     row.created_at as string,
        items: ((row.order_items as Record<string, unknown>[]) ?? []).map((i) => ({
            id:          i.id as string,
            productId:   i.product_id as string,
            productName: i.product_name as string,
            price:       i.price as number,
            quantity:    i.quantity as number,
            emoji:       i.emoji as string | null,
            imageUrl:    i.image_url as string | null,
        })),
    }))
}

export default async function OrdersPage() {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect("/login")

    const orders = await fetchMyOrders()

    return (
        <div className="max-w-xl mx-auto px-5 py-10">
            <div className="mb-8">
                <h1
                    className="text-2xl font-black"
                    style={{ color: "var(--toss-text-primary)", letterSpacing: "-0.03em" }}
                >
                    주문/취소 내역
                </h1>
                <p className="text-sm mt-1" style={{ color: "var(--toss-text-secondary)" }}>
                    총 {orders.length}건의 주문
                </p>
            </div>

            <OrdersClient orders={orders} />
        </div>
    )
}
