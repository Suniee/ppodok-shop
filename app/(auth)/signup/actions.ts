"use server"

import { createAdminClient } from "@/lib/supabase/admin"

// 탈퇴한 이메일인지 확인 — true이면 재가입 차단
export async function checkWithdrawnEmailAction(email: string): Promise<boolean> {
    const admin = createAdminClient()
    const { data } = await admin
        .from("withdrawn_profiles")
        .select("id")
        .eq("email", email.trim().toLowerCase())
        .maybeSingle()
    return !!data
}

// 프론트 회원가입 완료 후 즉시 활성화 — customer 역할만 적용 (어드민 승인 흐름 보호)
export async function autoActivateCustomerAction(userId: string): Promise<void> {
    const admin = createAdminClient()
    await admin
        .from("profiles")
        .update({ status: "active" })
        .eq("id", userId)
        .eq("role", "customer")
}
