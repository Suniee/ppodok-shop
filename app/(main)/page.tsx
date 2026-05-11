import HeroBanner from "@/components/home/HeroBanner"
import CategoryGrid from "@/components/home/CategoryGrid"
import NewArrivals from "@/components/home/NewArrivals"
import BestItems from "@/components/home/BestItems"
import PromoBanner from "@/components/home/PromoBanner"
import { fetchActiveCategories } from "@/lib/supabase/categories"
import { fetchProducts } from "@/lib/supabase/products"

// 서버 컴포넌트 - DB 조회 후 각 섹션에 props로 전달
export default async function HomePage() {
  const [categories, products] = await Promise.all([
    fetchActiveCategories().catch(() => []),
    fetchProducts().catch(() => []),
  ])

  const newItems  = products.filter((p) => p.isNew  && (p.isVisible ?? true))
  const bestItems = products.filter((p) => p.isBest && (p.isVisible ?? true))

  return (
    <div data-ui-id="page-home" className="max-w-5xl mx-auto px-5 py-5 pb-16 space-y-0">
      <HeroBanner />
      <CategoryGrid categories={categories} />
      <NewArrivals items={newItems} />
      <PromoBanner />
      <BestItems items={bestItems} />
    </div>
  )
}
