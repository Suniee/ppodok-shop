"use server"

import { upsertCompanyInfo } from "@/lib/supabase/company"
import type { CompanyInfo } from "@/lib/supabase/company"

export async function saveCompanyInfoAction(
    info: Omit<CompanyInfo, "id" | "updated_at">
): Promise<{ success: true } | { error: string }> {
    try {
        await upsertCompanyInfo(info)
        return { success: true }
    } catch {
        return { error: "저장에 실패했습니다. 잠시 후 다시 시도해 주세요." }
    }
}
