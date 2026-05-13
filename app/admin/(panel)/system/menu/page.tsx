import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { fetchMenuConfig } from "@/lib/supabase/menu"
import { MENU_ITEMS } from "@/lib/admin-menu"
import MenuClient from "./MenuClient"

export default async function MenuManagePage() {
    // 수퍼관리자만 접근 허용
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect("/admin/login")

    const adminClient = createAdminClient()
    const { data: profile } = await adminClient
        .from("profiles")
        .select("admin_role")
        .eq("id", user.id)
        .maybeSingle()

    if (profile?.admin_role !== "super") redirect("/admin/dashboard")

    const dbConfig = await fetchMenuConfig().catch(() => [])

    return (
        <div data-ui-id="page-admin-system-menu" className="p-6 max-w-2xl">
            <h1 className="text-xl font-bold mb-1" style={{ color: "var(--toss-text-primary)" }}>
                메뉴 관리
            </h1>
            <p className="text-sm mb-6" style={{ color: "var(--toss-text-secondary)" }}>
                사이드바 메뉴의 순서와 권한별 노출 여부를 설정합니다.
            </p>
            <MenuClient menuItems={MENU_ITEMS} initialConfig={dbConfig} />
        </div>
    )
}
