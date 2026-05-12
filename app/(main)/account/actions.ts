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
