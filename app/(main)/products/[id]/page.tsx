import { notFound } from "next/navigation"
import { fetchProductById, fetchRelatedProducts } from "@/lib/supabase/products"
import { fetchReviewCount } from "@/lib/supabase/reviews"
import { fetchQnACount } from "@/lib/supabase/qna"
import ProductDetailClient from "./ProductDetailClient"

interface Props {
    params: Promise<{ id: string }>
}

export default async function ProductDetailPage({ params }: Props) {
    const { id } = await params
    const product = await fetchProductById(id)

    if (!product || product.isVisible === false) {
        notFound()
    }

    const categoryIds = product.categories.map((c) => c.id)

    const [relatedProducts, reviewCount, qnaCount] = await Promise.all([
        fetchRelatedProducts(product.id, categoryIds, 6),
        fetchReviewCount(product.id),
        fetchQnACount(product.id),
    ])

    return (
        <ProductDetailClient
            product={product}
            relatedProducts={relatedProducts}
            initialReviewCount={reviewCount}
            initialQnACount={qnaCount}
        />
    )
}
