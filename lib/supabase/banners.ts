import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@supabase/supabase-js"

export type Banner = {
    id:         string
    title:      string
    subtitle:   string
    tag:        string
    cta:        string
    link:       string
    emoji:      string
    bg_color:   string
    text_color: string
    position:   "hero" | "promo"
    active:     boolean
    order:      number
    created_at: string
}

// 공개 클라이언트 (anon key) — 서버 컴포넌트에서 직접 사용
function createPublicClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            db: { schema: "commerce" },
            auth: { persistSession: false },
        }
    )
}

export async function fetchActiveBanners(position: "hero" | "promo"): Promise<Banner[]> {
    const client = createPublicClient()
    const { data } = await client
        .from("banners")
        .select("*")
        .eq("position", position)
        .eq("active", true)
        .order("order")
    return (data ?? []) as Banner[]
}

export async function fetchAllBanners(): Promise<Banner[]> {
    const admin = createAdminClient()
    const { data } = await admin
        .from("banners")
        .select("*")
        .order("position")
        .order("order")
    return (data ?? []) as Banner[]
}
