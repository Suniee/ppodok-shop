"use client"

import { motion } from "framer-motion"
import { type Category } from "@/lib/data/categories"

const iconBgs = [
  "#EBF3FF", "#E8F8F5", "#FFF3E0", "#FCE4EC",
  "#F3E5F5", "#E8EAF6", "#E0F7FA", "#F9FBE7",
]

// 서버 컴포넌트(page.tsx)에서 활성 카테고리만 걸러 전달받는다
export default function CategoryGrid({ categories }: { categories: Category[] }) {
  return (
    <section data-ui-id="section-home-category" className="mt-6">
      <div className="bg-white rounded-3xl px-6 py-6" style={{ border: "1px solid var(--toss-border)" }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold" style={{ color: "var(--toss-text-primary)" }}>
            카테고리
          </h2>
          <a href="/products" className="text-xs font-medium" style={{ color: "var(--toss-text-secondary)" }}>
            전체보기
          </a>
        </div>

        <div className="grid grid-cols-4 md:grid-cols-8 gap-1">
          {categories.map((cat, i) => (
            <motion.a
              key={cat.id}
              data-ui-id={`item-category-${cat.slug}`}
              href={`/products?category=${cat.slug}`}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="flex flex-col items-center gap-2 py-2 px-1 rounded-2xl cursor-pointer"
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl"
                style={{ backgroundColor: iconBgs[i % iconBgs.length] }}
              >
                {cat.icon}
              </div>
              <span
                className="text-[11px] font-medium text-center leading-tight"
                style={{ color: "var(--toss-text-primary)" }}
              >
                {cat.name}
              </span>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  )
}
