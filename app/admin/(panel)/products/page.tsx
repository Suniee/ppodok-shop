"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Pencil, Trash2, Search, X, ImagePlus } from "lucide-react"
import { type Product } from "@/lib/data/products"
import { type Category } from "@/lib/data/categories"
import { fetchCategories } from "@/lib/supabase/categories"
import { KoreanInput } from "@/components/ui/KoreanInput"
import {
    uploadProductImageAction,
    deleteProductImageAction,
    upsertProductAction,
    deleteProductAction,
    updateVisibilityAction,
    fetchProductsPagedAction,
} from "./actions"
import ImageCropModal from "@/components/ui/ImageCropModal"
import AdminPagination from "@/components/admin/AdminPagination"

const bgOptions = ["bg-pink-50", "bg-blue-50", "bg-green-50", "bg-yellow-50", "bg-purple-50", "bg-orange-50", "bg-cyan-50", "bg-teal-50"]

const inputCls = "rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-300 transition-all w-full"
const inputStyle = { backgroundColor: "var(--toss-page-bg)", color: "var(--toss-text-primary)", border: "1px solid var(--toss-border)" }

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold" style={{ color: "var(--toss-text-secondary)" }}>{label}</span>
            {children}
        </div>
    )
}

const emptyProduct = (): Product => ({
    id: `P${Date.now()}`,
    name: "", price: 0, emoji: "📦", bgColor: "bg-gray-50",
    isNew: true, isVisible: true, images: [], detailImages: [], categories: [],
})

export default function ProductsPage() {
    const [items, setItems]           = useState<Product[]>([])
    const [total, setTotal]           = useState(0)
    const [page, setPage]             = useState(1)
    const [pageSize, setPageSize]     = useState(20)
    const [categories, setCategories] = useState<Category[]>([])
    const [query, setQuery]           = useState("")
    const [catFilter, setCat]         = useState("all")
    const [editing, setEditing]       = useState<Product | null>(null)
    const [isNew, setIsNew]           = useState(false)
    const [loading, setLoading]       = useState(true)
    const [saving, setSaving]         = useState(false)
    const [saveError, setSaveError]   = useState<string | null>(null)
    const [uploadingImg, setUploadingImg]             = useState(false)
    const [uploadingDetailImg, setUploadingDetailImg] = useState(false)
    const [cropFile, setCropFile]                     = useState<File | null>(null)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetchProductsPagedAction(page, pageSize, catFilter, query)
            setItems(res.items)
            setTotal(res.total)
        } finally {
            setLoading(false)
        }
    }, [page, pageSize, catFilter, query])

    useEffect(() => { load() }, [load])

    useEffect(() => {
        fetchCategories().then(setCategories)
    }, [])

    const openNew  = () => { setEditing(emptyProduct()); setIsNew(true); setSaveError(null) }
    const openEdit = (p: Product) => { setEditing({ ...p, images: [...(p.images ?? [])], detailImages: [...(p.detailImages ?? [])], categories: [...p.categories] }); setIsNew(false); setSaveError(null) }
    const close    = () => { setEditing(null); setIsNew(false); setSaveError(null) }

    const save = async () => {
        if (!editing) return
        if (!editing.name.trim()) { setSaveError("상품명을 입력해 주세요."); return }
        if (editing.price <= 0)   { setSaveError("판매가를 입력해 주세요."); return }

        setSaving(true)
        setSaveError(null)
        try {
            await upsertProductAction(editing)
            close()
            load()
        } catch (err) {
            setSaveError((err as Error).message ?? "저장 중 오류가 발생했습니다.")
        } finally {
            setSaving(false)
        }
    }

    const remove = async (id: string) => {
        try {
            await deleteProductAction(id)
            load()
        } catch (err) {
            alert((err as Error).message ?? "삭제 중 오류가 발생했습니다.")
        }
    }

    const toggleVisibility = async (p: Product) => {
        const next = !(p.isVisible ?? true)
        try {
            await updateVisibilityAction(p.id, next)
            load()
        } catch (err) {
            alert((err as Error).message ?? "노출 설정 변경 중 오류가 발생했습니다.")
        }
    }

    const toggleCategory = (cat: Category) => {
        if (!editing) return
        const exists = editing.categories.some((c) => c.id === cat.id)
        const next = exists
            ? editing.categories.filter((c) => c.id !== cat.id)
            : [...editing.categories, { id: cat.id, name: cat.name, slug: cat.slug, icon: cat.icon }]
        setEditing({ ...editing, categories: next })
    }

    // 파일 선택 시 크롭 모달을 띄운다 (업로드는 크롭 적용 후에 실행)
    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !editing) return
        setCropFile(file)
        e.target.value = ""
    }

    // 크롭 완료 → Blob을 File로 변환해 Storage에 업로드
    // 누끼 제거 시 PNG(투명도 보존), 일반 크롭 시 JPEG
    const handleCropApply = async (blob: Blob) => {
        if (!editing) return
        setCropFile(null)
        setUploadingImg(true)
        try {
            const ext = blob.type === "image/png" ? "png" : "jpg"
            const file = new File([blob], `product-${Date.now()}.${ext}`, { type: blob.type })
            const formData = new FormData()
            formData.append("file", file)
            const url = await uploadProductImageAction(formData)
            setEditing((prev) => prev ? { ...prev, images: [...(prev.images ?? []), url] } : prev)
        } catch (err) {
            alert((err as Error).message ?? "이미지 업로드에 실패했습니다.")
        } finally {
            setUploadingImg(false)
        }
    }

    // 상세 이미지: 크롭 없이 바로 업로드
    const handleDetailImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !editing) return
        e.target.value = ""
        setUploadingDetailImg(true)
        try {
            const formData = new FormData()
            formData.append("file", file)
            const url = await uploadProductImageAction(formData)
            setEditing((prev) => prev ? { ...prev, detailImages: [...(prev.detailImages ?? []), url] } : prev)
        } catch (err) {
            alert((err as Error).message ?? "이미지 업로드에 실패했습니다.")
        } finally {
            setUploadingDetailImg(false)
        }
    }

    const removeDetailImage = async (url: string) => {
        if (!editing) return
        try {
            await deleteProductImageAction(url)
            setEditing({ ...editing, detailImages: (editing.detailImages ?? []).filter((u) => u !== url) })
        } catch (err) {
            alert((err as Error).message ?? "이미지 삭제에 실패했습니다.")
        }
    }

    // Storage에서 즉시 삭제 → editing.images에서 제거
    const removeImage = async (url: string) => {
        if (!editing) return
        try {
            await deleteProductImageAction(url)
            setEditing({ ...editing, images: (editing.images ?? []).filter((u) => u !== url) })
        } catch (err) {
            alert((err as Error).message ?? "이미지 삭제에 실패했습니다.")
        }
    }

    return (
        <div data-ui-id="page-admin-products" className="p-7 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-black" style={{ color: "var(--toss-text-primary)", letterSpacing: "-0.03em" }}>상품 관리</h1>
                    <p className="text-sm mt-0.5" style={{ color: "var(--toss-text-secondary)" }}>전체 {items.length}개 상품</p>
                </div>
                <button
                    data-ui-id="btn-admin-product-add"
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
                <div data-ui-id="input-admin-product-search" className="flex items-center gap-2 bg-white rounded-2xl px-4 py-2.5 flex-1 min-w-52" style={{ border: "1px solid var(--toss-border)" }}>
                    <Search className="size-4" style={{ color: "var(--toss-text-tertiary)" }} />
                    <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1) }}
                        placeholder="상품명 검색" className="bg-transparent flex-1 text-sm outline-none"
                        style={{ color: "var(--toss-text-primary)" }} />
                </div>
                <div className="flex flex-wrap gap-1.5">
                    {[{ id: 0, name: "전체", slug: "all", icon: "🛍️" }, ...categories].map((c) => {
                        const slug = c.id === 0 ? "all" : c.slug
                        return (
                            <button
                                key={c.id}
                                onClick={() => { setCat(slug); setPage(1) }}
                                className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
                                style={{
                                    backgroundColor: catFilter === slug ? "var(--toss-text-primary)" : "white",
                                    color: catFilter === slug ? "white" : "var(--toss-text-secondary)",
                                    border: "1px solid var(--toss-border)",
                                }}
                            >
                                {c.icon} {c.name}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Table */}
            <div data-ui-id="table-admin-product-list" className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid var(--toss-border)" }}>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr style={{ borderBottom: "1px solid var(--toss-border)", backgroundColor: "#FAFBFC" }}>
                                {["상품", "카테고리", "판매가", "정가", "뱃지", "노출", "액션"].map((h) => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-bold" style={{ color: "var(--toss-text-tertiary)" }}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} className="py-16 text-center text-sm" style={{ color: "var(--toss-text-tertiary)" }}>불러오는 중...</td></tr>
                            ) : items.map((p, i) => (
                                <tr
                                    key={p.id}
                                    className="hover:bg-gray-50 transition-colors"
                                    style={{ borderBottom: i < items.length - 1 ? "1px solid var(--toss-border)" : undefined }}
                                >
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            {/* 이미지가 있으면 첫 번째 이미지, 없으면 이모지 */}
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden ${p.images?.length ? "" : p.bgColor}`}>
                                                {p.images?.length ? (
                                                    <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-lg">{p.emoji}</span>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold truncate max-w-[180px]" style={{ color: "var(--toss-text-primary)" }}>
                                                    {p.name}
                                                </p>
                                                <p className="text-[10px] font-mono" style={{ color: "var(--toss-text-tertiary)" }}>{p.id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1">
                                            {p.categories.length === 0 ? (
                                                <span style={{ color: "var(--toss-text-tertiary)" }} className="text-xs">—</span>
                                            ) : p.categories.map((c) => (
                                                <span key={c.id} className="text-[10px] font-medium px-1.5 py-0.5 rounded-lg"
                                                    style={{ backgroundColor: "var(--toss-page-bg)", color: "var(--toss-text-secondary)" }}>
                                                    {c.icon} {c.name}
                                                </span>
                                            ))}
                                        </div>
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
                                        <button
                                            onClick={() => toggleVisibility(p)}
                                            className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
                                            style={{ backgroundColor: (p.isVisible ?? true) ? "var(--toss-blue)" : "#D1D6DB" }}
                                        >
                                            <span
                                                className="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform"
                                                style={{ transform: (p.isVisible ?? true) ? "translateX(18px)" : "translateX(2px)" }}
                                            />
                                        </button>
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
                {!loading && items.length === 0 && (
                    <div className="py-16 text-center" style={{ color: "var(--toss-text-tertiary)" }}>
                        <p className="text-sm">상품이 없습니다</p>
                    </div>
                )}
                {total > 0 && (
                    <div className="px-5 py-3 space-y-3" style={{ borderTop: "1px solid var(--toss-border)" }}>
                        <p className="text-xs" style={{ color: "var(--toss-text-tertiary)" }}>
                            총 {total}건 중 {items.length}건 표시
                        </p>
                        <AdminPagination
                            page={page}
                            pageSize={pageSize}
                            total={total}
                            pageSizeId="select-products-pagesize"
                            onPageChange={setPage}
                            onSizeChange={(s) => { setPageSize(s); setPage(1) }}
                        />
                    </div>
                )}
            </div>

            {/* 이미지 크롭 모달 (드로어보다 높은 z-index로 최상위 렌더) */}
            {cropFile && (
                <ImageCropModal
                    file={cropFile}
                    onApply={handleCropApply}
                    onCancel={() => setCropFile(null)}
                />
            )}

            {/* Drawer */}
            {editing && (
                <div data-ui-id="drawer-admin-product-form" className="fixed top-0 bottom-0 right-0 left-56 z-50 flex">
                    <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={close} />
                    <div className="w-[440px] bg-white h-full overflow-auto flex flex-col shadow-2xl">
                        {/* Drawer Header */}
                        <div className="px-6 py-5 flex items-center justify-between flex-shrink-0" style={{ borderBottom: "1px solid var(--toss-border)" }}>
                            <p className="text-base font-bold" style={{ color: "var(--toss-text-primary)" }}>
                                {isNew ? "상품 추가" : "상품 수정"}
                            </p>
                            <button onClick={close} className="p-1.5 rounded-xl hover:bg-gray-100 transition-colors">
                                <X className="size-4" style={{ color: "var(--toss-text-secondary)" }} />
                            </button>
                        </div>

                        {/* 이모지 미리보기 (이미지 없을 때) */}
                        {!(editing.images?.length) && (
                            <div className={`mx-6 mt-5 rounded-2xl h-24 flex items-center justify-center flex-shrink-0 ${editing.bgColor}`}>
                                <span className="text-5xl">{editing.emoji}</span>
                            </div>
                        )}

                        {/* 폼 본문 */}
                        <div className="px-6 py-5 space-y-4 flex-1">
                            {/* ── 이미지 업로드 섹션 ── */}
                            <Field label="상품 이미지">
                                <div className="space-y-2">
                                    {/* 업로드된 이미지 그리드 */}
                                    {(editing.images ?? []).length > 0 && (
                                        <div className="grid grid-cols-3 gap-2">
                                            {editing.images!.map((url, idx) => (
                                                <div
                                                    key={url}
                                                    className="relative aspect-square rounded-xl overflow-hidden group"
                                                    style={{ border: "1px solid var(--toss-border)" }}
                                                >
                                                    <img src={url} alt={`상품 이미지 ${idx + 1}`} className="w-full h-full object-cover" />
                                                    {/* 대표 이미지 표시 */}
                                                    {idx === 0 && (
                                                        <span className="absolute bottom-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                                                            style={{ backgroundColor: "rgba(0,0,0,0.6)", color: "#fff" }}>
                                                            대표
                                                        </span>
                                                    )}
                                                    {/* 삭제 버튼 */}
                                                    <button
                                                        onClick={() => removeImage(url)}
                                                        className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                        style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
                                                    >
                                                        <X className="size-3 text-white" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* 이미지 추가 버튼 */}
                                    <label
                                        data-ui-id="input-admin-product-image"
                                        className="flex items-center justify-center gap-2 py-3 rounded-xl cursor-pointer text-sm font-semibold transition-colors hover:bg-blue-50"
                                        style={{
                                            border: "2px dashed var(--toss-border)",
                                            color: uploadingImg ? "var(--toss-text-tertiary)" : "var(--toss-text-secondary)",
                                            cursor: uploadingImg ? "not-allowed" : "pointer",
                                        }}
                                    >
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp,image/gif"
                                            className="hidden"
                                            onChange={handleImageSelect}
                                            disabled={uploadingImg}
                                        />
                                        <ImagePlus className="size-4" />
                                        {uploadingImg ? "업로드 중..." : "이미지 추가"}
                                    </label>
                                    <p className="text-[11px]" style={{ color: "var(--toss-text-tertiary)" }}>
                                        JPG, PNG, WEBP (최대 5MB) · 첫 번째 이미지가 대표 이미지로 사용됩니다
                                    </p>
                                </div>
                            </Field>

                            <Field label="상품명 *">
                                <KoreanInput className={inputCls} style={inputStyle} value={editing.name}
                                    onValueChange={(v) => setEditing({ ...editing, name: v })} placeholder="상품명을 입력하세요" />
                            </Field>

                            <div>
                                <p className="text-xs font-semibold mb-2" style={{ color: "var(--toss-text-secondary)" }}>
                                    카테고리 <span className="font-normal" style={{ color: "var(--toss-text-tertiary)" }}>(복수 선택 가능)</span>
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {categories.map((cat) => {
                                        const selected = editing.categories.some((c) => c.id === cat.id)
                                        return (
                                            <button
                                                key={cat.id}
                                                onClick={() => toggleCategory(cat)}
                                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors"
                                                style={{
                                                    backgroundColor: selected ? "var(--toss-text-primary)" : "var(--toss-page-bg)",
                                                    color: selected ? "white" : "var(--toss-text-secondary)",
                                                    border: "1px solid var(--toss-border)",
                                                }}
                                            >
                                                {cat.icon} {cat.name}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

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
                                    {(["none", "NEW", "BEST", "SALE"] as const).map((b) => {
                                        const isActive = b === "none" ? !editing.badge : editing.badge === b
                                        return (
                                            <button key={b}
                                                onClick={() => setEditing({
                                                    ...editing,
                                                    badge: b === "none" ? undefined : b,
                                                    // NEW 뱃지일 때만 isNew=true → 프론트 신상품 섹션에 노출
                                                    isNew: b === "NEW",
                                                })}
                                                className="flex-1 py-2 rounded-xl text-xs font-bold transition-colors"
                                                style={{
                                                    backgroundColor: isActive ? "var(--toss-text-primary)" : "var(--toss-page-bg)",
                                                    color: isActive ? "white" : "var(--toss-text-secondary)",
                                                    border: "1px solid var(--toss-border)",
                                                }}>
                                                {b === "none" ? "없음" : b}
                                            </button>
                                        )
                                    })}
                                </div>
                            </Field>

                            <Field label="상품 설명">
                                <textarea
                                    data-ui-id="textarea-admin-product-description"
                                    className={`${inputCls} resize-none`}
                                    style={{ ...inputStyle, minHeight: "120px", lineHeight: "1.6" }}
                                    value={editing.description ?? ""}
                                    onChange={(e) => setEditing({ ...editing, description: e.target.value || undefined })}
                                    placeholder={"상품의 특징, 사용법, 주의사항 등을 자유롭게 작성하세요.\n줄 바꿈도 그대로 표시됩니다."}
                                />
                            </Field>

                            <Field label="상품 상세 이미지">
                                <div className="space-y-2">
                                    {/* 업로드된 상세 이미지 목록 */}
                                    {(editing.detailImages ?? []).length > 0 && (
                                        <div className="space-y-2">
                                            {editing.detailImages!.map((url, idx) => (
                                                <div
                                                    key={url}
                                                    className="relative rounded-xl overflow-hidden group"
                                                    style={{ border: "1px solid var(--toss-border)" }}
                                                >
                                                    <img
                                                        src={url}
                                                        alt={`상세 이미지 ${idx + 1}`}
                                                        className="w-full object-contain"
                                                    />
                                                    <button
                                                        onClick={() => removeDetailImage(url)}
                                                        className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                        style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
                                                    >
                                                        <X className="size-3.5 text-white" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* 업로드 버튼 */}
                                    <label
                                        data-ui-id="input-admin-product-detail-image"
                                        className="flex items-center justify-center gap-2 py-3 rounded-xl cursor-pointer text-sm font-semibold transition-colors hover:bg-blue-50"
                                        style={{
                                            border: "2px dashed var(--toss-border)",
                                            color: uploadingDetailImg ? "var(--toss-text-tertiary)" : "var(--toss-text-secondary)",
                                            cursor: uploadingDetailImg ? "not-allowed" : "pointer",
                                        }}
                                    >
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp,image/gif"
                                            className="hidden"
                                            onChange={handleDetailImageUpload}
                                            disabled={uploadingDetailImg}
                                        />
                                        <ImagePlus className="size-4" />
                                        {uploadingDetailImg ? "업로드 중..." : "상세 이미지 추가"}
                                    </label>
                                    <p className="text-[11px]" style={{ color: "var(--toss-text-tertiary)" }}>
                                        JPG, PNG, WEBP (최대 5MB) · 상세 페이지에 순서대로 표시됩니다
                                    </p>
                                </div>
                            </Field>

                            <div className="flex items-center justify-between py-1">
                                <div>
                                    <p className="text-xs font-semibold" style={{ color: "var(--toss-text-secondary)" }}>노출 설정</p>
                                    <p className="text-[11px] mt-0.5" style={{ color: "var(--toss-text-tertiary)" }}>
                                        {(editing.isVisible ?? true) ? "쇼핑몰에 노출 중" : "쇼핑몰에서 숨김"}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setEditing({ ...editing, isVisible: !(editing.isVisible ?? true) })}
                                    className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                                    style={{ backgroundColor: (editing.isVisible ?? true) ? "var(--toss-blue)" : "#D1D6DB" }}
                                >
                                    <span
                                        className="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
                                        style={{ transform: (editing.isVisible ?? true) ? "translateX(23px)" : "translateX(2px)" }}
                                    />
                                </button>
                            </div>
                        </div>

                        {/* 저장/취소 버튼 */}
                        <div className="px-6 py-4 flex-shrink-0" style={{ borderTop: "1px solid var(--toss-border)" }}>
                            {saveError && (
                                <p className="text-xs font-medium mb-3 px-3 py-2 rounded-xl" style={{ backgroundColor: "#FFF0F0", color: "var(--toss-red)" }}>
                                    {saveError}
                                </p>
                            )}
                            <div className="flex gap-2">
                                <button data-ui-id="btn-admin-product-cancel" onClick={close} className="flex-1 py-3 rounded-2xl text-sm font-semibold"
                                    style={{ color: "var(--toss-text-secondary)", border: "1px solid var(--toss-border)" }}>
                                    취소
                                </button>
                                <button
                                    data-ui-id="btn-admin-product-save"
                                    onClick={save}
                                    disabled={saving}
                                    className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white hover:opacity-85 transition-opacity disabled:opacity-50"
                                    style={{ backgroundColor: "var(--toss-blue)" }}
                                >
                                    {saving ? "저장 중..." : isNew ? "추가" : "저장"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
