import HeroBanner from "@/components/home/HeroBanner"
import CategoryGrid from "@/components/home/CategoryGrid"
import NewArrivals from "@/components/home/NewArrivals"
import BestItems from "@/components/home/BestItems"
import PromoBanner from "@/components/home/PromoBanner"

export default function HomePage() {
  return (
    <div className="max-w-5xl mx-auto px-5 py-5 pb-16 space-y-0">
      <HeroBanner />
      <CategoryGrid />
      <NewArrivals />
      <PromoBanner />
      <BestItems />
    </div>
  )
}
