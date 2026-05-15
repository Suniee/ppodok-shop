"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { type Product, type ProductCategory } from "@/lib/data/products"

type DbProductRow = {
    id: string; name: string; price: number; original_price: number | null
    emoji: string; bg_color: string; is_new: boolean; is_best: boolean
    badge: string | null; is_visible: boolean; images: string[] | null
    detail_images: string[] | null; description: string | null
    product_categories: { categories: { id: number; name: string; slug: string; icon: string } | null }[]
}

function rowToProduct(row: DbProductRow): Product {
    return {
        id: row.id, name: row.name, price: row.price,
        originalPrice: row.original_price ?? undefined,
        emoji: row.emoji, bgColor: row.bg_color,
        isNew: row.is_new, isBest: row.is_best,
        badge: row.badge ?? undefined,
        isVisible: row.is_visible,
        images: row.images ?? [],
        detailImages: row.detail_images ?? [],
        description: row.description ?? undefined,
        categories: (row.product_categories ?? [])
            .map((pc) => pc.categories)
            .filter((c): c is ProductCategory => c !== null),
    }
}

export async function fetchProductsPagedAction(
    page: number,
    pageSize: number,
    catSlug: string,
    query: string,
): Promise<{ items: Product[]; total: number }> {
    const admin = createAdminClient()
    const from = (page - 1) * pageSize
    const to   = from + pageSize - 1
    const q    = query.trim()

    let builder = admin
        .from("products")
        .select("*, product_categories(categories(*))", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to)

    if (q) builder = builder.ilike("name", `%${q}%`)

    const { data, count, error } = await builder
    if (error || !data) return { items: [], total: 0 }

    let items = (data as DbProductRow[]).map(rowToProduct)

    // 카테고리 필터는 PostgreSQL 조인 조건으로 처리하기 어려워 클라이언트에서 추가 필터링
    if (catSlug !== "all") {
        items = items.filter((p) => p.categories.some((c) => c.slug === catSlug))
    }

    return { items, total: catSlug !== "all" ? items.length : (count ?? 0) }
}

// Supabase Storage URL에서 버킷 내부 경로만 추출
function extractStoragePath(url: string): string {
    const marker = "/product-images/"
    const idx = url.indexOf(marker)
    if (idx === -1) throw new Error("올바르지 않은 이미지 URL입니다.")
    return url.slice(idx + marker.length)
}

// 버킷이 없으면 생성 (service_role이므로 권한 충분)
async function ensureBucket(admin: ReturnType<typeof createAdminClient>) {
    const { data: buckets } = await admin.storage.listBuckets()
    if (buckets?.find((b) => b.id === "product-images")) return

    const { error } = await admin.storage.createBucket("product-images", {
        public: true,
        fileSizeLimit: 5 * 1024 * 1024,
        allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    })
    if (error) throw new Error(`버킷 생성 실패: ${error.message}`)
}

// 이미지 파일을 Storage에 업로드하고 공개 URL 반환
export async function uploadProductImageAction(formData: FormData): Promise<string> {
    const file = formData.get("file") as File | null
    if (!file || file.size === 0) throw new Error("파일이 없습니다.")
    if (file.size > 5 * 1024 * 1024) throw new Error("파일 크기는 5MB 이하여야 합니다.")

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg"
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const admin = createAdminClient()
    await ensureBucket(admin)

    const { error } = await admin.storage
        .from("product-images")
        .upload(path, file, { contentType: file.type, upsert: false })

    if (error) throw new Error(error.message)

    const { data } = admin.storage.from("product-images").getPublicUrl(path)
    return data.publicUrl
}

// Storage에서 이미지 삭제
export async function deleteProductImageAction(url: string): Promise<void> {
    const path = extractStoragePath(url)
    const admin = createAdminClient()
    const { error } = await admin.storage.from("product-images").remove([path])
    if (error) throw new Error(error.message)
}

// 상품 upsert (service_role로 RLS 우회)
export async function upsertProductAction(product: Product): Promise<void> {
    const admin = createAdminClient()

    const { error: pe } = await admin.from("products").upsert({
        id: product.id,
        name: product.name,
        price: product.price,
        original_price: product.originalPrice ?? null,
        emoji: product.emoji,
        bg_color: product.bgColor,
        is_new: product.isNew ?? false,
        is_best: product.isBest ?? false,
        badge: product.badge ?? null,
        is_visible: product.isVisible ?? true,
        images: product.images ?? [],
        detail_images: product.detailImages ?? [],
        description: product.description ?? null,
    })
    if (pe) throw new Error(pe.code === "23505" ? "이미 사용 중인 ID입니다." : pe.message)

    // 카테고리 연결을 전체 교체 (delete → insert)
    const { error: de } = await admin
        .from("product_categories")
        .delete()
        .eq("product_id", product.id)
    if (de) throw new Error(de.message)

    if (product.categories.length > 0) {
        const { error: ie } = await admin.from("product_categories").insert(
            product.categories.map((c) => ({ product_id: product.id, category_id: c.id }))
        )
        if (ie) throw new Error(ie.message)
    }
}

// 상품 삭제 (연결된 이미지는 Storage에서 별도로 처리해야 함)
export async function deleteProductAction(id: string): Promise<void> {
    const admin = createAdminClient()
    const { error } = await admin.from("products").delete().eq("id", id)
    if (error) throw new Error(error.message)
}

// 노출 여부만 업데이트
export async function updateVisibilityAction(id: string, isVisible: boolean): Promise<void> {
    const admin = createAdminClient()
    const { error } = await admin.from("products").update({ is_visible: isVisible }).eq("id", id)
    if (error) throw new Error(error.message)
}
