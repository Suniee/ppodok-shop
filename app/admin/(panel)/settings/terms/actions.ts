"use server"

import { updateTermAdmin } from "@/lib/supabase/terms"

export async function updateTermAction(
    id:    string,
    patch: { title?: string; content?: string; version?: string; effectiveAt?: string },
): Promise<{ success: true } | { error: string }> {
    try {
        await updateTermAdmin(id, patch)
        return { success: true }
    } catch {
        return { error: "저장에 실패했습니다. 잠시 후 다시 시도해 주세요." }
    }
}
