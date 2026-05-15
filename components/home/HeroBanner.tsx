"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"
import type { Banner } from "@/lib/supabase/banners"

export default function HeroBanner({ banners }: { banners: Banner[] }) {
    const [cur, setCur] = useState(0)
    const router = useRouter()

    useEffect(() => {
        if (banners.length <= 1) return
        const t = setInterval(() => setCur((c) => (c + 1) % banners.length), 5000)
        return () => clearInterval(t)
    }, [banners.length])

    if (banners.length === 0) return null

    const s = banners[cur]

    return (
        <div
            data-ui-id="banner-home-hero"
            className={`rounded-3xl overflow-hidden relative ${s.link !== "/" ? "cursor-pointer" : ""}`}
            style={{ backgroundColor: s.bg_color, transition: "background-color 0.5s ease" }}
            onClick={s.link !== "/" ? () => router.push(s.link) : undefined}
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={s.id}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="flex items-center justify-between px-8 py-10 md:px-12 md:py-14"
                >
                    <div>
                        <span
                            className="inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full mb-4"
                            style={{ backgroundColor: s.text_color, color: "#fff" }}
                        >
                            {s.tag}
                        </span>
                        <h2
                            className="text-[2rem] md:text-[2.5rem] font-black leading-tight whitespace-pre-line mb-2"
                            style={{ color: "var(--toss-text-primary)", letterSpacing: "-0.03em" }}
                        >
                            {s.title}
                        </h2>
                        <p className="text-sm mb-7" style={{ color: "var(--toss-text-secondary)" }}>
                            {s.subtitle}
                        </p>
                        <span
                            data-ui-id="btn-banner-hero-cta"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white"
                            style={{ backgroundColor: s.text_color }}
                        >
                            {s.cta}
                            <ArrowRight className="size-3.5" />
                        </span>
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

            {banners.length > 1 && (
                <>
                    <button
                        data-ui-id="btn-banner-hero-prev"
                        onClick={(e) => { e.stopPropagation(); setCur((c) => (c - 1 + banners.length) % banners.length) }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/70 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-sm"
                        style={{ color: "var(--toss-text-secondary)" }}
                    >
                        <ChevronLeft className="size-4" />
                    </button>
                    <button
                        data-ui-id="btn-banner-hero-next"
                        onClick={(e) => { e.stopPropagation(); setCur((c) => (c + 1) % banners.length) }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/70 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-sm"
                        style={{ color: "var(--toss-text-secondary)" }}
                    >
                        <ChevronRight className="size-4" />
                    </button>
                    <div className="absolute bottom-4 right-6 flex gap-1.5">
                        {banners.map((_, i) => (
                            <button
                                key={i}
                                onClick={(e) => { e.stopPropagation(); setCur(i) }}
                                className="h-1.5 rounded-full transition-all duration-300"
                                style={{
                                    width: i === cur ? "20px" : "6px",
                                    backgroundColor: i === cur ? s.text_color : "rgba(0,0,0,0.15)",
                                }}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}
