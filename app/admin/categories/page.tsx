"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, X, ChevronUp, ChevronDown, Eye, EyeOff } from "lucide-react"
import { useCategories } from "@/lib/store/useCategories"
import { type Category } from "@/lib/data/categories"

const iconBgs = [
  "#EBF3FF", "#E8F8F5", "#FFF3E0", "#FCE4EC",
  "#F3E5F5", "#E8EAF6", "#E0F7FA", "#F9FBE7",
]

const emptyCategory = (order: number): Category => ({
  id: `C${Date.now()}`,
  name: "",
  slug: "",
  icon: "📦",
  active: true,
  order,
})

export default function CategoriesPage() {
  const { categories, save, mounted } = useCategories()
  const [editing, setEditing] = useState<Category | null>(null)
  const [isNew, setIsNew]     = useState(false)

  const openNew  = () => { setEditing(emptyCategory(categories.length + 1)); setIsNew(true) }
  const openEdit = (c: Category) => { setEditing({ ...c }); setIsNew(false) }
  const close    = () => { setEditing(null); setIsNew(false) }

  const handleSave = () => {
    if (!editing || !editing.name.trim() || !editing.slug.trim()) return
    if (isNew) {
      save([...categories, editing])
    } else {
      save(categories.map((c) => (c.id === editing.id ? editing : c)))
    }
    close()
  }

  const remove  = (id: string) => save(categories.filter((c) => c.id !== id))
  const toggle  = (id: string) => save(categories.map((c) => c.id === id ? { ...c, active: !c.active } : c))

  const moveUp = (idx: number) => {
    if (idx === 0) return
    const next = [...categories]
    ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
    save(next.map((c, i) => ({ ...c, order: i + 1 })))
  }

  const moveDown = (idx: number) => {
    if (idx === categories.length - 1) return
    const next = [...categories]
    ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
    save(next.map((c, i) => ({ ...c, order: i + 1 })))
  }

  const autoSlug = (name: string) =>
    name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")

  const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold" style={{ color: "var(--toss-text-secondary)" }}>
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </span>
      {children}
    </label>
  )

  const inputCls = "rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-300 transition-all w-full"
  const inputSt  = { backgroundColor: "var(--toss-page-bg)", color: "var(--toss-text-primary)", border: "1px solid var(--toss-border)" }

  if (!mounted) return null

  return (
    <div className="p-7 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black" style={{ color: "var(--toss-text-primary)", letterSpacing: "-0.03em" }}>
            카테고리 관리
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--toss-text-secondary)" }}>
            전체 {categories.length}개 · 노출 {categories.filter((c) => c.active).length}개
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold text-white transition-opacity hover:opacity-85"
          style={{ backgroundColor: "var(--toss-blue)" }}
        >
          <Plus className="size-4" />
          카테고리 추가
        </button>
      </div>

      {/* Preview strip */}
      <div className="bg-white rounded-2xl p-5" style={{ border: "1px solid var(--toss-border)" }}>
        <p className="text-xs font-bold mb-4" style={{ color: "var(--toss-text-tertiary)" }}>
          프론트 미리보기 — 활성 카테고리만 표시됩니다
        </p>
        <div className="flex flex-wrap gap-4">
          {categories.filter((c) => c.active).map((cat, i) => (
            <div key={cat.id} className="flex flex-col items-center gap-1.5">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center text-lg"
                style={{ backgroundColor: iconBgs[i % iconBgs.length] }}
              >
                {cat.icon}
              </div>
              <span className="text-[10px] font-medium text-center" style={{ color: "var(--toss-text-primary)" }}>
                {cat.name}
              </span>
            </div>
          ))}
          {categories.filter((c) => c.active).length === 0 && (
            <p className="text-sm" style={{ color: "var(--toss-text-tertiary)" }}>활성화된 카테고리가 없습니다</p>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid var(--toss-border)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--toss-border)", backgroundColor: "#FAFBFC" }}>
                {["순서", "카테고리", "슬러그", "노출", "액션"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-bold" style={{ color: "var(--toss-text-tertiary)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map((cat, i) => (
                <tr
                  key={cat.id}
                  className="hover:bg-gray-50 transition-colors"
                  style={{ borderBottom: i < categories.length - 1 ? "1px solid var(--toss-border)" : undefined }}
                >
                  {/* 순서 */}
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-mono w-5 text-center" style={{ color: "var(--toss-text-tertiary)" }}>
                        {cat.order}
                      </span>
                      <div className="flex flex-col">
                        <button
                          onClick={() => moveUp(i)}
                          disabled={i === 0}
                          className="p-0.5 rounded hover:bg-gray-200 transition-colors disabled:opacity-20"
                        >
                          <ChevronUp className="size-3" style={{ color: "var(--toss-text-secondary)" }} />
                        </button>
                        <button
                          onClick={() => moveDown(i)}
                          disabled={i === categories.length - 1}
                          className="p-0.5 rounded hover:bg-gray-200 transition-colors disabled:opacity-20"
                        >
                          <ChevronDown className="size-3" style={{ color: "var(--toss-text-secondary)" }} />
                        </button>
                      </div>
                    </div>
                  </td>

                  {/* 카테고리 */}
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                        style={{ backgroundColor: iconBgs[i % iconBgs.length] }}
                      >
                        {cat.icon}
                      </div>
                      <span className="text-sm font-semibold" style={{ color: "var(--toss-text-primary)" }}>
                        {cat.name}
                      </span>
                    </div>
                  </td>

                  {/* 슬러그 */}
                  <td className="px-5 py-3 font-mono text-xs" style={{ color: "var(--toss-text-tertiary)" }}>
                    /{cat.slug}
                  </td>

                  {/* 노출 토글 */}
                  <td className="px-5 py-3">
                    <button
                      onClick={() => toggle(cat.id)}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors hover:opacity-80"
                      style={{
                        backgroundColor: cat.active ? "#E8F8F5" : "#F2F4F6",
                        color: cat.active ? "#00A878" : "var(--toss-text-tertiary)",
                      }}
                    >
                      {cat.active ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
                      {cat.active ? "노출중" : "숨김"}
                    </button>
                  </td>

                  {/* 액션 */}
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(cat)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                        style={{ color: "var(--toss-text-secondary)" }}
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        onClick={() => remove(cat.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                        style={{ color: "var(--toss-red)" }}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer */}
      {editing && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={close} />
          <div className="w-[380px] bg-white h-full overflow-auto flex flex-col shadow-2xl">
            {/* Drawer header */}
            <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--toss-border)" }}>
              <p className="text-base font-bold" style={{ color: "var(--toss-text-primary)" }}>
                {isNew ? "카테고리 추가" : "카테고리 수정"}
              </p>
              <button onClick={close} className="p-1.5 rounded-xl hover:bg-gray-100 transition-colors">
                <X className="size-4" style={{ color: "var(--toss-text-secondary)" }} />
              </button>
            </div>

            {/* Mini preview */}
            <div className="flex justify-center items-center gap-3 mx-6 mt-6 p-5 rounded-2xl" style={{ backgroundColor: "var(--toss-page-bg)" }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl" style={{ backgroundColor: "#EBF3FF" }}>
                {editing.icon || "📦"}
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: "var(--toss-text-primary)" }}>{editing.name || "카테고리명"}</p>
                <p className="text-xs font-mono mt-0.5" style={{ color: "var(--toss-text-tertiary)" }}>/{editing.slug || "slug"}</p>
              </div>
            </div>

            {/* Form */}
            <div className="px-6 py-5 space-y-4 flex-1">
              <Field label="카테고리명" required>
                <input
                  className={inputCls} style={inputSt}
                  value={editing.name} placeholder="예: 주방용품"
                  onChange={(e) => {
                    const name = e.target.value
                    setEditing({
                      ...editing, name,
                      slug: isNew ? autoSlug(name) : editing.slug,
                    })
                  }}
                />
              </Field>

              <Field label="슬러그 (URL)" required>
                <div className="flex items-center rounded-xl overflow-hidden" style={{ border: "1px solid var(--toss-border)" }}>
                  <span className="px-3 py-2.5 text-sm flex-shrink-0" style={{ backgroundColor: "#F2F4F6", color: "var(--toss-text-tertiary)" }}>
                    /category/
                  </span>
                  <input
                    className="flex-1 px-3 py-2.5 text-sm outline-none"
                    style={{ backgroundColor: "var(--toss-page-bg)", color: "var(--toss-text-primary)" }}
                    value={editing.slug} placeholder="kitchen"
                    onChange={(e) => setEditing({ ...editing, slug: e.target.value.replace(/[^a-z0-9-]/g, "") })}
                  />
                </div>
              </Field>

              <Field label="아이콘 (이모지)">
                <input
                  className={inputCls} style={inputSt}
                  value={editing.icon} placeholder="🛍️"
                  onChange={(e) => setEditing({ ...editing, icon: e.target.value })}
                />
                <p className="text-[10px] mt-1" style={{ color: "var(--toss-text-tertiary)" }}>
                  이모지를 직접 입력하거나 복사해서 붙여넣기 하세요
                </p>
              </Field>

              <Field label="노출 여부">
                <div className="flex gap-2">
                  {[true, false].map((val) => (
                    <button
                      key={String(val)}
                      onClick={() => setEditing({ ...editing, active: val })}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                      style={{
                        backgroundColor: editing.active === val ? "var(--toss-text-primary)" : "var(--toss-page-bg)",
                        color: editing.active === val ? "#fff" : "var(--toss-text-secondary)",
                        border: "1px solid var(--toss-border)",
                      }}
                    >
                      {val ? "👁️ 노출" : "🚫 숨김"}
                    </button>
                  ))}
                </div>
              </Field>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 flex gap-2" style={{ borderTop: "1px solid var(--toss-border)" }}>
              <button
                onClick={close}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold"
                style={{ color: "var(--toss-text-secondary)", border: "1px solid var(--toss-border)" }}
              >
                취소
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white transition-opacity hover:opacity-85"
                style={{ backgroundColor: editing.name && editing.slug ? "var(--toss-blue)" : "var(--toss-text-tertiary)" }}
              >
                {isNew ? "추가" : "저장"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
