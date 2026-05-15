"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { type Category } from "@/lib/data/categories"

function toCategory(row: Record<string, unknown>): Category {
    return {
        id: row.id as number,
        name: row.name as string,
        slug: row.slug as string,
        icon: row.icon as string,
        sortOrder: row.sort_order as number,
        isActive: row.is_active as boolean,
    }
}

export async function insertCategoryAction(cat: Omit<Category, "id">): Promise<Category> {
    const db = createAdminClient()
    const { data, error } = await db
        .from("categories")
        .insert({
            name: cat.name,
            slug: cat.slug,
            icon: cat.icon,
            sort_order: cat.sortOrder,
            is_active: cat.isActive,
        })
        .select()
        .single()
    // PostgrestError는 일반 객체 → new Error로 감싸야 Next.js가 클라이언트에 메시지를 전달함
    // code 23505: unique_violation (slug 중복)
    if (error) throw new Error(
        error.code === "23505"
            ? "이미 사용 중인 슬러그입니다. 다른 슬러그를 입력해주세요."
            : error.message
    )
    return toCategory(data)
}

export async function updateCategoryAction(cat: Category): Promise<void> {
    const db = createAdminClient()
    const { error } = await db
        .from("categories")
        .update({
            name: cat.name,
            slug: cat.slug,
            icon: cat.icon,
            sort_order: cat.sortOrder,
            is_active: cat.isActive,
        })
        .eq("id", cat.id)
    if (error) throw new Error(error.message)
}

export async function deleteCategoryAction(id: number): Promise<void> {
    const db = createAdminClient()
    const { error } = await db.from("categories").delete().eq("id", id)
    if (error) throw new Error(error.message)
}

export async function fetchCategoriesPagedAction(
    page: number,
    pageSize: number,
): Promise<{ items: Category[]; total: number }> {
    const db = createAdminClient()
    const from = (page - 1) * pageSize
    const to   = from + pageSize - 1
    const { data, count, error } = await db
        .from("categories")
        .select("*", { count: "exact" })
        .order("sort_order", { ascending: true })
        .range(from, to)
    if (error || !data) return { items: [], total: 0 }
    return { items: (data as Record<string, unknown>[]).map(toCategory), total: count ?? 0 }
}

export async function updateCategoryOrdersAction(categories: Category[]): Promise<void> {
    const db = createAdminClient()
    await Promise.all(
        categories.map((c) =>
            db.from("categories").update({ sort_order: c.sortOrder }).eq("id", c.id)
        )
    )
}
