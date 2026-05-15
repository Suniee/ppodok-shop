"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Heart, ShoppingCart, Check } from "lucide-react"
import { useRouter } from "next/navigation"
import { type Product } from "@/lib/data/products"
import { useCart } from "@/lib/store/CartContext"
import RelatedProducts from "./components/RelatedProducts"
import ReviewSection from "./components/ReviewSection"
import QnASection from "./components/QnASection"

type Tab = "related" | "reviews" | "qna"

interface Props {
    product: Product
    relatedProducts: Product[]
    initialReviewCount: number
    initialQnACount: number
}

export default function ProductDetailClient({ product, relatedProducts, initialReviewCount, initialQnACount }: Props) {
    const [liked, setLiked]           = useState(false)
    const [added, setAdded]           = useState(false)
    const [activeImage, setActiveImage] = useState(0)
    const [activeTab, setActiveTab]   = useState<Tab>("related")
    const [reviewCount, setReviewCount] = useState(initialReviewCount)
    const [qnaCount, setQnACount]       = useState(initialQnACount)
    const { addItem, openCart }       = useCart()
    const router                      = useRouter()

    const discount = product.originalPrice
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : null

    const hasImages = product.images && product.images.length > 0

    const handleAddToCart = () => {
        if (added) return
        addItem(product)
        setAdded(true)
        setTimeout(() => setAdded(false), 800)
        setTimeout(() => openCart(), 300)
    }

    const tabs: { id: Tab; label: string }[] = [
        { id: "related",  label: `연관상품 ${relatedProducts.length > 0 ? `(${relatedProducts.length})` : ""}`.trim() },
        { id: "reviews",  label: `리뷰 (${reviewCount})` },
        { id: "qna",      label: `Q&A (${qnaCount})` },
    ]

    return (
        <div data-ui-id="page-product-detail" className="max-w-3xl mx-auto px-5 py-6 pb-32">
            {/* 뒤로가기 */}
            <button
                data-ui-id="btn-product-detail-back"
                onClick={() => router.back()}
                className="flex items-center gap-1.5 mb-6 text-sm font-medium transition-opacity hover:opacity-70"
                style={{ color: "var(--toss-text-secondary)" }}
            >
                <ArrowLeft className="size-4" />
                이전으로
            </button>

            {/* ── 상품 기본 정보 (2-col) ── */}
            <div className="grid md:grid-cols-2 gap-8">
                {/* 이미지 섹션 */}
                <div>
                    <div
                        className="relative rounded-2xl overflow-hidden aspect-square flex items-center justify-center mb-3"
                        style={{ backgroundColor: "var(--toss-page-bg)", border: "1px solid var(--toss-border)" }}
                    >
                        {(product.badge || product.isNew) && (
                            <span
                                className="absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full z-10"
                                style={{
                                    backgroundColor:
                                        product.badge === "BEST" ? "var(--toss-blue)"
                                        : product.badge === "SALE" ? "var(--toss-red)"
                                        : "var(--toss-text-primary)",
                                    color: "#fff",
                                }}
                            >
                                {product.badge ?? "NEW"}
                            </span>
                        )}
                        <motion.button
                            data-ui-id="btn-product-detail-like"
                            whileTap={{ scale: 0.8 }}
                            onClick={() => setLiked(!liked)}
                            className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-sm"
                            style={{ border: "1px solid var(--toss-border)" }}
                        >
                            <Heart
                                className="size-4"
                                style={{
                                    color: liked ? "var(--toss-red)" : "var(--toss-text-tertiary)",
                                    fill: liked ? "var(--toss-red)" : "none",
                                }}
                            />
                        </motion.button>
                        {hasImages ? (
                            <motion.img
                                key={activeImage}
                                src={product.images![activeImage]}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.2 }}
                            />
                        ) : (
                            <span className="text-8xl select-none">{product.emoji}</span>
                        )}
                    </div>
                    {hasImages && product.images!.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                            {product.images!.map((img, i) => (
                                <motion.button
                                    key={i}
                                    data-ui-id={`btn-product-detail-thumb-${i}`}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setActiveImage(i)}
                                    className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden"
                                    style={{ border: `2px solid ${i === activeImage ? "var(--toss-blue)" : "var(--toss-border)"}` }}
                                >
                                    <img src={img} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                                </motion.button>
                            ))}
                        </div>
                    )}
                </div>

                {/* 정보 섹션 */}
                <div className="flex flex-col">
                    <div className="flex flex-wrap gap-1.5 mb-3">
                        {product.categories.map((cat) => (
                            <span
                                key={cat.id}
                                data-ui-id={`tag-product-detail-category-${cat.slug}`}
                                className="text-xs font-medium px-2.5 py-1 rounded-full"
                                style={{ backgroundColor: "var(--toss-page-bg)", color: "var(--toss-text-secondary)", border: "1px solid var(--toss-border)" }}
                            >
                                {cat.icon} {cat.name}
                            </span>
                        ))}
                    </div>
                    <h1
                        className="text-2xl font-black leading-tight mb-5"
                        style={{ color: "var(--toss-text-primary)", letterSpacing: "-0.02em" }}
                    >
                        {product.name}
                    </h1>
                    <div
                        className="p-4 rounded-2xl mb-4"
                        style={{ backgroundColor: "var(--toss-page-bg)", border: "1px solid var(--toss-border)" }}
                    >
                        {discount && (
                            <span className="text-sm font-bold block mb-1" style={{ color: "var(--toss-red)" }}>
                                {discount}% 할인
                            </span>
                        )}
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black" style={{ color: "var(--toss-text-primary)" }}>
                                {product.price.toLocaleString()}원
                            </span>
                            {product.originalPrice && (
                                <span className="text-base line-through" style={{ color: "var(--toss-text-tertiary)" }}>
                                    {product.originalPrice.toLocaleString()}원
                                </span>
                            )}
                        </div>
                    </div>
                    {product.description && (
                        <div
                            className="rounded-2xl p-4 mb-4"
                            style={{ backgroundColor: "var(--toss-page-bg)", border: "1px solid var(--toss-border)" }}
                        >
                            <p className="text-xs font-semibold mb-2" style={{ color: "var(--toss-text-secondary)" }}>상품 설명</p>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--toss-text-primary)" }}>
                                {product.description}
                            </p>
                        </div>
                    )}
                    <div className="mt-auto">
                        <motion.button
                            data-ui-id="btn-product-detail-add-cart"
                            whileTap={{ scale: 0.97 }}
                            onClick={handleAddToCart}
                            className="w-full h-14 rounded-2xl flex items-center justify-center gap-2 text-base font-bold text-white"
                            style={{ backgroundColor: added ? "#00C48C" : "var(--toss-blue)" }}
                        >
                            <AnimatePresence mode="wait" initial={false}>
                                {added ? (
                                    <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-2">
                                        <Check className="size-5" />장바구니에 담겼어요
                                    </motion.span>
                                ) : (
                                    <motion.span key="cart" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-2">
                                        <ShoppingCart className="size-5" />장바구니에 담기
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </motion.button>
                    </div>
                </div>
            </div>

            {/* ── 상품 상세 이미지 ── */}
            {(product.detailImages?.length ?? 0) > 0 && (
                <div data-ui-id="section-product-detail-images" className="mt-10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="flex-1 h-px" style={{ backgroundColor: "var(--toss-border)" }} />
                        <span className="text-xs font-semibold px-1" style={{ color: "var(--toss-text-tertiary)" }}>상세 이미지</span>
                        <div className="flex-1 h-px" style={{ backgroundColor: "var(--toss-border)" }} />
                    </div>
                    <div className="space-y-3">
                        {product.detailImages!.map((img, i) => (
                            <motion.img
                                key={img}
                                src={img}
                                alt={`${product.name} 상세 이미지 ${i + 1}`}
                                className="w-full rounded-2xl"
                                style={{ border: "1px solid var(--toss-border)" }}
                                initial={{ opacity: 0, y: 12 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-40px" }}
                                transition={{ duration: 0.3, delay: i * 0.05 }}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* ── 탭 섹션 (연관상품 / 리뷰 / Q&A) ── */}
            <div className="mt-12" data-ui-id="section-product-tabs">
                {/* 탭 바 */}
                <div className="flex" style={{ borderBottom: "2px solid var(--toss-border)" }}>
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            data-ui-id={`btn-tab-${tab.id}`}
                            onClick={() => setActiveTab(tab.id)}
                            className="relative px-5 py-3 text-sm font-semibold transition-colors"
                            style={{ color: activeTab === tab.id ? "var(--toss-text-primary)" : "var(--toss-text-tertiary)" }}
                        >
                            {tab.label}
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="tab-indicator"
                                    className="absolute bottom-[-2px] left-0 right-0 h-0.5"
                                    style={{ backgroundColor: "var(--toss-blue)" }}
                                />
                            )}
                        </button>
                    ))}
                </div>

                {/* 탭 콘텐츠 */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.18 }}
                        className="pt-6"
                    >
                        {activeTab === "related" && <RelatedProducts products={relatedProducts} />}
                        {activeTab === "reviews" && <ReviewSection productId={product.id} initialCount={reviewCount} onCountChange={setReviewCount} />}
                        {activeTab === "qna"     && <QnASection productId={product.id} initialCount={qnaCount} onCountChange={setQnACount} />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    )
}
