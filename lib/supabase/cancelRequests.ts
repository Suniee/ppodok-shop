import { createAdminClient } from "./admin"

export type CancelRequestType   = "exchange" | "refund"
export type CancelRequestStatus = "pending"  | "approved" | "rejected"

export type CancelRequest = {
    id:        string
    orderId:   string
    type:      CancelRequestType
    reason:    string
    status:    CancelRequestStatus
    adminNote: string | null
    createdAt: string
    updatedAt: string
}

export type AdminCancelRequest = CancelRequest & {
    recipientName: string
    totalPrice:    number
    itemsSummary:  string
}

export const CANCEL_REQUEST_TYPE_LABEL: Record<CancelRequestType, string> = {
    exchange: "교환",
    refund:   "환불",
}

export const CANCEL_REQUEST_STATUS_LABEL: Record<CancelRequestStatus, string> = {
    pending:  "처리 대기",
    approved: "승인",
    rejected: "거절",
}

function rowToCancelRequest(row: Record<string, unknown>): CancelRequest {
    return {
        id:        row.id        as string,
        orderId:   row.order_id  as string,
        type:      row.type      as CancelRequestType,
        reason:    row.reason    as string,
        status:    row.status    as CancelRequestStatus,
        adminNote: row.admin_note as string | null,
        createdAt: row.created_at as string,
        updatedAt: row.updated_at as string,
    }
}

// 여러 orderId에 대한 cancel_request 전체 이력을 한 번에 조회 (프론트 주문 목록용)
export async function fetchCancelRequestsByOrderIds(
    orderIds: string[]
): Promise<Record<string, CancelRequest[]>> {
    if (orderIds.length === 0) return {}
    const admin = createAdminClient()
    const { data, error } = await admin
        .from("cancel_requests")
        .select("*")
        .in("order_id", orderIds)
        .order("created_at", { ascending: false })

    if (error || !data) return {}

    // 주문별 전체 이력 배열로 그룹핑
    const map: Record<string, CancelRequest[]> = {}
    for (const row of data as Record<string, unknown>[]) {
        const req = rowToCancelRequest(row)
        if (!map[req.orderId]) map[req.orderId] = []
        map[req.orderId].push(req)
    }
    return map
}

export async function createCancelRequest(
    orderId: string,
    type:    CancelRequestType,
    reason:  string
): Promise<void> {
    const admin = createAdminClient()
    const { error } = await admin
        .from("cancel_requests")
        .insert({ order_id: orderId, type, reason })

    if (error) throw new Error(error.message)
}

export async function fetchAllCancelRequestsForAdmin(): Promise<AdminCancelRequest[]> {
    const admin = createAdminClient()
    const { data, error } = await admin
        .from("cancel_requests")
        .select("*, orders(recipient_name, total_price, order_items(product_name))")
        .order("created_at", { ascending: false })
        .limit(500)

    if (error || !data) return []

    return (data as Record<string, unknown>[]).map((row) => {
        const order = row.orders as {
            recipient_name: string
            total_price:    number
            order_items:    { product_name: string }[]
        } | null

        const items       = order?.order_items ?? []
        const firstName   = items[0]?.product_name ?? "상품"
        const itemsSummary = items.length > 1
            ? `${firstName} 외 ${items.length - 1}개`
            : firstName

        return {
            ...rowToCancelRequest(row),
            recipientName: order?.recipient_name ?? "-",
            totalPrice:    order?.total_price    ?? 0,
            itemsSummary,
        }
    })
}

export async function updateCancelRequestStatus(
    id:        string,
    status:    CancelRequestStatus,
    adminNote?: string
): Promise<void> {
    const admin = createAdminClient()
    const { error } = await admin
        .from("cancel_requests")
        .update({ status, admin_note: adminNote ?? null, updated_at: new Date().toISOString() })
        .eq("id", id)

    if (error) throw new Error(error.message)
}
