import { createAdminClient } from "./admin"
import type { MenuConfig } from "@/lib/admin-menu"

export type { MenuConfig }

// DB에서 메뉴 설정 전체 조회 — 없으면 빈 배열 반환 (기본값은 MENU_ITEMS 에서 처리)
export async function fetchMenuConfig(): Promise<MenuConfig[]> {
    const admin = createAdminClient()
    const { data, error } = await admin
        .from("admin_menu_config")
        .select("menu_id, sort_order, visible_super, visible_general")
        .order("sort_order", { ascending: true })

    if (error || !data) return []

    return data.map((row) => ({
        menuId:         row.menu_id,
        sortOrder:      row.sort_order,
        visibleSuper:   row.visible_super,
        visibleGeneral: row.visible_general,
    }))
}

// 메뉴 설정 전체 덮어쓰기 (upsert)
export async function saveMenuConfig(items: MenuConfig[]): Promise<void> {
    const admin = createAdminClient()
    const rows = items.map((item) => ({
        menu_id:         item.menuId,
        sort_order:      item.sortOrder,
        visible_super:   item.visibleSuper,
        visible_general: item.visibleGeneral,
        updated_at:      new Date().toISOString(),
    }))
    await admin.from("admin_menu_config").upsert(rows, { onConflict: "menu_id" })
}
