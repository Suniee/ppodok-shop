"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export interface ProfileUpdateInput {
    name: string
    phone: string
    postalCode: string
    address: string
    addressDetail: string
}

export async function updateProfileAction(input: ProfileUpdateInput): Promise<void> {
    // 현재 로그인한 사용자 확인
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error("로그인이 필요합니다.")

    // service_role로 RLS 우회 업데이트 (anon 정책은 자기 행만 허용하지만 service_role이 더 안전)
    const admin = createAdminClient()
    const { error } = await admin
        .from("profiles")
        .update({
            name: input.name.trim() || null,
            phone: input.phone.trim() || null,
            postal_code: input.postalCode || null,
            address: input.address || null,
            address_detail: input.addressDetail.trim() || null,
        })
        .eq("id", user.id)

    if (error) throw new Error(error.message)
}

export async function deleteAccountAction(): Promise<void> {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error("로그인이 필요합니다.")

    const admin = createAdminClient()

    // 탈퇴 이메일 보관 (이미 존재하면 withdrawn_at 갱신)
    const { error: upsertError } = await admin
        .from("withdrawn_profiles")
        .upsert(
            { email: user.email!.toLowerCase() },
            { onConflict: "email" }
        )
    if (upsertError) throw new Error("회원탈퇴 처리 중 오류가 발생했습니다.")

    // auth.users에서 삭제 (profiles는 CASCADE로 자동 삭제)
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id)
    if (deleteError) throw new Error("계정 삭제 중 오류가 발생했습니다.")
}
