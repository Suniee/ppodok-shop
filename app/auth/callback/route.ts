import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

// Supabase 매직 링크 / OAuth 흐름에서 code를 세션으로 교환하는 콜백
// URL 형태: /auth/callback?code=...&next=/admin/dashboard
export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get("code")
    const next = searchParams.get("next") ?? "/admin/dashboard"

    if (code) {
        const supabase = await createSupabaseServerClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    // 코드가 없거나 교환 실패 시 로그인으로
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
