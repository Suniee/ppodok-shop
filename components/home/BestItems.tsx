import ProductCard from "@/components/product/ProductCard"
import { type Product } from "@/lib/data/products"

// 서버 컴포넌트 - page.tsx에서 필터링된 베스트 목록을 받아 렌더
export default function BestItems({ items }: { items: Product[] }) {
  if (items.length === 0) return null

  return (
    <section data-ui-id="section-home-best-items" className="mt-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold" style={{ color: "var(--toss-text-primary)" }}>
          베스트 아이템 <span className="font-normal text-sm" style={{ color: "var(--toss-text-secondary)" }}>Best Items</span>
        </h2>
        <a className="text-xs font-medium" style={{ color: "var(--toss-text-secondary)" }} href="/products?filter=best">
          더보기
        </a>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {items.map((p, i) => (
          <div key={p.id} className="relative">
            <span
              className="absolute -top-2 -left-2 z-10 w-6 h-6 rounded-full text-[10px] font-black flex items-center justify-center shadow-sm text-white"
              style={{ backgroundColor: i === 0 ? "#FFB800" : i === 1 ? "#8B95A1" : i === 2 ? "#C07B3A" : "var(--toss-text-tertiary)" }}
            >
              {i + 1}
            </span>
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  )
}
