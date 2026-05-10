"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Heart, ShoppingCart } from "lucide-react"
import { type Product } from "@/lib/data/products"

export default function ProductCard({ product }: { product: Product }) {
  const [liked, setLiked] = useState(false)

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null

  return (
    <motion.div
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
          whileTap={{ scale: 0.8 }}
          onClick={(e) => { e.preventDefault(); setLiked(!liked) }}
          className="absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-sm"
          style={{ border: "1px solid var(--toss-border)" }}
        >
          <Heart
            className="size-3.5"
            style={{ color: liked ? "var(--toss-red)" : "var(--toss-text-tertiary)", fill: liked ? "var(--toss-red)" : "none" }}
          />
        </motion.button>

        {/* Emoji */}
        <motion.span
          className="text-5xl select-none"
          whileHover={{ scale: 1.1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          {product.emoji}
        </motion.span>
      </div>

      {/* Info */}
      <div className="p-4">
        <p
          className="text-[10px] font-medium mb-1 uppercase tracking-wide"
          style={{ color: "var(--toss-text-tertiary)" }}
        >
          {product.category}
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

          {/* Add to cart */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white transition-opacity hover:opacity-85"
            style={{ backgroundColor: "var(--toss-blue)" }}
          >
            <ShoppingCart className="size-3.5" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
