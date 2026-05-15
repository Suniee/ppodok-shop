import { fetchAllBanners } from "@/lib/supabase/banners"
import { fetchActiveCategories } from "@/lib/supabase/categories"
import BannersClient from "./BannersClient"

export default async function BannersPage() {
    const [banners, categories] = await Promise.all([
        fetchAllBanners(),
        fetchActiveCategories().catch(() => []),
    ])
    return <BannersClient initial={banners} categories={categories} />
}
