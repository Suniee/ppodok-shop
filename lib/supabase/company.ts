import { createAdminClient } from "@/lib/supabase/admin"
import { supabase } from "@/lib/supabase/client"

export type CompanyInfo = {
    id:                 number
    company_name:       string
    representative:     string
    business_number:    string
    mail_order_number:  string
    address:            string
    phone:              string
    support_hours:      string
    copyright:          string
    sns_facebook:       string
    sns_instagram:      string
    sns_naver:          string
    sns_kakao:          string
    updated_at:         string
}

// 프론트(공개)에서 회사정보 조회
export async function fetchCompanyInfo(): Promise<CompanyInfo | null> {
    const { data } = await supabase
        .from("company_info")
        .select("*")
        .eq("id", 1)
        .single()
    return data as CompanyInfo | null
}

// 어드민에서 회사정보 저장 (service_role — RLS 우회)
export async function upsertCompanyInfo(
    info: Omit<CompanyInfo, "id" | "updated_at">
): Promise<void> {
    const admin = createAdminClient()
    const { error } = await admin
        .from("company_info")
        .upsert({ id: 1, ...info, updated_at: new Date().toISOString() })
    if (error) throw error
}
