"use client"

import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Heart, ShoppingCart, Check } from "lucide-react"
import { type Product } from "@/lib/data/products"
import { useCart } from "@/lib/store/CartContext"

export default function ProductCard({ product }: { product: Product }) {
  const [liked, setLiked] = useState(false)
  const [added, setAdded] = useState(false)
  const { addItem, openCart } = useCart()

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (added) return
    addItem(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 800)
    // 담기 후 드로어 오픈
    setTimeout(() => openCart(), 300)
  }

  return (
    <Link href={`/products/${product.id}`} className="block">
    <motion.div
      data-ui-id={`card-product-${product.id}`}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="bg-white rounded-2xl overflow-hidden cursor-pointer group"
      style={{ border: "1px solid var(--toss-border)" }}
    >
      {/* Image area */}
      <div
        className="relative aspect-square flex items-center justify-center overflow-hidden"
        style={{ backgroundColor: "var(--toss-page-bg)" }}
      >
        {/* Badge */}
        {(product.badge || product.isNew) && (
          <span
            className="absolute top-2.5 left-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full z-10"
            style={{
              backgroundColor: product.badge === "BEST" ? "var(--toss-blue)" : product.badge === "SALE" ? "var(--toss-red)" : "var(--toss-text-primary)",
              color: "#fff",
            }}
          >
            {product.badge ?? "NEW"}
          </span>
        )}

        {/* Like */}
        <motion.button
          data-ui-id="btn-product-like"
          whileTap={{ scale: 0.8 }}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setLiked(!liked) }}
          className="absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-sm"
          style={{ border: "1px solid var(--toss-border)" }}
        >
          <Heart
            className="size-3.5"
            style={{ color: liked ? "var(--toss-red)" : "var(--toss-text-tertiary)", fill: liked ? "var(--toss-red)" : "none" }}
          />
        </motion.button>

        {product.images && product.images.length > 0 ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <motion.span
            className="text-5xl select-none"
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            {product.emoji}
          </motion.span>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <p
          className="text-[10px] font-medium mb-1 uppercase tracking-wide"
          style={{ color: "var(--toss-text-tertiary)" }}
        >
          {product.categories.map((c) => c.name).join(" · ")}
        </p>
        <h3
          className="text-sm font-semibold line-clamp-2 leading-snug mb-3"
          style={{ color: "var(--toss-text-primary)" }}
        >
          {product.name}
        </h3>

        <div className="flex items-end justify-between gap-2">
          <div>
            {discount && (
              <span className="text-xs font-bold block mb-0.5" style={{ color: "var(--toss-red)" }}>
                {discount}% 할인
              </span>
            )}
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-black" style={{ color: "var(--toss-text-primary)" }}>
                {product.price.toLocaleString()}원
              </span>
              {product.originalPrice && (
                <span className="text-xs line-through" style={{ color: "var(--toss-text-tertiary)" }}>
                  {product.originalPrice.toLocaleString()}원
                </span>
              )}
            </div>
          </div>

          {/* 장바구니 담기 버튼 */}
          <motion.button
            data-ui-id="btn-product-add-cart"
            whileTap={{ scale: 0.88 }}
            onClick={handleAddToCart}
            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white transition-colors"
            style={{ backgroundColor: added ? "#00C48C" : "var(--toss-blue)" }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {added ? (
                <motion.span
                  key="check"
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                >
                  <Check className="size-3.5" />
                </motion.span>
              ) : (
                <motion.span
                  key="cart"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <ShoppingCart className="size-3.5" />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </motion.div>
    </Link>
  )
}
