import ProductCard from "@/components/product/ProductCard"
import { newArrivals } from "@/lib/data/products"

export default function NewArrivals() {
  return (
    <section className="mt-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold" style={{ color: "var(--toss-text-primary)" }}>
          신상품 <span className="font-normal text-sm" style={{ color: "var(--toss-text-secondary)" }}>New Arrivals</span>
        </h2>
        <a className="text-xs font-medium" style={{ color: "var(--toss-text-secondary)" }} href="/products?filter=new">
          더보기
        </a>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {newArrivals.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  )
}
