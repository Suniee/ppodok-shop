"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, GripVertical, X } from "lucide-react"
import { initialBanners, type Banner } from "@/lib/data/banners"

const emptyBanner = (): Banner => ({
  id: `B${Date.now()}`,
  title: "", subtitle: "", tag: "", cta: "지금 쇼핑하기",
  link: "/products", emoji: "🎁",
  bgColor: "#EBF3FF", textColor: "#0064FF",
  active: true, order: 99,
  createdAt: new Date().toISOString().slice(0, 10),
})

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>(initialBanners)
  const [editing, setEditing] = useState<Banner | null>(null)
  const [isNew, setIsNew]     = useState(false)

  const openNew  = () => { setEditing(emptyBanner()); setIsNew(true) }
  const openEdit = (b: Banner) => { setEditing({ ...b }); setIsNew(false) }
  const close    = () => { setEditing(null); setIsNew(false) }

  const save = () => {
    if (!editing) return
    if (isNew) setBanners((p) => [...p, { ...editing, order: p.length + 1 }])
    else        setBanners((p) => p.map((b) => (b.id === editing.id ? editing : b)))
    close()
  }

  const remove = (id: string) => setBanners((p) => p.filter((b) => b.id !== id))
  const toggle = (id: string) => setBanners((p) => p.map((b) => b.id === id ? { ...b, active: !b.active } : b))

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold" style={{ color: "var(--toss-text-secondary)" }}>{label}</span>
      {children}
    </label>
  )

  const inputCls = "rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-300 transition-all"
  const inputStyle = { backgroundColor: "var(--toss-page-bg)", color: "var(--toss-text-primary)", border: "1px solid var(--toss-border)" }

  return (
    <div className="p-7 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black" style={{ color: "var(--toss-text-primary)", letterSpacing: "-0.03em" }}>배너 관리</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--toss-text-secondary)" }}>총 {banners.length}개 배너</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold text-white transition-opacity hover:opacity-85"
          style={{ backgroundColor: "var(--toss-blue)" }}
        >
          <Plus className="size-4" />
          배너 추가
        </button>
      </div>

      {/* Banner list */}
      <div className="space-y-3">
        {banners.map((b) => (
          <div
            key={b.id}
            className="bg-white rounded-2xl overflow-hidden flex"
            style={{ border: "1px solid var(--toss-border)" }}
          >
            {/* Drag handle (visual) */}
            <div className="flex items-center px-3 cursor-grab" style={{ color: "var(--toss-text-tertiary)" }}>
              <GripVertical className="size-4" />
            </div>

            {/* Preview */}
            <div
              className="w-44 flex-shrink-0 flex items-center justify-between px-5 py-4"
              style={{ backgroundColor: b.bgColor }}
            >
              <div className="min-w-0">
                <p className="text-[10px] font-bold mb-0.5" style={{ color: b.textColor }}>
                  {b.tag || "태그"}
                </p>
                <p className="text-sm font-black leading-snug" style={{ color: "#191F28" }}>
                  {b.title || "제목"}
                </p>
              </div>
              <span className="text-2xl ml-3">{b.emoji}</span>
            </div>

            {/* Info */}
            <div className="flex-1 px-5 py-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: "var(--toss-text-primary)" }}>
                  {b.title || "—"}
                </p>
                <p className="text-xs mt-0.5 truncate" style={{ color: "var(--toss-text-secondary)" }}>
                  {b.subtitle || "—"} · {b.link}
                </p>
              </div>

              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: b.active ? "#E8F8F5" : "#F2F4F6", color: b.active ? "#00A878" : "#8B95A1" }}
              >
                {b.active ? "활성" : "비활성"}
              </span>
              <span className="text-xs flex-shrink-0" style={{ color: "var(--toss-text-tertiary)" }}>
                {b.createdAt}
              </span>

              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => toggle(b.id)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors hover:opacity-80"
                  style={{
                    backgroundColor: b.active ? "#FFF0F0" : "var(--toss-blue-light)",
                    color: b.active ? "var(--toss-red)" : "var(--toss-blue)",
                  }}
                >
                  {b.active ? "숨김" : "활성"}
                </button>
                <button
                  onClick={() => openEdit(b)}
                  className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                  style={{ color: "var(--toss-text-secondary)" }}
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  onClick={() => remove(b.id)}
                  className="p-2 rounded-xl hover:bg-red-50 transition-colors"
                  style={{ color: "var(--toss-red)" }}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit / New drawer */}
      {editing && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={close} />
          <div className="w-[420px] bg-white h-full overflow-auto flex flex-col shadow-2xl">
            {/* Drawer header */}
            <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--toss-border)" }}>
              <p className="text-base font-bold" style={{ color: "var(--toss-text-primary)" }}>
                {isNew ? "배너 추가" : "배너 수정"}
              </p>
              <button onClick={close} className="p-1.5 rounded-xl hover:bg-gray-100 transition-colors">
                <X className="size-4" style={{ color: "var(--toss-text-secondary)" }} />
              </button>
            </div>

            {/* Preview */}
            <div
              className="mx-6 mt-5 rounded-2xl flex items-center justify-between px-5 py-4"
              style={{ backgroundColor: editing.bgColor }}
            >
              <div>
                <p className="text-xs font-bold mb-1" style={{ color: editing.textColor }}>{editing.tag || "태그"}</p>
                <p className="text-base font-black" style={{ color: "#191F28" }}>{editing.title || "제목"}</p>
                <p className="text-xs mt-0.5" style={{ color: "#8B95A1" }}>{editing.subtitle || "부제목"}</p>
              </div>
              <span className="text-4xl">{editing.emoji}</span>
            </div>

            {/* Form */}
            <div className="px-6 py-5 space-y-4 flex-1">
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
                  <input type="color" value={editing.bgColor}
                    onChange={(e) => setEditing({ ...editing, bgColor: e.target.value })}
                    className="w-full h-10 rounded-xl cursor-pointer border"
                    style={{ borderColor: "var(--toss-border)" }} />
                </Field>
                <Field label="강조 색상">
                  <input type="color" value={editing.textColor}
                    onChange={(e) => setEditing({ ...editing, textColor: e.target.value })}
                    className="w-full h-10 rounded-xl cursor-pointer border"
                    style={{ borderColor: "var(--toss-border)" }} />
                </Field>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 flex gap-2" style={{ borderTop: "1px solid var(--toss-border)" }}>
              <button onClick={close} className="flex-1 py-3 rounded-2xl text-sm font-semibold transition-colors hover:bg-gray-100"
                style={{ color: "var(--toss-text-secondary)", border: "1px solid var(--toss-border)" }}>
                취소
              </button>
              <button onClick={save} className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white transition-opacity hover:opacity-85"
                style={{ backgroundColor: "var(--toss-blue)" }}>
                {isNew ? "추가" : "저장"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
