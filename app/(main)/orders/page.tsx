import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { fetchMyOrders } from "@/lib/supabase/orders"
import OrdersClient from "./OrdersClient"

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
