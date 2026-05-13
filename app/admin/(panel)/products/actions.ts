"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { type Product } from "@/lib/data/products"

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
