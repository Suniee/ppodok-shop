"use client"

import { motion } from "framer-motion"
import { useCategories } from "@/lib/store/useCategories"

const iconBgs = [
  "#EBF3FF", "#E8F8F5", "#FFF3E0", "#FCE4EC",
  "#F3E5F5", "#E8EAF6", "#E0F7FA", "#F9FBE7",
]

export default function CategoryGrid() {
  const { categories, mounted } = useCategories()
  const visible = categories.filter((c) => c.active)

  return (
    <section className="mt-6">
      <div className="bg-white rounded-3xl px-6 py-6" style={{ border: "1px solid var(--toss-border)" }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold" style={{ color: "var(--toss-text-primary)" }}>
            카테고리
          </h2>
          <a href="/products" className="text-xs font-medium" style={{ color: "var(--toss-text-secondary)" }}>
            전체보기
          </a>
        </div>

        {/* 마운트 전엔 기본 높이로 자리 유지 (레이아웃 shift 방지) */}
        <div className={`grid grid-cols-4 md:grid-cols-8 gap-1 transition-opacity ${mounted ? "opacity-100" : "opacity-0"}`}>
          {visible.map((cat, i) => (
            <motion.a
              key={cat.id}
              href={`/category/${cat.slug}`}
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
