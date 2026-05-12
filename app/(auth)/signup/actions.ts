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
