"use client"

import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"

export default function PromoBanner() {
  return (
    <section className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">

      {/* Primary — Toss Blue */}
      <motion.a
        href="/category/detergent"
        whileHover={{ scale: 1.015 }}
        whileTap={{ scale: 0.985 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="relative overflow-hidden rounded-3xl flex items-center justify-between px-7 py-7 cursor-pointer"
        style={{ backgroundColor: "var(--toss-blue)" }}
      >
        {/* Soft circle decoration */}
        <div
          className="absolute -top-6 -right-6 w-36 h-36 rounded-full opacity-20"
          style={{ backgroundColor: "#fff" }}
        />
        <div
          className="absolute -bottom-10 right-16 w-24 h-24 rounded-full opacity-10"
          style={{ backgroundColor: "#fff" }}
        />

        <div className="relative z-10">
          <span
            className="inline-block text-xs font-bold px-2.5 py-1 rounded-full mb-3"
            style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "#fff" }}
          >
            이달의 특가
          </span>
          <h3 className="text-xl font-black text-white leading-snug mb-4">
            세제/세탁용품<br />최대 30% 할인
          </h3>
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/80 hover:text-white transition-colors">
            바로가기 <ArrowRight className="size-3.5" />
          </span>
        </div>
        <span className="text-5xl relative z-10 mr-2">🧺</span>
      </motion.a>

      {/* Secondary — light */}
      <div className="grid grid-rows-2 gap-3">
        <motion.a
          href="/join"
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.985 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="bg-white rounded-3xl flex items-center justify-between px-6 py-5 cursor-pointer"
          style={{ border: "1px solid var(--toss-border)" }}
        >
          <div>
            <p className="text-xs font-medium mb-1" style={{ color: "var(--toss-text-tertiary)" }}>신규 회원 혜택</p>
            <p className="text-base font-bold" style={{ color: "var(--toss-text-primary)" }}>
              첫 구매 시 <span style={{ color: "var(--toss-blue)" }}>10% 할인</span>
            </p>
          </div>
          <span className="text-3xl">🎉</span>
        </motion.a>

        <motion.a
          href="/products?filter=free-shipping"
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.985 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="bg-white rounded-3xl flex items-center justify-between px-6 py-5 cursor-pointer"
          style={{ border: "1px solid var(--toss-border)" }}
        >
          <div>
            <p className="text-xs font-medium mb-1" style={{ color: "var(--toss-text-tertiary)" }}>무료배송</p>
            <p className="text-base font-bold" style={{ color: "var(--toss-text-primary)" }}>
              <span style={{ color: "var(--toss-blue)" }}>3만원</span> 이상 주문 시
            </p>
          </div>
          <span className="text-3xl">🚚</span>
        </motion.a>
      </div>
    </section>
  )
}
