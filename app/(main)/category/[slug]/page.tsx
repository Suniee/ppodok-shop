import { notFound } from "next/navigation"
import ProductCard from "@/components/product/ProductCard"
import { fetchCategoryBySlug } from "@/lib/supabase/categories"
import { fetchProductsByCategory } from "@/lib/supabase/products"

interface Props {
    params: Promise<{ slug: string }>
}

export default async function CategoryPage({ params }: Props) {
    const { slug } = await params
    const category = await fetchCategoryBySlug(slug).catch(() => null)
    if (!category) notFound()

    const products = await fetchProductsByCategory(category.id).catch(() => [])
    const visible = products.filter((p) => p.isVisible ?? true)

    return (
        <div data-ui-id={`page-category-${slug}`} className="max-w-5xl mx-auto px-5 py-6 pb-16">

            {/* 카테고리 헤더 */}
            <div className="flex items-center gap-3 mb-6">
                <span className="text-4xl">{category.icon}</span>
                <div>
                    <h1
                        className="text-2xl font-black"
                        style={{ color: "var(--toss-text-primary)", letterSpacing: "-0.03em" }}
                    >
                        {category.name}
                    </h1>
                    <p className="text-sm mt-0.5" style={{ color: "var(--toss-text-secondary)" }}>
                        상품 {visible.length}개
                    </p>
                </div>
            </div>

            {/* 상품 그리드 */}
            {visible.length === 0 ? (
                <div
                    className="flex flex-col items-center justify-center py-24 gap-3"
                    style={{ color: "var(--toss-text-tertiary)" }}
                >
                    <span className="text-5xl">{category.icon}</span>
                    <p className="text-sm font-medium">아직 등록된 상품이 없어요</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {visible.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            )}
        </div>
    )
}
