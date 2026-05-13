import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
    const { targetEmail } = await request.json()

    if (!targetEmail) {
        return NextResponse.json({ error: "targetEmail이 필요합니다." }, { status: 400 })
    }

    // 현재 로그인된 사용자 확인
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
    }

    // 자기 자신으로 전환 차단
    if (user.email === targetEmail) {
        return NextResponse.json({ error: "현재 계정과 동일합니다." }, { status: 400 })
    }

    const admin = createAdminClient()

    // 대상 계정이 활성 관리자인지 검증
    const { data: targetProfile } = await admin
        .from("profiles")
        .select("role, status")
        .eq("email", targetEmail)
        .maybeSingle()

    if (!targetProfile || targetProfile.role !== "admin" || targetProfile.status !== "active") {
        return NextResponse.json({ error: "전환할 수 없는 계정입니다." }, { status: 400 })
    }

    // OTP 생성 — action_link(PKCE 필요) 대신 email_otp를 클라이언트에서 직접 처리
    const { data, error } = await admin.auth.admin.generateLink({
        type: "magiclink",
        email: targetEmail,
    })

    if (error || !data?.properties?.email_otp) {
        return NextResponse.json(
            { error: error?.message ?? "OTP 생성에 실패했습니다." },
            { status: 500 }
        )
    }

    return NextResponse.json({
        otp:   data.properties.email_otp,
        email: targetEmail,
    })
}
