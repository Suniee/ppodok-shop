import { NextResponse } from "next/server"
import { fetchProducts } from "@/lib/supabase/products"

// 네이버 EP 피드 필수 컬럼 순서
const HEADERS = [
    "id",
    "title",
    "price_pc",
    "price_mobile",
    "link",
    "image",
    "category1",
    "maker",
    "brand",
    "model",
    "event_words",
    "delivery_fee",
]

function escapeField(value: string): string {
    // 탭·줄바꿈·앞뒤 공백 제거 (TSV 형식 깨짐 방지)
    return value.replace(/[\t\n\r]/g, " ").trim()
}

function toRow(fields: string[]): string {
    return fields.map(escapeField).join("\t")
}

export async function GET() {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? ""

    const products = await fetchProducts()
    // 노출 설정된 상품만 피드에 포함
    const visible = products.filter((p) => p.isVisible !== false)

    const rows: string[] = [toRow(HEADERS)]

    for (const p of visible) {
        const image = p.images?.[0] ?? ""
        // 카테고리가 없으면 '기타'로 대체 (네이버 EP는 category1 필수)
        const category1 = p.categories[0]?.name ?? "기타"

        rows.push(
            toRow([
                p.id,
                p.name,
                String(p.price),
                String(p.price),
                `${siteUrl}/products/${p.id}`,
                image,
                category1,
                "",   // maker: 제조사 정보 없으면 빈 값
                "",   // brand: 브랜드 정보 없으면 빈 값
                "",   // model: 모델명 없으면 빈 값
                "",   // event_words
                "0",  // delivery_fee: 무료배송 기본값
            ])
        )
    }

    const tsv = rows.join("\n")

    return new NextResponse(tsv, {
        headers: {
            "Content-Type": "text/tab-separated-values; charset=utf-8",
            // 네이버 봇이 캐시 없이 최신 데이터를 가져가도록 설정
            "Cache-Control": "no-store",
        },
    })
}
