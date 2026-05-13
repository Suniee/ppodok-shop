import { fetchAllBanners } from "@/lib/supabase/banners"
import BannersClient from "./BannersClient"

export default async function BannersPage() {
    const banners = await fetchAllBanners()
    return <BannersClient initial={banners} />
}
