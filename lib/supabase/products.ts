import { supabase } from "./client"
import { type Product, type ProductCategory } from "@/lib/data/products"

type DbRow = {
  id: string
  name: string
  price: number
  original_price: number | null
  emoji: string
  bg_color: string
  is_new: boolean
  is_best: boolean
  badge: string | null
  is_visible: boolean
  images: string[] | null
  product_categories: { categories: { id: number; name: string; slug: string; icon: string } | null }[]
}

function toProduct(row: DbRow): Product {
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    originalPrice: row.original_price ?? undefined,
    emoji: row.emoji,
    bgColor: row.bg_color,
    isNew: row.is_new,
    isBest: row.is_best,
    badge: row.badge ?? undefined,
    isVisible: row.is_visible,
    images: row.images ?? [],
    categories: (row.product_categories ?? [])
      .map((pc) => pc.categories)
      .filter((c): c is ProductCategory => c !== null),
  }
}

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select(`*, product_categories(categories(*))`)
    .order("created_at", { ascending: false })
  if (error) throw error
  return (data as DbRow[]).map(toProduct)
}

export async function fetchProductsByCategory(categoryId: number): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select(`*, product_categories!inner(categories(*))`)
    .eq("product_categories.category_id", categoryId)
    .eq("is_visible", true)
    .order("created_at", { ascending: false })
  if (error) throw error
  return (data as DbRow[]).map(toProduct)
}

export async function upsertProduct(product: Product): Promise<void> {
  const { error: pe } = await supabase.from("products").upsert({
    id: product.id,
    name: product.name,
    price: product.price,
    original_price: product.originalPrice ?? null,
    emoji: product.emoji,
    bg_color: product.bgColor,
    is_new: product.isNew ?? false,
    is_best: product.isBest ?? false,
    badge: product.badge ?? null,
    is_visible: product.isVisible ?? true,
  })
  if (pe) throw pe

  const { error: de } = await supabase
    .from("product_categories")
    .delete()
    .eq("product_id", product.id)
  if (de) throw de

  if (product.categories.length > 0) {
    const { error: ie } = await supabase.from("product_categories").insert(
      product.categories.map((c) => ({ product_id: product.id, category_id: c.id }))
    )
    if (ie) throw ie
  }
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from("products").delete().eq("id", id)
  if (error) throw error
}

export async function updateVisibility(id: string, isVisible: boolean): Promise<void> {
  const { error } = await supabase.from("products").update({ is_visible: isVisible }).eq("id", id)
  if (error) throw error
}
