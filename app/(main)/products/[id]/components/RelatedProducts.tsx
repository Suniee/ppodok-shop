import { type Product } from "@/lib/data/products"
import ProductCard from "@/components/product/ProductCard"

interface Props {
    products: Product[]
}

export default function RelatedProducts({ products }: Props) {
    if (products.length === 0) {
        return (
            <div
                className="flex flex-col items-center justify-center py-16 gap-3"
                style={{ color: "var(--toss-text-tertiary)" }}
            >
                <span className="text-4xl">🛍️</span>
                <p className="text-sm">연관 상품이 없습니다</p>
            </div>
        )
    }

    return (
        <div
            data-ui-id="section-product-related"
            className="grid grid-cols-2 sm:grid-cols-3 gap-4"
        >
            {products.map((product) => (
                <ProductCard key={product.id} product={product} />
            ))}
        </div>
    )
}
