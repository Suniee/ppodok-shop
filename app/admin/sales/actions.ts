"use server"

import { revalidatePath } from "next/cache"
import { updateOrderStatus } from "@/lib/supabase/orders"
import type { OrderStatus } from "@/lib/supabase/orders"

export async function updateOrderStatusAction(id: string, status: OrderStatus): Promise<void> {
    await updateOrderStatus(id, status)
    revalidatePath("/admin/sales")
}
