"use server"

import { revalidatePath } from "next/cache"
import { fetchAllOrdersForAdmin, updateOrderStatus } from "@/lib/supabase/orders"
import type { AdminOrder, OrderStatus } from "@/lib/supabase/orders"
import type { CancelRequestType, CancelRequestStatus } from "@/lib/supabase/cancelRequests"
import { createAdminClient } from "@/lib/supabase/admin"

export type OrderCounts = Record<OrderStatus | "all", number>

export async function updateOrderStatusAction(id: string, status: OrderStatus): Promise<void> {
    await updateOrderStatus(id, status)
    revalidatePath("/admin/sales")
}

export async function fetchOrdersAction(
    startDate?: string,
    endDate?:   string,
): Promise<AdminOrder[]> {
    return fetchAllOrdersForAdmin(startDate, endDate)
}

export async function fetchOrdersPagedAction(
    page: number,
    pageSize: number,
    status: OrderStatus | "all",
    query: string,
    startDate?: string,
    endDate?: string,
): Promise<{ items: AdminOrder[]; total: number; counts: OrderCounts }> {
    const admin = createAdminClient()
    const from  = (page - 1) * pageSize
    const to    = from + pageSize - 1
    const q     = query.trim()

    const emptyC: OrderCounts = { all: 0, pending: 0, confirmed: 0, shipping: 0, delivered: 0, purchase_confirmed: 0, review_written: 0, cancelled: 0 }

    let builder = admin
        .from("orders")
        .select("*, order_items(product_name), cancel_requests(type, status, created_at)", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to)

    if (status !== "all") builder = builder.eq("status", status)
    if (startDate) builder = builder.gte("created_at", `${startDate}T00:00:00+09:00`)
    if (endDate)   builder = builder.lte("created_at", `${endDate}T23:59:59+09:00`)
    if (q)         builder = builder.or(`recipient_name.ilike.%${q}%,id.ilike.%${q}%`)

    const { data, count, error } = await builder
    if (error || !data) return { items: [], total: 0, counts: emptyC }

    const items: AdminOrder[] = (data as Record<string, unknown>[]).map((row) => {
        const orderItems   = (row.order_items as { product_name: string }[]) ?? []
        const firstName    = orderItems[0]?.product_name ?? "상품"
        const itemsSummary = orderItems.length > 1 ? `${firstName} 외 ${orderItems.length - 1}개` : firstName
        const cancelRows   = (row.cancel_requests as { type: string; status: string; created_at: string }[]) ?? []
        const pending      = cancelRows.find((r) => r.status === "pending")
        const latest       = cancelRows.sort((a, b) => b.created_at.localeCompare(a.created_at))[0]
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

    // 날짜 범위 내 상태별 카운트 (탭 뱃지용 — status/검색 필터 미적용)
    let countQ = admin.from("orders").select("status")
    if (startDate) countQ = countQ.gte("created_at", `${startDate}T00:00:00+09:00`)
    if (endDate)   countQ = countQ.lte("created_at", `${endDate}T23:59:59+09:00`)

    const { data: countRows } = await countQ
    const counts: OrderCounts = { ...emptyC }
    for (const r of countRows ?? []) {
        counts.all++
        if (r.status in counts) counts[r.status as OrderStatus]++
    }

    return { items, total: count ?? 0, counts }
}
