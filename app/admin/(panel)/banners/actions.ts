"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import type { Banner } from "@/lib/supabase/banners"

export type BannerInput = Omit<Banner, "id" | "created_at">

export async function upsertBannerAction(input: BannerInput & { id?: string }): Promise<void> {
    const admin = createAdminClient()
    const { id, ...fields } = input

    if (id) {
        const { error } = await admin.from("banners").update(fields).eq("id", id)
        if (error) throw new Error(error.message)
    } else {
        const { error } = await admin.from("banners").insert(fields)
        if (error) throw new Error(error.message)
    }
    revalidatePath("/")
    revalidatePath("/admin/banners")
}

export async function deleteBannerAction(id: string): Promise<void> {
    const admin = createAdminClient()
    const { error } = await admin.from("banners").delete().eq("id", id)
    if (error) throw new Error(error.message)
    revalidatePath("/")
    revalidatePath("/admin/banners")
}

export async function toggleBannerAction(id: string, active: boolean): Promise<void> {
    const admin = createAdminClient()
    const { error } = await admin.from("banners").update({ active }).eq("id", id)
    if (error) throw new Error(error.message)
    revalidatePath("/")
    revalidatePath("/admin/banners")
}
