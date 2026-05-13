"use client"

import { useState, useTransition } from "react"
import { Plus, Pencil, Trash2, GripVertical, X, Loader2 } from "lucide-react"
import { upsertBannerAction, deleteBannerAction, toggleBannerAction } from "./actions"
import type { Banner } from "@/lib/supabase/banners"

type BannerForm = Omit<Banner, "id" | "created_at"> & { id?: string }

const emptyBanner = (): BannerForm => ({
    title: "", subtitle: "", tag: "", cta: "지금 쇼핑하기",
    link: "/", emoji: "🎁",
    bg_color: "#EBF3FF", text_color: "#0064FF",
    position: "hero", active: true, order: 99,
})

const inputCls = "rounded-xl px-3 py-2.5 text-sm outline-none transition-all w-full"
const inputStyle = {
    backgroundColor: "var(--toss-page-bg)",
    color: "var(--toss-text-primary)",
    border: "1px solid var(--toss-border)",
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold" style={{ color: "var(--toss-text-secondary)" }}>{label}</span>
            {children}
        </label>
    )
}

export default function BannersClient({ initial }: { initial: Banner[] }) {
    const [banners, setBanners] = useState<Banner[]>(initial)
    const [editing, setEditing] = useState<BannerForm | null>(null)
    const [isNew, setIsNew]     = useState(false)
    const [isPending, startTransition] = useTransition()

    const openNew  = () => { setEditing(emptyBanner()); setIsNew(true) }
    const openEdit = (b: Banner) => {
        setEditing({ id: b.id, title: b.title, subtitle: b.subtitle, tag: b.tag,
            cta: b.cta, link: b.link, emoji: b.emoji, bg_color: b.bg_color,
            text_color: b.text_color, position: b.position, active: b.active, order: b.order })
        setIsNew(false)
    }
    const close = () => setEditing(null)

    const handleSave = () => {
        if (!editing) return
        startTransition(async () => {
            await upsertBannerAction(editing)
            // 낙관적 업데이트
            if (isNew) {
                setBanners((p) => [...p, { ...editing, id: Date.now().toString(), created_at: new Date().toISOString() }])
            } else {
                setBanners((p) => p.map((b) => b.id === editing.id ? { ...b, ...editing } : b))
            }
            close()
        })
    }

    const handleDelete = (id: string) => {
        startTransition(async () => {
            await deleteBannerAction(id)
            setBanners((p) => p.filter((b) => b.id !== id))
        })
    }

    const handleToggle = (b: Banner) => {
        startTransition(async () => {
            await toggleBannerAction(b.id, !b.active)
            setBanners((p) => p.map((x) => x.id === b.id ? { ...x, active: !x.active } : x))
        })
    }

    const heroBanners  = banners.filter((b) => b.position === "hero")
    const promoBanners = banners.filter((b) => b.position === "promo")

    const BannerRow = ({ b }: { b: Banner }) => (
        <div className="bg-white rounded-2xl overflow-hidden flex" style={{ border: "1px solid var(--toss-border)" }}>
            <div className="flex items-center px-3 cursor-grab" style={{ color: "var(--toss-text-tertiary)" }}>
                <GripVertical className="size-4" />
            </div>
            <div className="w-44 flex-shrink-0 flex items-center justify-between px-5 py-4"
                style={{ backgroundColor: b.bg_color }}>
                <div className="min-w-0">
                    <p className="text-[10px] font-bold mb-0.5" style={{ color: b.text_color }}>{b.tag || "태그"}</p>
                    <p className="text-sm font-black leading-snug" style={{ color: "#191F28" }}>{b.title || "제목"}</p>
                </div>
                <span className="text-2xl ml-3">{b.emoji}</span>
            </div>
            <div className="flex-1 px-5 py-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--toss-text-primary)" }}>{b.title || "—"}</p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: "var(--toss-text-secondary)" }}>
                        {b.subtitle || "—"} · {b.link}
                    </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: b.active ? "#E8F8F5" : "#F2F4F6", color: b.active ? "#00A878" : "#8B95A1" }}>
                    {b.active ? "활성" : "비활성"}
                </span>
                <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => handleToggle(b)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors hover:opacity-80"
                        style={{ backgroundColor: b.active ? "#FFF0F0" : "var(--toss-blue-light)", color: b.active ? "var(--toss-red)" : "var(--toss-blue)" }}>
                        {b.active ? "숨김" : "활성"}
                    </button>
                    <button onClick={() => openEdit(b)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                        style={{ color: "var(--toss-text-secondary)" }}>
                        <Pencil className="size-4" />
                    </button>
                    <button onClick={() => handleDelete(b.id)} className="p-2 rounded-xl hover:bg-red-50 transition-colors"
                        style={{ color: "var(--toss-red)" }}>
                        <Trash2 className="size-4" />
                    </button>
                </div>
            </div>
        </div>
    )

    return (
        <div className="p-7 space-y-7">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-black" style={{ color: "var(--toss-text-primary)", letterSpacing: "-0.03em" }}>배너 관리</h1>
                    <p className="text-sm mt-0.5" style={{ color: "var(--toss-text-secondary)" }}>총 {banners.length}개 배너</p>
                </div>
                <button onClick={openNew}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold text-white transition-opacity hover:opacity-85"
                    style={{ backgroundColor: "var(--toss-blue)" }}>
                    <Plus className="size-4" />배너 추가
                </button>
            </div>

            {/* 히어로 배너 */}
            <section className="space-y-3">
                <h2 className="text-sm font-bold" style={{ color: "var(--toss-text-secondary)" }}>
                    히어로 배너 <span className="font-normal">(최상단 캐러셀)</span>
                </h2>
                {heroBanners.length === 0
                    ? <p className="text-sm py-4 text-center" style={{ color: "var(--toss-text-tertiary)" }}>등록된 배너가 없습니다.</p>
                    : heroBanners.map((b) => <BannerRow key={b.id} b={b} />)}
            </section>

            {/* 프로모 배너 */}
            <section className="space-y-3">
                <h2 className="text-sm font-bold" style={{ color: "var(--toss-text-secondary)" }}>
                    프로모 배너 <span className="font-normal">(신상품·베스트 사이 · 순서 1번=대형, 2·3번=소형)</span>
                </h2>
                {promoBanners.length === 0
                    ? <p className="text-sm py-4 text-center" style={{ color: "var(--toss-text-tertiary)" }}>등록된 배너가 없습니다.</p>
                    : promoBanners.map((b) => <BannerRow key={b.id} b={b} />)}
            </section>

            {/* 편집 드로어 */}
            {editing && (
                <div className="fixed inset-0 z-50 flex">
                    <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={close} />
                    <div className="w-[420px] bg-white h-full overflow-auto flex flex-col shadow-2xl">
                        <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--toss-border)" }}>
                            <p className="text-base font-bold" style={{ color: "var(--toss-text-primary)" }}>
                                {isNew ? "배너 추가" : "배너 수정"}
                            </p>
                            <button onClick={close} className="p-1.5 rounded-xl hover:bg-gray-100 transition-colors">
                                <X className="size-4" style={{ color: "var(--toss-text-secondary)" }} />
                            </button>
                        </div>

                        {/* 미리보기 */}
                        <div className="mx-6 mt-5 rounded-2xl flex items-center justify-between px-5 py-4"
                            style={{ backgroundColor: editing.bg_color }}>
                            <div>
                                <p className="text-xs font-bold mb-1" style={{ color: editing.text_color }}>{editing.tag || "태그"}</p>
                                <p className="text-base font-black" style={{ color: "#191F28" }}>{editing.title || "제목"}</p>
                                <p className="text-xs mt-0.5" style={{ color: "#8B95A1" }}>{editing.subtitle || "부제목"}</p>
                            </div>
                            <span className="text-4xl">{editing.emoji}</span>
                        </div>

                        <div className="px-6 py-5 space-y-4 flex-1">
                            <Field label="위치">
                                <select className={inputCls} style={inputStyle}
                                    value={editing.position}
                                    onChange={(e) => setEditing({ ...editing, position: e.target.value as "hero" | "promo" })}>
                                    <option value="hero">히어로 (최상단 캐러셀)</option>
                                    <option value="promo">프로모 (중간 배너)</option>
                                </select>
                            </Field>
                            <Field label="순서">
                                <input type="number" min={1} className={inputCls} style={inputStyle}
                                    value={editing.order}
                                    onChange={(e) => setEditing({ ...editing, order: parseInt(e.target.value) || 0 })} />
                            </Field>
                            <Field label="태그">
                                <input className={inputCls} style={inputStyle} value={editing.tag}
                                    onChange={(e) => setEditing({ ...editing, tag: e.target.value })} placeholder="봄 특가전" />
                            </Field>
                            <Field label="제목">
                                <input className={inputCls} style={inputStyle} value={editing.title}
                                    onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder="배너 제목" />
                            </Field>
                            <Field label="부제목">
                                <input className={inputCls} style={inputStyle} value={editing.subtitle}
                                    onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })} placeholder="부제목" />
                            </Field>
                            <Field label="버튼 텍스트">
                                <input className={inputCls} style={inputStyle} value={editing.cta}
                                    onChange={(e) => setEditing({ ...editing, cta: e.target.value })} />
                            </Field>
                            <Field label="링크 URL">
                                <input className={inputCls} style={inputStyle} value={editing.link}
                                    onChange={(e) => setEditing({ ...editing, link: e.target.value })} placeholder="/products" />
                            </Field>
                            <Field label="이모지">
                                <input className={inputCls} style={inputStyle} value={editing.emoji}
                                    onChange={(e) => setEditing({ ...editing, emoji: e.target.value })} />
                            </Field>
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="배경 색상">
                                    <input type="color" value={editing.bg_color}
                                        onChange={(e) => setEditing({ ...editing, bg_color: e.target.value })}
                                        className="w-full h-10 rounded-xl cursor-pointer border"
                                        style={{ borderColor: "var(--toss-border)" }} />
                                </Field>
                                <Field label="강조 색상">
                                    <input type="color" value={editing.text_color}
                                        onChange={(e) => setEditing({ ...editing, text_color: e.target.value })}
                                        className="w-full h-10 rounded-xl cursor-pointer border"
                                        style={{ borderColor: "var(--toss-border)" }} />
                                </Field>
                            </div>
                        </div>

                        <div className="px-6 py-4 flex gap-2" style={{ borderTop: "1px solid var(--toss-border)" }}>
                            <button onClick={close}
                                className="flex-1 py-3 rounded-2xl text-sm font-semibold transition-colors hover:bg-gray-100"
                                style={{ color: "var(--toss-text-secondary)", border: "1px solid var(--toss-border)" }}>
                                취소
                            </button>
                            <button onClick={handleSave} disabled={isPending}
                                className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white transition-opacity hover:opacity-85 disabled:opacity-50 flex items-center justify-center gap-2"
                                style={{ backgroundColor: "var(--toss-blue)" }}>
                                {isPending ? <><Loader2 className="size-4 animate-spin" />저장 중...</> : (isNew ? "추가" : "저장")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
