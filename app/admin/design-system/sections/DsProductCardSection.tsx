import ProductCard from "@/components/product/ProductCard"
import { products } from "@/lib/data/products"

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-3xl p-8" style={{ border: "1px solid var(--toss-border)" }}>
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
  const samples = [
    products.find((p) => !p.badge && !p.isNew),
    products.find((p) => p.isNew && !p.badge),
    products.find((p) => p.badge === "BEST"),
    products.find((p) => p.badge === "SALE"),
  ].filter(Boolean)

  return (
    <Section title="🛍️ Product Card">
      <p className="text-sm mb-6" style={{ color: "var(--toss-text-secondary)" }}>
        상품 카드의 다양한 상태를 보여줍니다. 뱃지 없음 / NEW / BEST / SALE 순서입니다.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {samples.map((p) => p && <ProductCard key={p.id} product={p} />)}
      </div>
    </Section>
  )
}
