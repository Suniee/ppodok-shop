"use server"

import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function adminLoginAction(
    formData: FormData
): Promise<{ error: string } | never> {
    const email    = (formData.get("email")    as string).trim()
    const password = (formData.get("password") as string)

    if (!email || !password) {
        return { error: "이메일과 비밀번호를 입력해 주세요." }
    }

    const supabase = await createSupabaseServerClient()

    // 1. 로그인 시도
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (signInError || !data.user) {
        return { error: "이메일 또는 비밀번호가 올바르지 않습니다." }
    }

    // 2. 관리자 role + 활성 상태 검증 (admin client로 RLS 우회)
    const adminClient = createAdminClient()
    const { data: profile } = await adminClient
        .from("profiles")
        .select("role, status")
        .eq("id", data.user.id)
        .maybeSingle()

    if (profile?.role !== "admin" || profile?.status !== "active") {
        // 관리자가 아닌 계정으로 로그인 시 즉시 세션 제거
        await supabase.auth.signOut()
        return { error: "관리자 권한이 없거나 비활성 계정입니다." }
    }

    redirect("/admin/dashboard")
}
