"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, Search, X } from "lucide-react"
import { products as initialProducts, type Product } from "@/lib/data/products"
import { categories } from "@/lib/data/categories"

const bgOptions = ["bg-pink-50", "bg-blue-50", "bg-green-50", "bg-yellow-50", "bg-purple-50", "bg-orange-50", "bg-cyan-50", "bg-teal-50"]

const emptyProduct = (): Product => ({
  id: `P${Date.now()}`,
  name: "", price: 0, category: "생활용품", categorySlug: "life",
  emoji: "📦", bgColor: "bg-gray-50", isNew: true,
})

export default function ProductsPage() {
  const [items, setItems]     = useState<Product[]>(initialProducts)
  const [query, setQuery]     = useState("")
  const [catFilter, setCat]   = useState("all")
  const [editing, setEditing] = useState<Product | null>(null)
  const [isNew, setIsNew]     = useState(false)

  const openNew  = () => { setEditing(emptyProduct()); setIsNew(true) }
  const openEdit = (p: Product) => { setEditing({ ...p }); setIsNew(false) }
  const close    = () => { setEditing(null); setIsNew(false) }

  const save = () => {
    if (!editing || !editing.name || editing.price <= 0) return
    if (isNew) setItems((p) => [{ ...editing }, ...p])
    else        setItems((p) => p.map((x) => (x.id === editing.id ? editing : x)))
    close()
  }

  const remove = (id: string) => setItems((p) => p.filter((x) => x.id !== id))

  const filtered = items.filter(
    (p) =>
      (catFilter === "all" || p.categorySlug === catFilter) &&
      p.name.toLowerCase().includes(query.toLowerCase())
  )

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold" style={{ color: "var(--toss-text-secondary)" }}>{label}</span>
      {children}
    </label>
  )

  const inputCls = "rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-300 transition-all w-full"
  const inputStyle = { backgroundColor: "var(--toss-page-bg)", color: "var(--toss-text-primary)", border: "1px solid var(--toss-border)" }

  return (
    <div className="p-7 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black" style={{ color: "var(--toss-text-primary)", letterSpacing: "-0.03em" }}>상품 관리</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--toss-text-secondary)" }}>전체 {items.length}개 상품</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold text-white transition-opacity hover:opacity-85"
          style={{ backgroundColor: "var(--toss-blue)" }}
        >
          <Plus className="size-4" />
          상품 추가
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-white rounded-2xl px-4 py-2.5 flex-1 min-w-52" style={{ border: "1px solid var(--toss-border)" }}>
          <Search className="size-4" style={{ color: "var(--toss-text-tertiary)" }} />
          <input value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="상품명 검색" className="bg-transparent flex-1 text-sm outline-none"
            style={{ color: "var(--toss-text-primary)" }} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[{ id: "all", name: "전체", icon: "🛍️" }, ...categories].map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id === "all" ? "all" : (c as typeof categories[number]).slug)}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
              style={{
                backgroundColor: catFilter === (c.id === "all" ? "all" : (c as typeof categories[number]).slug) ? "var(--toss-text-primary)" : "white",
                color: catFilter === (c.id === "all" ? "all" : (c as typeof categories[number]).slug) ? "white" : "var(--toss-text-secondary)",
                border: "1px solid var(--toss-border)",
              }}
            >
              {c.icon} {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid var(--toss-border)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--toss-border)", backgroundColor: "#FAFBFC" }}>
                {["상품", "카테고리", "판매가", "정가", "뱃지", "액션"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold" style={{ color: "var(--toss-text-tertiary)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr
                  key={p.id}
                  className="hover:bg-gray-50 transition-colors"
                  style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--toss-border)" : undefined }}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${p.bgColor}`}>
                        <span className="text-lg">{p.emoji}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate max-w-[180px]" style={{ color: "var(--toss-text-primary)" }}>
                          {p.name}
                        </p>
                        <p className="text-[10px] font-mono" style={{ color: "var(--toss-text-tertiary)" }}>{p.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--toss-text-secondary)" }}>
                    {p.category}
                  </td>
                  <td className="px-4 py-3 font-bold text-xs whitespace-nowrap" style={{ color: "var(--toss-text-primary)" }}>
                    {p.price.toLocaleString()}원
                  </td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "var(--toss-text-tertiary)" }}>
                    {p.originalPrice ? `${p.originalPrice.toLocaleString()}원` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {p.badge ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: p.badge === "BEST" ? "var(--toss-blue-light)" : "#FFF0F0",
                          color: p.badge === "BEST" ? "var(--toss-blue)" : "var(--toss-red)",
                        }}>
                        {p.badge}
                      </span>
                    ) : p.isNew ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F2F4F6", color: "#8B95A1" }}>
                        NEW
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                        style={{ color: "var(--toss-text-secondary)" }}>
                        <Pencil className="size-3.5" />
                      </button>
                      <button onClick={() => remove(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                        style={{ color: "var(--toss-red)" }}>
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-16 text-center" style={{ color: "var(--toss-text-tertiary)" }}>
            <p className="text-sm">상품이 없습니다</p>
          </div>
        )}
      </div>

      {/* Drawer */}
      {editing && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={close} />
          <div className="w-[420px] bg-white h-full overflow-auto flex flex-col shadow-2xl">
            <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--toss-border)" }}>
              <p className="text-base font-bold" style={{ color: "var(--toss-text-primary)" }}>
                {isNew ? "상품 추가" : "상품 수정"}
              </p>
              <button onClick={close} className="p-1.5 rounded-xl hover:bg-gray-100 transition-colors">
                <X className="size-4" style={{ color: "var(--toss-text-secondary)" }} />
              </button>
            </div>

            {/* Mini preview */}
            <div className={`mx-6 mt-5 rounded-2xl h-24 flex items-center justify-center ${editing.bgColor}`}>
              <span className="text-5xl">{editing.emoji}</span>
            </div>

            <div className="px-6 py-5 space-y-4 flex-1">
              <Field label="상품명 *">
                <input className={inputCls} style={inputStyle} value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="상품명을 입력하세요" />
              </Field>

              <Field label="카테고리">
                <select className={inputCls} style={inputStyle} value={editing.categorySlug}
                  onChange={(e) => {
                    const cat = categories.find((c) => c.slug === e.target.value)
                    setEditing({ ...editing, categorySlug: e.target.value, category: cat?.name ?? editing.category })
                  }}>
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>{c.icon} {c.name}</option>
                  ))}
                </select>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="판매가 *">
                  <input type="number" className={inputCls} style={inputStyle} value={editing.price || ""}
                    onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} placeholder="0" />
                </Field>
                <Field label="정가 (할인 전)">
                  <input type="number" className={inputCls} style={inputStyle} value={editing.originalPrice || ""}
                    onChange={(e) => setEditing({ ...editing, originalPrice: Number(e.target.value) || undefined })} placeholder="0" />
                </Field>
              </div>

              <Field label="이모지">
                <input className={inputCls} style={inputStyle} value={editing.emoji}
                  onChange={(e) => setEditing({ ...editing, emoji: e.target.value })} />
              </Field>

              <Field label="카드 배경색">
                <div className="flex flex-wrap gap-2">
                  {bgOptions.map((bg) => (
                    <button key={bg} onClick={() => setEditing({ ...editing, bgColor: bg })}
                      className={`w-8 h-8 rounded-xl ${bg} transition-all ${editing.bgColor === bg ? "ring-2 ring-offset-1 ring-blue-500" : ""}`} />
                  ))}
                </div>
              </Field>

              <Field label="뱃지">
                <div className="flex gap-2">
                  {(["none", "BEST", "SALE"] as const).map((b) => (
                    <button key={b}
                      onClick={() => setEditing({ ...editing, badge: b === "none" ? undefined : b, isNew: b === "none" ? true : false })}
                      className="flex-1 py-2 rounded-xl text-xs font-bold transition-colors"
                      style={{
                        backgroundColor: editing.badge === b || (b === "none" && !editing.badge) ? "var(--toss-text-primary)" : "var(--toss-page-bg)",
                        color: editing.badge === b || (b === "none" && !editing.badge) ? "white" : "var(--toss-text-secondary)",
                        border: "1px solid var(--toss-border)",
                      }}>
                      {b === "none" ? "없음" : b}
                    </button>
                  ))}
                </div>
              </Field>
            </div>

            <div className="px-6 py-4 flex gap-2" style={{ borderTop: "1px solid var(--toss-border)" }}>
              <button onClick={close} className="flex-1 py-3 rounded-2xl text-sm font-semibold"
                style={{ color: "var(--toss-text-secondary)", border: "1px solid var(--toss-border)" }}>
                취소
              </button>
              <button onClick={save} className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white hover:opacity-85 transition-opacity"
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
