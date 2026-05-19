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
        .from("customer_profiles")
        .update({ status: "active" })
        .eq("id", userId)
}

// 회원가입 시 약관 동의 내역 저장
// 필수 2개(이용약관·개인정보 필수)는 항상 now, 마케팅은 이메일·SMS 채널별로 기록
export async function saveConsentAction(
    userId:               string,
    marketingEmailAgreed: boolean,
    marketingSmsAgreed:   boolean,
): Promise<void> {
    const admin = createAdminClient()
    const now   = new Date().toISOString()
    await admin
        .from("customer_profiles")
        .update({
            terms_agreed_at:            now,
            privacy_agreed_at:          now,
            marketing_email_agreed:     marketingEmailAgreed,
            marketing_email_agreed_at:  marketingEmailAgreed ? now : null,
            marketing_sms_agreed:       marketingSmsAgreed,
            marketing_sms_agreed_at:    marketingSmsAgreed ? now : null,
        })
        .eq("id", userId)
}
