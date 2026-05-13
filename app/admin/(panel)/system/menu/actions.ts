"use server"

import { revalidatePath } from "next/cache"
import { saveMenuConfig } from "@/lib/supabase/menu"
import type { MenuConfig } from "@/lib/admin-menu"

export async function saveMenuConfigAction(
    items: MenuConfig[]
): Promise<{ ok: boolean; message?: string }> {
    try {
        await saveMenuConfig(items)
        // 전체 admin 레이아웃을 재검증하여 사이드바에 즉시 반영
        revalidatePath("/admin", "layout")
        return { ok: true }
    } catch {
        return { ok: false, message: "저장 중 오류가 발생했습니다." }
    }
}
