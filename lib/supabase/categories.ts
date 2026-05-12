import { supabase } from "./client"
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

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order")
  if (error) throw error
  return data.map(toCategory)
}

export async function fetchActiveCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order")
  if (error) throw error
  return data.map(toCategory)
}

export async function insertCategory(cat: Omit<Category, "id">): Promise<Category> {
  const { data, error } = await supabase
    .from("categories")
    .insert({ name: cat.name, slug: cat.slug, icon: cat.icon, sort_order: cat.sortOrder, is_active: cat.isActive })
    .select()
    .single()
  if (error) throw error
  return toCategory(data)
}

export async function updateCategory(cat: Category): Promise<void> {
  const { error } = await supabase
    .from("categories")
    .update({ name: cat.name, slug: cat.slug, icon: cat.icon, sort_order: cat.sortOrder, is_active: cat.isActive })
    .eq("id", cat.id)
  if (error) throw error
}

export async function deleteCategory(id: number): Promise<void> {
  const { error } = await supabase.from("categories").delete().eq("id", id)
  if (error) throw error
}

export async function fetchCategoryBySlug(slug: string): Promise<Category | null> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single()
  if (error) return null
  return toCategory(data)
}

export async function updateCategoryOrders(categories: Category[]): Promise<void> {
  await Promise.all(
    categories.map((c) =>
      supabase.from("categories").update({ sort_order: c.sortOrder }).eq("id", c.id)
    )
  )
}
