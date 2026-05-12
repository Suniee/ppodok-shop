"use server"

import { createAdminClient } from "@/lib/supabase/admin"

export interface BatchSettings {
    schedule: string
    retentionMinutes: number
}

export async function getBatchSettingsAction(): Promise<BatchSettings> {
    const admin = createAdminClient()
    const { data } = await admin
        .from("app_settings")
        .select("key, value")
        .in("key", ["withdrawn_cron_schedule", "withdrawn_retention_minutes"])

    const map = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]))
    return {
        schedule:         map["withdrawn_cron_schedule"]    ?? "* * * * *",
        retentionMinutes: parseInt(map["withdrawn_retention_minutes"] ?? "1", 10),
    }
}

export async function updateBatchSettingsAction(settings: BatchSettings): Promise<void> {
    const admin = createAdminClient()
    const { error } = await admin.rpc("update_withdrawn_cron", {
        new_schedule:      settings.schedule,
        retention_minutes: settings.retentionMinutes,
    })
    if (error) throw new Error(error.message)
}
