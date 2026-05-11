import ProductCard from "@/components/product/ProductCard"
import { type Product } from "@/lib/data/products"

// 서버 컴포넌트 - page.tsx에서 필터링된 신상품 목록을 받아 렌더
export default function NewArrivals({ items }: { items: Product[] }) {
  if (items.length === 0) return null

  return (
    <section data-ui-id="section-home-new-arrivals" className="mt-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold" style={{ color: "var(--toss-text-primary)" }}>
          신상품 <span className="font-normal text-sm" style={{ color: "var(--toss-text-secondary)" }}>New Arrivals</span>
        </h2>
        <a className="text-xs font-medium" style={{ color: "var(--toss-text-secondary)" }} href="/products?filter=new">
          더보기
        </a>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {items.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  )
}
