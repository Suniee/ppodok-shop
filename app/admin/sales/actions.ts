"use server"

import { revalidatePath } from "next/cache"
import { fetchAllOrdersForAdmin, updateOrderStatus } from "@/lib/supabase/orders"
import type { AdminOrder, OrderStatus } from "@/lib/supabase/orders"

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
