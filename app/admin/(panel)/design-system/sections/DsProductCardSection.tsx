import ProductCard from "@/components/product/ProductCard"
import { type Product } from "@/lib/data/products"

const samples: Product[] = [
  { id: "ds1", name: "샘플 기본 상품", price: 5000, emoji: "📦", bgColor: "bg-gray-50", categories: [] },
  { id: "ds2", name: "신상품 샘플", price: 3000, emoji: "🛍️", bgColor: "bg-blue-50", isNew: true, categories: [] },
  { id: "ds3", name: "베스트 샘플", price: 16000, emoji: "🌸", bgColor: "bg-rose-50", isBest: true, badge: "BEST", categories: [{ id: 1, name: "뷰티/화장품", slug: "beauty", icon: "💄" }] },
  { id: "ds4", name: "세일 샘플", price: 5500, originalPrice: 7000, emoji: "🍶", bgColor: "bg-indigo-50", badge: "SALE", categories: [] },
]

function Section({ title, uiId, children }: { title: string; uiId?: string; children: React.ReactNode }) {
  return (
    <section data-ui-id={uiId} className="bg-white rounded-3xl p-8" style={{ border: "1px solid var(--toss-border)" }}>
      <h2
        className="text-lg font-bold mb-6 pb-4"
        style={{ color: "var(--toss-text-primary)", borderBottom: "1px solid var(--toss-border)", letterSpacing: "-0.02em" }}
      >
        {title}
      </h2>
      {children}
    </section>
  )
}

export function DsProductCardSection() {
  return (
    <Section title="🛍️ Product Card" uiId="section-ds-product-card">
      <p className="text-sm mb-6" style={{ color: "var(--toss-text-secondary)" }}>
        상품 카드의 다양한 상태를 보여줍니다. 기본 / NEW / BEST / SALE 순서입니다.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {samples.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </Section>
  )
}
