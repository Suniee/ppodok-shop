"use client"

import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import type { Banner } from "@/lib/supabase/banners"

export default function PromoBanner({ banners }: { banners: Banner[] }) {
    if (banners.length === 0) return null

    const [main, ...subs] = banners

    return (
        <section data-ui-id="section-home-promo" className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">

            {/* 대형 배너 (order 1번) */}
            <motion.a
                data-ui-id="banner-promo-main"
                href={main.link}
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="relative overflow-hidden rounded-3xl flex items-center justify-between px-7 py-7 cursor-pointer"
                style={{ backgroundColor: main.bg_color }}
            >
                <div className="absolute -top-6 -right-6 w-36 h-36 rounded-full opacity-20" style={{ backgroundColor: "#fff" }} />
                <div className="absolute -bottom-10 right-16 w-24 h-24 rounded-full opacity-10" style={{ backgroundColor: "#fff" }} />
                <div className="relative z-10">
                    <span
                        className="inline-block text-xs font-bold px-2.5 py-1 rounded-full mb-3"
                        style={{ backgroundColor: "rgba(255,255,255,0.2)", color: main.text_color === "#ffffff" ? "#fff" : main.text_color }}
                    >
                        {main.tag}
                    </span>
                    <h3 className="text-xl font-black leading-snug mb-4" style={{ color: main.text_color === "#ffffff" ? "#fff" : "#191F28" }}>
                        {main.title}
                    </h3>
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
                        style={{ color: main.text_color === "#ffffff" ? "rgba(255,255,255,0.8)" : main.text_color }}>
                        {main.cta} <ArrowRight className="size-3.5" />
                    </span>
                </div>
                <span className="text-5xl relative z-10 mr-2">{main.emoji}</span>
            </motion.a>

            {/* 소형 배너들 (order 2·3번) */}
            <div className="grid grid-rows-2 gap-3">
                {subs.slice(0, 2).map((b) => (
                    <motion.a
                        key={b.id}
                        data-ui-id={`banner-promo-${b.id}`}
                        href={b.link}
                        whileHover={{ scale: 1.015 }}
                        whileTap={{ scale: 0.985 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        className="rounded-3xl flex items-center justify-between px-6 py-5 cursor-pointer"
                        style={{ backgroundColor: b.bg_color, border: b.bg_color === "#ffffff" ? "1px solid var(--toss-border)" : "none" }}
                    >
                        <div>
                            <p className="text-xs font-medium mb-1" style={{ color: "var(--toss-text-tertiary)" }}>{b.tag}</p>
                            <p className="text-base font-bold" style={{ color: "var(--toss-text-primary)" }}>
                                {b.title.includes(" ") ? (
                                    <>
                                        <span style={{ color: b.text_color }}>{b.title.split(" ")[0]}</span>
                                        {" " + b.title.split(" ").slice(1).join(" ")}
                                    </>
                                ) : <span style={{ color: b.text_color }}>{b.title}</span>}
                            </p>
                        </div>
                        <span className="text-3xl">{b.emoji}</span>
                    </motion.a>
                ))}
            </div>
        </section>
    )
}
