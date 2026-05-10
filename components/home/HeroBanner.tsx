"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"

const slides = [
  {
    id: 1,
    eyebrow: "봄 특가전",
    title: "생활용품\n최대 40% 할인",
    sub: "4월 한정 특별 혜택",
    cta: "지금 쇼핑하기",
    bg: "var(--toss-blue-light)",
    textColor: "var(--toss-blue)",
    emoji: "🌸",
    badgeBg: "var(--toss-blue)",
    badgeText: "#fff",
  },
  {
    id: 2,
    eyebrow: "신상품 입고",
    title: "주방용품\n새로 들어왔어요",
    sub: "스마트한 주방의 시작",
    cta: "신상품 보기",
    bg: "#F0FFF4",
    textColor: "#00A878",
    emoji: "🍳",
    badgeBg: "#00A878",
    badgeText: "#fff",
  },
  {
    id: 3,
    eyebrow: "K-뷰티 기획전",
    title: "피부 고민\n이제 해결해요",
    sub: "인기 화장품 특별가",
    cta: "할인 상품 보기",
    bg: "#FFF0F6",
    textColor: "#C9006B",
    emoji: "💄",
    badgeBg: "#C9006B",
    badgeText: "#fff",
  },
]

export default function HeroBanner() {
  const [cur, setCur] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setCur((c) => (c + 1) % slides.length), 5000)
    return () => clearInterval(t)
  }, [])

  const s = slides[cur]

  return (
    <div
      className="rounded-3xl overflow-hidden relative"
      style={{ backgroundColor: s.bg, transition: "background-color 0.5s ease" }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={cur}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="flex items-center justify-between px-8 py-10 md:px-12 md:py-14"
        >
          <div>
            {/* Eyebrow badge */}
            <span
              className="inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full mb-4"
              style={{ backgroundColor: s.badgeBg, color: s.badgeText }}
            >
              {s.eyebrow}
            </span>

            {/* Headline */}
            <h2
              className="text-[2rem] md:text-[2.5rem] font-black leading-tight whitespace-pre-line mb-2"
              style={{ color: "var(--toss-text-primary)", letterSpacing: "-0.03em" }}
            >
              {s.title}
            </h2>
            <p className="text-sm mb-7" style={{ color: "var(--toss-text-secondary)" }}>
              {s.sub}
            </p>

            {/* CTA */}
            <button
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white transition-opacity hover:opacity-85"
              style={{ backgroundColor: s.textColor }}
            >
              {s.cta}
              <ArrowRight className="size-3.5" />
            </button>
          </div>

          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
            className="hidden md:flex text-[5.5rem] select-none"
          >
            {s.emoji}
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Arrows */}
      <button
        onClick={() => setCur((c) => (c - 1 + slides.length) % slides.length)}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/70 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-sm"
        style={{ color: "var(--toss-text-secondary)" }}
      >
        <ChevronLeft className="size-4" />
      </button>
      <button
        onClick={() => setCur((c) => (c + 1) % slides.length)}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/70 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-sm"
        style={{ color: "var(--toss-text-secondary)" }}
      >
        <ChevronRight className="size-4" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 right-6 flex gap-1.5">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCur(i)}
            className="h-1.5 rounded-full transition-all duration-300"
            style={{
              width: i === cur ? "20px" : "6px",
              backgroundColor: i === cur ? s.textColor : "rgba(0,0,0,0.15)",
            }}
          />
        ))}
      </div>
    </div>
  )
}
