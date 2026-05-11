"use client"

import { useState, useRef } from "react"
import { Plus, Pencil, Trash2, X, ChevronUp, ChevronDown } from "lucide-react"
import { useCategories } from "@/lib/store/useCategories"
import { type Category } from "@/lib/data/categories"
import {
  insertCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
  updateCategoryOrdersAction,
} from "./actions"

const iconBgs = [
  "#EBF3FF", "#E8F8F5", "#FFF3E0", "#FCE4EC",
  "#F3E5F5", "#E8EAF6", "#E0F7FA", "#F9FBE7",
]

const inputCls = "rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-300 transition-all w-full"
const inputSt  = { backgroundColor: "var(--toss-page-bg)", color: "var(--toss-text-primary)", border: "1px solid var(--toss-border)" }

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold" style={{ color: "var(--toss-text-secondary)" }}>
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </span>
      {children}
    </div>
  )
}

type DraftCategory = Omit<Category, "id"> & { id?: number }

const emptyCategory = (sortOrder: number): DraftCategory => ({
  name: "", slug: "", icon: "📦", isActive: true, sortOrder,
})

const autoSlug = (name: string) =>
  name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")

export default function CategoriesPage() {
  const { categories, setCategories, mounted } = useCategories()
  const [editing, setEditing] = useState<DraftCategory | null>(null)
  const [isNew, setIsNew]     = useState(false)
  const [saving, setSaving]   = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const nameRef = useRef<HTMLInputElement>(null)
  const slugRef = useRef<HTMLInputElement>(null)
  const iconRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState({ name: "", icon: "📦" })

  const openNew  = () => { setEditing(emptyCategory(categories.length + 1)); setIsNew(true); setPreview({ name: "", icon: "📦" }); setFormError(null) }
  const openEdit = (c: Category) => { setEditing({ ...c }); setIsNew(false); setPreview({ name: c.name, icon: c.icon }); setFormError(null) }
  const close    = () => { setEditing(null); setIsNew(false); setFormError(null) }

  const handleSave = async () => {
    const name = nameRef.current?.value.trim() ?? ""
    const slug = slugRef.current?.value.trim() ?? ""
    const icon = iconRef.current?.value.trim() || "📦"

    // 필수 필드 검사
    if (!name) { setFormError("카테고리명을 입력해주세요."); nameRef.current?.focus(); return }
    if (!slug) { setFormError("슬러그를 입력해주세요."); slugRef.current?.focus(); return }
    if (!editing) return

    const cat = { ...editing, name, slug, icon }
    setSaving(true)
    setFormError(null)

    try {
      if (isNew) {
        const created = await insertCategoryAction(cat)
        setCategories((prev) => [...prev, created])
      } else {
        await updateCategoryAction(cat as Category)
        setCategories((prev) => prev.map((c) => c.id === (cat as Category).id ? (cat as Category) : c))
      }
      close()
    } catch (err) {
      // DB 오류를 사용자에게 표시하고 drawer는 유지
      // Supabase PostgrestError는 일반 객체라 instanceof Error가 false → message 직접 추출
      console.error("카테고리 저장 오류:", err)
      const msg = (err as { message?: string })?.message ?? "저장 중 오류가 발생했습니다."
      setFormError(msg)
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: number) => {
    await deleteCategoryAction(id)
    setCategories((prev) => prev.filter((c) => c.id !== id))
  }

  const toggle = async (cat: Category) => {
    const updated = { ...cat, isActive: !cat.isActive }
    await updateCategoryAction(updated)
    setCategories((prev) => prev.map((c) => c.id === cat.id ? updated : c))
  }

  const moveUp = async (idx: number) => {
    if (idx === 0) return
    const next = [...categories]
    ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
    const reordered = next.map((c, i) => ({ ...c, sortOrder: i + 1 }))
    setCategories(reordered)
    await updateCategoryOrdersAction(reordered)
  }

  const moveDown = async (idx: number) => {
    if (idx === categories.length - 1) return
    const next = [...categories]
    ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
    const reordered = next.map((c, i) => ({ ...c, sortOrder: i + 1 }))
    setCategories(reordered)
    await updateCategoryOrdersAction(reordered)
  }

  if (!mounted) return null

  return (
    <div data-ui-id="page-admin-categories" className="p-7 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black" style={{ color: "var(--toss-text-primary)", letterSpacing: "-0.03em" }}>
            카테고리 관리
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--toss-text-secondary)" }}>
            전체 {categories.length}개 · 노출 {categories.filter((c) => c.isActive).length}개
          </p>
        </div>
        <button
          data-ui-id="btn-admin-cat-add"
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold text-white transition-opacity hover:opacity-85"
          style={{ backgroundColor: "var(--toss-blue)" }}
        >
          <Plus className="size-4" />
          카테고리 추가
        </button>
      </div>

      {/* Preview strip */}
      <div data-ui-id="preview-admin-cat" className="bg-white rounded-2xl p-5" style={{ border: "1px solid var(--toss-border)" }}>
        <p className="text-xs font-bold mb-4" style={{ color: "var(--toss-text-tertiary)" }}>
          프론트 미리보기 — 활성 카테고리만 표시됩니다
        </p>
        <div className="flex flex-wrap gap-4">
          {categories.filter((c) => c.isActive).map((cat, i) => (
            <div key={cat.id} className="flex flex-col items-center gap-1.5">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-lg"
                style={{ backgroundColor: iconBgs[i % iconBgs.length] }}>
                {cat.icon}
              </div>
              <span className="text-[10px] font-medium text-center" style={{ color: "var(--toss-text-primary)" }}>
                {cat.name}
              </span>
            </div>
          ))}
          {categories.filter((c) => c.isActive).length === 0 && (
            <p className="text-sm" style={{ color: "var(--toss-text-tertiary)" }}>활성화된 카테고리가 없습니다</p>
          )}
        </div>
      </div>

      {/* Table */}
      <div data-ui-id="table-admin-cat-list" className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid var(--toss-border)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--toss-border)", backgroundColor: "#FAFBFC" }}>
                {["순서", "카테고리", "슬러그", "노출", "액션"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-bold" style={{ color: "var(--toss-text-tertiary)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map((cat, i) => (
                <tr key={cat.id} className="hover:bg-gray-50 transition-colors"
                  style={{ borderBottom: i < categories.length - 1 ? "1px solid var(--toss-border)" : undefined }}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-mono w-5 text-center" style={{ color: "var(--toss-text-tertiary)" }}>{cat.sortOrder}</span>
                      <div className="flex flex-col">
                        <button onClick={() => moveUp(i)} disabled={i === 0}
                          className="p-0.5 rounded hover:bg-gray-200 transition-colors disabled:opacity-20">
                          <ChevronUp className="size-3" style={{ color: "var(--toss-text-secondary)" }} />
                        </button>
                        <button onClick={() => moveDown(i)} disabled={i === categories.length - 1}
                          className="p-0.5 rounded hover:bg-gray-200 transition-colors disabled:opacity-20">
                          <ChevronDown className="size-3" style={{ color: "var(--toss-text-secondary)" }} />
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                        style={{ backgroundColor: iconBgs[i % iconBgs.length] }}>
                        {cat.icon}
                      </div>
                      <span className="text-sm font-semibold" style={{ color: "var(--toss-text-primary)" }}>{cat.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs" style={{ color: "var(--toss-text-tertiary)" }}>/{cat.slug}</td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => toggle(cat)}
                      className="relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-200"
                      style={{ backgroundColor: cat.isActive ? "var(--toss-blue)" : "#D1D6DB" }}
                    >
                      <span
                        className="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200"
                        style={{ transform: cat.isActive ? "translateX(23px)" : "translateX(2px)" }}
                      />
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(cat)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                        style={{ color: "var(--toss-text-secondary)" }}>
                        <Pencil className="size-4" />
                      </button>
                      <button onClick={() => remove(cat.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                        style={{ color: "var(--toss-red)" }}>
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
        <div data-ui-id="drawer-admin-cat-form" className="fixed top-0 bottom-0 right-0 left-56 z-50 flex">
          <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={close} />
          <div className="w-[380px] bg-white h-full overflow-auto flex flex-col shadow-2xl">
            <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--toss-border)" }}>
              <p className="text-base font-bold" style={{ color: "var(--toss-text-primary)" }}>
                {isNew ? "카테고리 추가" : "카테고리 수정"}
              </p>
              <button onClick={close} className="p-1.5 rounded-xl hover:bg-gray-100 transition-colors">
                <X className="size-4" style={{ color: "var(--toss-text-secondary)" }} />
              </button>
            </div>

            {/* 미리보기 */}
            <div className="flex justify-center items-center gap-3 mx-6 mt-6 p-5 rounded-2xl" style={{ backgroundColor: "var(--toss-page-bg)" }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl" style={{ backgroundColor: "#EBF3FF" }}>
                {preview.icon || "📦"}
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: "var(--toss-text-primary)" }}>{preview.name || "카테고리명"}</p>
                <p className="text-xs font-mono mt-0.5" style={{ color: "var(--toss-text-tertiary)" }}>/{editing.slug || "slug"}</p>
              </div>
            </div>

            {/* key로 drawer 열릴 때마다 input 초기화 */}
            <div key={editing.id ?? "new"} className="px-6 py-5 space-y-4 flex-1">
              <Field label="카테고리명" required>
                <input ref={nameRef} className={inputCls} style={inputSt}
                  defaultValue={editing.name} placeholder="예: 주방용품"
                  onInput={(e) => setPreview((p) => ({ ...p, name: (e.target as HTMLInputElement).value }))} />
              </Field>

              <Field label="슬러그 (URL)" required>
                <div className="flex items-center rounded-xl overflow-hidden" style={{ border: "1px solid var(--toss-border)" }}>
                  <span className="px-3 py-2.5 text-sm flex-shrink-0" style={{ backgroundColor: "#F2F4F6", color: "var(--toss-text-tertiary)" }}>
                    /category/
                  </span>
                  <input ref={slugRef}
                    className="flex-1 px-3 py-2.5 text-sm outline-none"
                    style={{ backgroundColor: "var(--toss-page-bg)", color: "var(--toss-text-primary)" }}
                    defaultValue={editing.slug} placeholder="kitchen"
                  />
                  {isNew && (
                    <button type="button"
                      onClick={() => {
                        if (slugRef.current && nameRef.current)
                          slugRef.current.value = autoSlug(nameRef.current.value)
                      }}
                      className="px-3 py-2.5 text-xs font-semibold flex-shrink-0 transition-colors hover:opacity-80"
                      style={{ backgroundColor: "#E8F0FF", color: "var(--toss-blue)" }}>
                      자동입력
                    </button>
                  )}
                </div>
              </Field>

              <Field label="아이콘 (이모지)">
                <input ref={iconRef} className={inputCls} style={inputSt}
                  defaultValue={editing.icon} placeholder="🛍️"
                  onInput={(e) => setPreview((p) => ({ ...p, icon: (e.target as HTMLInputElement).value }))} />
              </Field>

              <Field label="노출 여부">
                <div className="flex gap-2">
                  {[true, false].map((val) => (
                    <button key={String(val)} onClick={() => setEditing({ ...editing, isActive: val })}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                      style={{
                        backgroundColor: editing.isActive === val ? "var(--toss-text-primary)" : "var(--toss-page-bg)",
                        color: editing.isActive === val ? "#fff" : "var(--toss-text-secondary)",
                        border: "1px solid var(--toss-border)",
                      }}>
                      {val ? "👁️ 노출" : "🚫 숨김"}
                    </button>
                  ))}
                </div>
              </Field>
            </div>

            <div className="px-6 pb-6 space-y-3">
              {/* 에러 메시지 */}
              {formError && (
                <p className="text-xs font-medium px-3 py-2.5 rounded-xl"
                  style={{ backgroundColor: "#FFF0F0", color: "var(--toss-red)" }}>
                  {formError}
                </p>
              )}
              <div className="flex gap-2" style={{ borderTop: "1px solid var(--toss-border)", paddingTop: "16px" }}>
                <button
                  data-ui-id="btn-admin-cat-cancel"
                  onClick={close}
                  disabled={saving}
                  className="flex-1 py-3 rounded-2xl text-sm font-semibold transition-opacity disabled:opacity-40"
                  style={{ color: "var(--toss-text-secondary)", border: "1px solid var(--toss-border)" }}
                >
                  취소
                </button>
                <button
                  data-ui-id="btn-admin-cat-save"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white transition-opacity hover:opacity-85 disabled:opacity-60"
                  style={{ backgroundColor: "var(--toss-blue)" }}
                >
                  {saving ? "저장 중…" : isNew ? "추가" : "저장"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
