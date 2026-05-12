"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import ProductCard from "@/components/product/ProductCard"
import { type Product } from "@/lib/data/products"
import { type Category } from "@/lib/data/categories"

interface Props {
    categories: Category[]
    products: Product[]
    initialSlug?: string
}

export default function ProductsClient({ categories, products, initialSlug }: Props) {
    // initialSlug로 초기 카테고리 ID 계산
    const initialId = initialSlug
        ? (categories.find((c) => c.slug === initialSlug)?.id ?? null)
        : null

    const [activeId, setActiveId] = useState<number | null>(initialId)
    const router = useRouter()

    // 탭 선택 시 URL에 반영 (뒤로가기 지원, 스크롤 유지)
    const handleSelect = (id: number | null) => {
        setActiveId(id)
        const cat = categories.find((c) => c.id === id)
        const url = cat ? `/products?category=${cat.slug}` : "/products"
        router.replace(url, { scroll: false })
    }

    // 선택된 탭이 화면 밖이면 스크롤해서 보이게
    const tabRefs = useRef<Map<number | null, HTMLButtonElement>>(new Map())
    useEffect(() => {
        const el = tabRefs.current.get(activeId)
        el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" })
    }, [activeId])

    const filtered = activeId === null
        ? products
        : products.filter((p) => p.categories.some((c) => c.id === activeId))

    const activeCategory = categories.find((c) => c.id === activeId)

    return (
        <div data-ui-id="page-products" className="max-w-5xl mx-auto px-5 py-6 pb-16">

            {/* 페이지 헤더 */}
            <div className="mb-5">
                <h1
                    className="text-2xl font-black"
                    style={{ color: "var(--toss-text-primary)", letterSpacing: "-0.03em" }}
                >
                    전체 상품
                </h1>
                <p className="text-sm mt-0.5" style={{ color: "var(--toss-text-secondary)" }}>
                    {filtered.length}개 상품
                </p>
            </div>

            {/* 카테고리 탭 */}
            <div className="flex gap-2 overflow-x-auto pb-1 mb-6 scrollbar-hide">
                <TabButton
                    active={activeId === null}
                    onClick={() => handleSelect(null)}
                    label="전체"
                    icon="🛍️"
                    ref={(el) => { if (el) tabRefs.current.set(null, el); else tabRefs.current.delete(null) }}
                />
                {categories.map((cat) => (
                    <TabButton
                        key={cat.id}
                        active={activeId === cat.id}
                        onClick={() => handleSelect(cat.id)}
                        label={cat.name}
                        icon={cat.icon}
                        ref={(el) => { if (el) tabRefs.current.set(cat.id, el); else tabRefs.current.delete(cat.id) }}
                    />
                ))}
            </div>

            {/* 상품 그리드 */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeId ?? "all"}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                >
                    {filtered.length === 0 ? (
                        <div
                            className="flex flex-col items-center justify-center py-24 gap-3"
                            style={{ color: "var(--toss-text-tertiary)" }}
                        >
                            <span className="text-5xl">{activeCategory?.icon ?? "🛍️"}</span>
                            <p className="text-sm font-medium">아직 등록된 상품이 없어요</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {filtered.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    )
}

import { forwardRef } from "react"

const TabButton = forwardRef<HTMLButtonElement, {
    active: boolean
    onClick: () => void
    label: string
    icon: string
}>(function TabButton({ active, onClick, label, icon }, ref) {
    return (
        <motion.button
            ref={ref}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-colors"
            style={{
                backgroundColor: active ? "var(--toss-blue)" : "var(--toss-page-bg)",
                color: active ? "#fff" : "var(--toss-text-secondary)",
                border: active ? "none" : "1px solid var(--toss-border)",
            }}
        >
            <span>{icon}</span>
            {label}
        </motion.button>
    )
})
