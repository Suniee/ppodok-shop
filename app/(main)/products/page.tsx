import ProductsClient from "./ProductsClient"
import { fetchActiveCategories } from "@/lib/supabase/categories"
import { fetchProducts } from "@/lib/supabase/products"

interface Props {
    searchParams: Promise<{ category?: string }>
}

export default async function ProductsPage({ searchParams }: Props) {
    const { category: initialSlug } = await searchParams

    const [categories, products] = await Promise.all([
        fetchActiveCategories().catch(() => []),
        fetchProducts().catch(() => []),
    ])

    const visible = products.filter((p) => p.isVisible ?? true)

    return <ProductsClient categories={categories} products={visible} initialSlug={initialSlug} />
}
