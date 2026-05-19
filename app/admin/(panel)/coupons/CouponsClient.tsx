"use client"

import { useState, useEffect, useCallback, useTransition } from "react"
import { Plus, Pencil, Trash2, X, Loader2, Search, RefreshCw, Tag } from "lucide-react"
import {
    fetchCouponsPagedAction, createCouponAction, updateCouponAction,
    deleteCouponAction, searchProductsForCouponAction, fetchProductsByIdsAction,
    fetchCategoriesForCouponAction,
} from "./actions"
import type { Coupon, CouponInput } from "@/lib/supabase/coupon-utils"
import type { ProductSearchResult, CategoryResult } from "./actions"
import AdminPagination from "@/components/admin/AdminPagination"
import { DsCombobox } from "@/components/ui/ds-combobox"

// ── 스타일 상수 ────────────────────────────────────────────────
const inputCls   = "rounded-xl px-3 py-2.5 text-sm outline-none transition-all w-full"
const inputStyle = {
    backgroundColor: "var(--toss-page-bg)",
    color:           "var(--toss-text-primary)",
    border:          "1px solid var(--toss-border)",
}

// 구분 콤보박스 선택지
const COUPON_TYPE_OPTIONS = [
    { value: "cart",    label: "장바구니", description: "전체 주문 할인" },
    { value: "product", label: "상품 쿠폰", description: "특정 상품 할인" },
]

// productTargetMode: 상품 쿠폰의 대상 지정 방식 ('product' | 'category' | 'all')
type ProductTargetMode = "all" | "product" | "category"
type CouponForm = CouponInput & { id?: string }

// ISO → datetime-local 입력값 형식 변환 ("YYYY-MM-DDTHH:mm")
function toDatetimeLocal(isoStr: string): string {
    const d   = new Date(isoStr)
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const emptyCoupon = (): CouponForm => ({
    code:               genCode(),
    name:               "",
    type:               "cart",
    discountType:       "fixed",
    discountValue:      1000,
    minOrderAmount:     0,
    maxDiscountAmount:  null,
    validFrom:          toDatetimeLocal(new Date().toISOString()),
    validUntil:         toDatetimeLocal(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()),
    usageLimit:         null,
    isActive:           true,
    productIds:         null,
    categoryIds:        null,
})

// 쿠폰 형태에서 대상 지정 모드를 역산
function resolveTargetMode(form: CouponForm): ProductTargetMode {
    if (form.productIds  && form.productIds.length  > 0) return "product"
    if (form.categoryIds && form.categoryIds.length > 0) return "category"
    return "all"
}

function genCode(): string {
    return Math.random().toString(36).slice(2, 10).toUpperCase()
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold" style={{ color: "var(--toss-text-secondary)" }}>{label}</span>
            {children}
        </div>
    )
}

// isActive 라디오 버튼 그룹
function ActiveRadioGroup({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
    const options = [
        { label: "활성", val: true  },
        { label: "비활성", val: false },
    ]
    return (
        <div className="flex gap-2">
            {options.map((opt) => {
                const selected = value === opt.val
                return (
                    <label key={String(opt.val)}
                        className="flex-1 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl cursor-pointer transition-all"
                        style={{
                            border:          selected ? "1.5px solid var(--toss-blue)" : "1.5px solid var(--toss-border)",
                            backgroundColor: selected ? "var(--toss-blue-light)" : "#fff",
                        }}>
                        <input type="radio" className="sr-only" checked={selected} onChange={() => onChange(opt.val)} />
                        {/* 라디오 원형 인디케이터 */}
                        <span className="flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all"
                            style={{ borderColor: selected ? "var(--toss-blue)" : "var(--toss-border)" }}>
                            {selected && (
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--toss-blue)" }} />
                            )}
                        </span>
                        <span className="text-sm font-semibold"
                            style={{ color: selected ? "var(--toss-blue)" : "var(--toss-text-primary)" }}>
                            {opt.label}
                        </span>
                    </label>
                )
            })}
        </div>
    )
}

// 목록용 토글 스위치 (isActive 직접 제어)
function ToggleSwitch({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled: boolean }) {
    return (
        <button
            type="button"
            onClick={onChange}
            disabled={disabled}
            className="relative inline-flex items-center w-9 h-5 rounded-full transition-colors disabled:opacity-50 flex-shrink-0"
            style={{ backgroundColor: checked ? "var(--toss-blue)" : "var(--toss-border)" }}>
            <span
                className="absolute w-3.5 h-3.5 bg-white rounded-full shadow-sm transition-transform"
                style={{ transform: checked ? "translateX(18px)" : "translateX(2px)" }}
            />
        </button>
    )
}

// ── 쿠폰 상태 배지 ─────────────────────────────────────────────
function CouponStatusBadge({ coupon }: { coupon: Coupon }) {
    const now = new Date()
    if (!coupon.isActive)                       return <Badge color="gray">비활성</Badge>
    if (new Date(coupon.validFrom) > now)       return <Badge color="purple">예약</Badge>
    if (new Date(coupon.validUntil) < now)      return <Badge color="red">만료</Badge>
    if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit)
                                                return <Badge color="red">소진</Badge>
    return <Badge color="green">활성</Badge>
}

function Badge({ color, children }: { color: "green" | "red" | "gray" | "purple" | "blue"; children: React.ReactNode }) {
    const styles: Record<string, { bg: string; color: string }> = {
        green:  { bg: "#E8F8F5", color: "#00A878" },
        red:    { bg: "#FFF0F0", color: "#FF4E4E" },
        gray:   { bg: "#F2F4F6", color: "#8B95A1" },
        purple: { bg: "#F3E8FF", color: "#9333EA" },
        blue:   { bg: "#EBF3FF", color: "#0064FF" },
    }
    const s = styles[color]
    return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
            style={{ backgroundColor: s.bg, color: s.color }}>
            {children}
        </span>
    )
}

function discountLabel(coupon: Coupon): string {
    if (coupon.discountType === "fixed") return `${coupon.discountValue.toLocaleString()}원 할인`
    let s = `${coupon.discountValue}% 할인`
    if (coupon.maxDiscountAmount) s += ` (최대 ${coupon.maxDiscountAmount.toLocaleString()}원)`
    return s
}

// ── 상품 선택기 ────────────────────────────────────────────────
function ProductPicker({
    selectedIds,
    onChange,
}: {
    selectedIds: string[]
    onChange:    (ids: string[]) => void
}) {
    const [query, setQuery]       = useState("")
    const [results, setResults]   = useState<ProductSearchResult[]>([])
    const [selected, setSelected] = useState<ProductSearchResult[]>([])
    const [searching, setSearching] = useState(false)

    // 기존 선택된 ID로 상품 정보 로드
    useEffect(() => {
        if (selectedIds.length === 0) { setSelected([]); return }
        fetchProductsByIdsAction(selectedIds).then(setSelected)
    // selectedIds 배열 내용 변화만 감지하기 위해 join 문자열로 비교
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedIds.join(",")])

    useEffect(() => {
        const t = setTimeout(async () => {
            setSearching(true)
            const res = await searchProductsForCouponAction(query)
            setResults(res)
            setSearching(false)
        }, 300)
        return () => clearTimeout(t)
    }, [query])

    const toggleProduct = (p: ProductSearchResult) => {
        const isSelected = selectedIds.includes(p.id)
        let next: string[]
        let nextSelected: ProductSearchResult[]
        if (isSelected) {
            next         = selectedIds.filter((id) => id !== p.id)
            nextSelected = selected.filter((s) => s.id !== p.id)
        } else {
            next         = [...selectedIds, p.id]
            nextSelected = [...selected, p]
        }
        setSelected(nextSelected)
        onChange(next)
    }

    return (
        <div className="flex flex-col gap-2">
            {/* 선택된 상품 태그 */}
            {selected.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-2.5 rounded-xl" style={{ backgroundColor: "var(--toss-page-bg)", border: "1px solid var(--toss-border)" }}>
                    {selected.map((p) => (
                        <span key={p.id}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                            style={{ backgroundColor: "var(--toss-blue-light)", color: "var(--toss-blue)" }}>
                            {p.emoji} {p.name}
                            <button
                                type="button"
                                onClick={() => toggleProduct(p)}
                                className="ml-0.5 opacity-70 hover:opacity-100 transition-opacity">
                                <X className="size-3" />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {/* 검색 입력 */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5" style={{ color: "var(--toss-text-tertiary)" }} />
                <input
                    className="w-full rounded-xl pl-8 pr-3 py-2 text-sm outline-none"
                    style={{ backgroundColor: "var(--toss-page-bg)", border: "1px solid var(--toss-border)", color: "var(--toss-text-primary)" }}
                    placeholder="상품명 검색 (비워두면 전체)"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </div>

            {/* 검색 결과 */}
            <div className="max-h-[180px] overflow-y-auto rounded-xl space-y-0.5" style={{ border: "1px solid var(--toss-border)" }}>
                {searching ? (
                    <div className="flex justify-center py-4">
                        <Loader2 className="size-4 animate-spin" style={{ color: "var(--toss-text-tertiary)" }} />
                    </div>
                ) : results.length === 0 ? (
                    <p className="text-xs text-center py-4" style={{ color: "var(--toss-text-tertiary)" }}>상품이 없습니다.</p>
                ) : results.map((p) => {
                    const isSelected = selectedIds.includes(p.id)
                    return (
                        <button key={p.id} type="button"
                            onClick={() => toggleProduct(p)}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50"
                            style={{
                                backgroundColor: isSelected ? "var(--toss-blue-light)" : undefined,
                                borderLeft:      isSelected ? "3px solid var(--toss-blue)" : "3px solid transparent",
                            }}>
                            <span className="text-base">{p.emoji}</span>
                            <span className="flex-1 truncate font-medium" style={{ color: "var(--toss-text-primary)" }}>{p.name}</span>
                            <span className="text-xs flex-shrink-0" style={{ color: "var(--toss-text-tertiary)" }}>
                                {p.price.toLocaleString()}원
                            </span>
                            {isSelected && (
                                <span className="text-[10px] font-bold flex-shrink-0" style={{ color: "var(--toss-blue)" }}>✓</span>
                            )}
                        </button>
                    )
                })}
            </div>

            {selected.length === 0 && (
                <p className="text-[11px]" style={{ color: "var(--toss-text-tertiary)" }}>
                    * 상품을 선택하지 않으면 모든 상품에 적용됩니다.
                </p>
            )}
        </div>
    )
}

// ── 카테고리 선택기 ────────────────────────────────────────────
function CategoryPicker({
    selectedIds,
    onChange,
}: {
    selectedIds: number[]
    onChange:    (ids: number[]) => void
}) {
    const [categories, setCategories] = useState<CategoryResult[]>([])
    const [loading, setLoading]       = useState(true)

    useEffect(() => {
        fetchCategoriesForCouponAction().then((res) => {
            setCategories(res)
            setLoading(false)
        })
    }, [])

    const toggle = (id: number) => {
        const isSelected = selectedIds.includes(id)
        onChange(isSelected ? selectedIds.filter((i) => i !== id) : [...selectedIds, id])
    }

    if (loading) return (
        <div className="flex justify-center py-4">
            <Loader2 className="size-4 animate-spin" style={{ color: "var(--toss-text-tertiary)" }} />
        </div>
    )

    return (
        <div className="flex flex-col gap-2">
            {/* 선택된 카테고리 태그 */}
            {selectedIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-2.5 rounded-xl" style={{ backgroundColor: "var(--toss-page-bg)", border: "1px solid var(--toss-border)" }}>
                    {categories.filter((c) => selectedIds.includes(c.id)).map((c) => (
                        <span key={c.id}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                            style={{ backgroundColor: "#F3E8FF", color: "#9333EA" }}>
                            {c.icon} {c.name}
                            <button type="button" onClick={() => toggle(c.id)}
                                className="ml-0.5 opacity-70 hover:opacity-100 transition-opacity">
                                <X className="size-3" />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {/* 카테고리 그리드 */}
            <div className="grid grid-cols-2 gap-1.5 max-h-[200px] overflow-y-auto rounded-xl p-1"
                style={{ border: "1px solid var(--toss-border)" }}>
                {categories.map((c) => {
                    const isSelected = selectedIds.includes(c.id)
                    return (
                        <button key={c.id} type="button"
                            onClick={() => toggle(c.id)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors"
                            style={{
                                backgroundColor: isSelected ? "#F3E8FF" : "transparent",
                                border:          isSelected ? "1.5px solid #9333EA" : "1.5px solid transparent",
                                color:           isSelected ? "#9333EA" : "var(--toss-text-primary)",
                            }}>
                            <span className="text-base flex-shrink-0">{c.icon}</span>
                            <span className="text-xs font-medium truncate">{c.name}</span>
                            {isSelected && <span className="ml-auto text-[10px] font-bold flex-shrink-0" style={{ color: "#9333EA" }}>✓</span>}
                        </button>
                    )
                })}
            </div>

            {selectedIds.length === 0 && (
                <p className="text-[11px]" style={{ color: "var(--toss-text-tertiary)" }}>
                    * 카테고리를 선택하지 않으면 모든 상품에 적용됩니다.
                </p>
            )}
        </div>
    )
}

// ── 대상 지정 섹션 (상품 쿠폰 전용) — 탭으로 모드 전환 ──────────
function ProductTargetSection({
    form,
    onChange,
}: {
    form:     CouponForm
    onChange: (f: CouponForm) => void
}) {
    // 모드는 로컬 상태로 관리 — 데이터에서 역산하면 빈 배열일 때 "all"로 돌아가는 버그 발생
    const [mode, setMode] = useState<ProductTargetMode>(() => resolveTargetMode(form))

    const switchMode = (next: ProductTargetMode) => {
        setMode(next)
        // 전환된 모드의 반대쪽 데이터는 null로 초기화
        onChange({
            ...form,
            productIds:  next === "product"  ? (form.productIds  ?? []) : null,
            categoryIds: next === "category" ? (form.categoryIds ?? []) : null,
        })
    }

    const tabs: { key: ProductTargetMode; label: string }[] = [
        { key: "all",      label: "전체 상품" },
        { key: "category", label: "카테고리 지정" },
        { key: "product",  label: "상품 지정" },
    ]

    return (
        <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold" style={{ color: "var(--toss-text-secondary)" }}>
                적용 대상
            </span>

            {/* 탭 */}
            <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: "var(--toss-page-bg)", border: "1px solid var(--toss-border)" }}>
                {tabs.map((tab) => (
                    <button key={tab.key} type="button"
                        onClick={() => switchMode(tab.key)}
                        className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        style={{
                            backgroundColor: mode === tab.key ? "#fff" : "transparent",
                            color:           mode === tab.key ? "var(--toss-text-primary)" : "var(--toss-text-tertiary)",
                            boxShadow:       mode === tab.key ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                        }}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* 선택된 탭에 따라 피커 표시 */}
            {mode === "product" && (
                <ProductPicker
                    selectedIds={form.productIds ?? []}
                    onChange={(ids) => onChange({ ...form, productIds: ids.length > 0 ? ids : null })}
                />
            )}
            {mode === "category" && (
                <CategoryPicker
                    selectedIds={form.categoryIds ?? []}
                    onChange={(ids) => onChange({ ...form, categoryIds: ids.length > 0 ? ids : null })}
                />
            )}
            {mode === "all" && (
                <p className="text-xs px-1" style={{ color: "var(--toss-text-tertiary)" }}>
                    모든 상품에 적용됩니다.
                </p>
            )}
        </div>
    )
}

// ── 편집 드로어 ────────────────────────────────────────────────
function CouponDrawer({
    form, isNew, isPending, saveError, onChange, onClose, onSave,
}: {
    form:      CouponForm
    isNew:     boolean
    isPending: boolean
    saveError: string | null
    onChange:  (f: CouponForm) => void
    onClose:   () => void
    onSave:    () => void
}) {
    const set = (k: keyof CouponForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const val = e.target.value
        onChange({ ...form, [k]: val })
    }

    return (
        <div className="fixed inset-0 z-50 flex">
            <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={onClose} />
            <div className="w-[440px] bg-white h-full overflow-auto flex flex-col shadow-2xl">
                <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--toss-border)" }}>
                    <p className="text-base font-bold" style={{ color: "var(--toss-text-primary)" }}>
                        {isNew ? "쿠폰 추가" : "쿠폰 수정"}
                    </p>
                    <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 transition-colors">
                        <X className="size-4" style={{ color: "var(--toss-text-secondary)" }} />
                    </button>
                </div>

                <div className="px-6 py-5 space-y-4 flex-1">
                    <Field label="쿠폰명">
                        <input className={inputCls} style={inputStyle} value={form.name}
                            onChange={set("name")} placeholder="봄맞이 할인 쿠폰" />
                    </Field>

                    <Field label="쿠폰 코드">
                        <div className="flex gap-2">
                            <input className={inputCls} style={inputStyle} value={form.code}
                                onChange={set("code")} placeholder="SPRING2026" />
                            <button
                                type="button"
                                onClick={() => onChange({ ...form, code: genCode() })}
                                className="px-3 rounded-xl text-xs font-semibold flex-shrink-0 transition-colors hover:opacity-80"
                                style={{ backgroundColor: "var(--toss-page-bg)", border: "1px solid var(--toss-border)", color: "var(--toss-text-secondary)" }}
                            >
                                <RefreshCw className="size-3.5" />
                            </button>
                        </div>
                    </Field>

                    <Field label="구분">
                        <DsCombobox
                            options={COUPON_TYPE_OPTIONS}
                            columns={2}
                            size="sm"
                            value={form.type}
                            onChange={(val) => {
                                const next = val as "product" | "cart"
                                onChange({
                                    ...form,
                                    type:        next,
                                    // cart로 전환 시 대상 초기화
                                    productIds:  next === "cart" ? null : form.productIds,
                                    categoryIds: next === "cart" ? null : form.categoryIds,
                                })
                            }}
                        />
                    </Field>

                    <Field label="할인 방식">
                        <select className={inputCls} style={inputStyle} value={form.discountType}
                            onChange={(e) => onChange({ ...form, discountType: e.target.value as "fixed" | "rate" })}>
                            <option value="fixed">정액 (원)</option>
                            <option value="rate">정률 (%)</option>
                        </select>
                    </Field>

                    {/* 상품 쿠폰일 때만 대상 지정 UI 표시 */}
                    {form.type === "product" && (
                        <ProductTargetSection form={form} onChange={onChange} />
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <Field label={form.discountType === "fixed" ? "할인 금액 (원)" : "할인율 (%)"}>
                            <input type="number" min={1} max={form.discountType === "rate" ? 100 : undefined}
                                className={inputCls} style={inputStyle} value={form.discountValue}
                                onChange={(e) => onChange({ ...form, discountValue: parseInt(e.target.value) || 0 })} />
                        </Field>
                        {form.discountType === "rate" && (
                            <Field label="최대 할인액 (원, 선택)">
                                <input type="number" min={0} className={inputCls} style={inputStyle}
                                    value={form.maxDiscountAmount ?? ""}
                                    onChange={(e) => onChange({ ...form, maxDiscountAmount: e.target.value ? parseInt(e.target.value) : null })}
                                    placeholder="제한 없음" />
                            </Field>
                        )}
                    </div>

                    <Field label="최소 주문금액 (원)">
                        <input type="number" min={0} className={inputCls} style={inputStyle}
                            value={form.minOrderAmount}
                            onChange={(e) => onChange({ ...form, minOrderAmount: parseInt(e.target.value) || 0 })} />
                    </Field>

                    <div className="grid grid-cols-2 gap-3">
                        <Field label="사용 시작일시">
                            <input type="datetime-local" className={inputCls} style={inputStyle}
                                value={form.validFrom}
                                onChange={set("validFrom")} />
                        </Field>
                        <Field label="사용 종료일시">
                            <input type="datetime-local" className={inputCls} style={inputStyle}
                                value={form.validUntil}
                                onChange={set("validUntil")} />
                        </Field>
                    </div>

                    <Field label="총 사용 가능 횟수 (비워두면 무제한)">
                        <input type="number" min={1} className={inputCls} style={inputStyle}
                            value={form.usageLimit ?? ""}
                            onChange={(e) => onChange({ ...form, usageLimit: e.target.value ? parseInt(e.target.value) : null })}
                            placeholder="무제한" />
                    </Field>

                    <Field label="활성화">
                        <ActiveRadioGroup
                            value={form.isActive}
                            onChange={(v) => onChange({ ...form, isActive: v })}
                        />
                    </Field>
                </div>

                {saveError && (
                    <div className="mx-6 mb-0 px-4 py-3 rounded-2xl text-xs font-semibold"
                        style={{ backgroundColor: "#FFF0F0", color: "var(--toss-red)", border: "1px solid #FFCDD2" }}>
                        {saveError}
                    </div>
                )}
                <div className="px-6 py-4 flex gap-2" style={{ borderTop: "1px solid var(--toss-border)" }}>
                    <button onClick={onClose}
                        className="flex-1 py-3 rounded-2xl text-sm font-semibold transition-colors hover:bg-gray-100"
                        style={{ color: "var(--toss-text-secondary)", border: "1px solid var(--toss-border)" }}>
                        취소
                    </button>
                    <button onClick={onSave} disabled={isPending}
                        className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2 transition-opacity hover:opacity-85"
                        style={{ backgroundColor: "var(--toss-blue)" }}>
                        {isPending ? <><Loader2 className="size-4 animate-spin" />저장 중...</> : (isNew ? "추가" : "저장")}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ── 메인 컴포넌트 ──────────────────────────────────────────────
export default function CouponsClient() {
    const [items, setItems]         = useState<Coupon[]>([])
    const [total, setTotal]         = useState(0)
    const [page, setPage]           = useState(1)
    const [pageSize, setPageSize]   = useState(20)
    const [query, setQuery]         = useState("")
    const [loading, setLoading]     = useState(false)

    const [editing, setEditing]     = useState<CouponForm | null>(null)
    const [isNew, setIsNew]         = useState(false)
    const [saveError, setSaveError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetchCouponsPagedAction(page, pageSize, query)
            setItems(res.items)
            setTotal(res.total)
        } finally {
            setLoading(false)
        }
    }, [page, pageSize, query])

    useEffect(() => { load() }, [load])

    const openNew  = () => { setEditing(emptyCoupon()); setIsNew(true) }
    const openEdit = (c: Coupon) => {
        setEditing({
            id:                 c.id,
            code:               c.code,
            name:               c.name,
            type:               c.type,
            discountType:       c.discountType,
            discountValue:      c.discountValue,
            minOrderAmount:     c.minOrderAmount,
            maxDiscountAmount:  c.maxDiscountAmount,
            validFrom:  toDatetimeLocal(c.validFrom),
            validUntil: toDatetimeLocal(c.validUntil),
            usageLimit:         c.usageLimit,
            isActive:           c.isActive,
            productIds:         c.productIds  ?? null,
            categoryIds:        c.categoryIds ?? null,
        })
        setIsNew(false)
    }

    const handleSave = () => {
        if (!editing) return
        setSaveError(null)
        startTransition(async () => {
            // datetime-local → ISO 변환
            const payload = {
                ...editing,
                validFrom:  new Date(editing.validFrom).toISOString(),
                validUntil: new Date(editing.validUntil).toISOString(),
            }
            let result: { ok: boolean; message?: string }
            if (isNew) {
                const { id: _, ...input } = payload
                result = await createCouponAction(input)
            } else {
                const { id, ...input } = payload
                result = await updateCouponAction(id!, input)
            }
            if (!result.ok) {
                // 쿠폰 코드 중복 등 DB 오류를 사용자에게 표시
                setSaveError(result.message ?? "저장에 실패했습니다.")
                return
            }
            setEditing(null)
            load()
        })
    }

    const handleDelete = (id: string) => {
        if (!confirm("쿠폰을 삭제하면 발급된 쿠폰도 함께 삭제됩니다. 계속할까요?")) return
        startTransition(async () => {
            await deleteCouponAction(id)
            load()
        })
    }

    const handleToggleActive = (id: string, currentActive: boolean) => {
        startTransition(async () => {
            await updateCouponAction(id, { isActive: !currentActive })
            load()
        })
    }

    return (
        <div className="p-7 space-y-6">
            {/* 헤더 */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-black" style={{ color: "var(--toss-text-primary)", letterSpacing: "-0.03em" }}>쿠폰 관리</h1>
                    <p className="text-sm mt-0.5" style={{ color: "var(--toss-text-secondary)" }}>총 {total}개 쿠폰</p>
                </div>
                <button onClick={openNew}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold text-white hover:opacity-85 transition-opacity"
                    style={{ backgroundColor: "var(--toss-blue)" }}>
                    <Plus className="size-4" />쿠폰 추가
                </button>
            </div>

            {/* 검색 */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4" style={{ color: "var(--toss-text-tertiary)" }} />
                <input
                    className="w-full rounded-2xl pl-9 pr-4 py-2.5 text-sm outline-none"
                    style={{ ...inputStyle, backgroundColor: "#fff" }}
                    placeholder="쿠폰명, 코드 검색"
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setPage(1) }}
                />
            </div>

            {/* 테이블 */}
            <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid var(--toss-border)" }}>
                {loading ? (
                    <div className="flex justify-center py-16">
                        <Loader2 className="size-5 animate-spin" style={{ color: "var(--toss-text-tertiary)" }} />
                    </div>
                ) : items.length === 0 ? (
                    <div className="flex flex-col items-center py-16 gap-2">
                        <Tag className="size-8 opacity-20" style={{ color: "var(--toss-text-tertiary)" }} />
                        <p className="text-sm" style={{ color: "var(--toss-text-tertiary)" }}>등록된 쿠폰이 없습니다.</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead style={{ borderBottom: "1px solid var(--toss-border)" }}>
                            <tr>
                                {["쿠폰명/코드", "구분", "할인", "사용 기간", "사용 현황", "상태", ""].map((h) => (
                                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold whitespace-nowrap"
                                        style={{ color: "var(--toss-text-tertiary)" }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((c, i) => (
                                <tr key={c.id} className="hover:bg-gray-50 transition-colors"
                                    style={{ borderBottom: i < items.length - 1 ? "1px solid var(--toss-border)" : undefined }}>
                                    <td className="px-5 py-3">
                                        <p className="text-sm font-semibold" style={{ color: "var(--toss-text-primary)" }}>{c.name}</p>
                                        <p className="text-xs font-mono mt-0.5" style={{ color: "var(--toss-text-tertiary)" }}>{c.code}</p>
                                    </td>
                                    <td className="px-5 py-3">
                                        <Badge color={c.type === "cart" ? "blue" : "purple"}>
                                            {c.type === "cart" ? "장바구니" : "상품"}
                                        </Badge>
                                        {c.type === "product" && (
                                            <p className="text-[10px] mt-0.5" style={{ color: "var(--toss-text-tertiary)" }}>
                                                {c.productIds  && c.productIds.length  > 0 ? `${c.productIds.length}개 상품`
                                                : c.categoryIds && c.categoryIds.length > 0 ? `${c.categoryIds.length}개 카테고리`
                                                : "전체 상품"}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-5 py-3 text-xs font-semibold whitespace-nowrap" style={{ color: "var(--toss-text-primary)" }}>
                                        {discountLabel(c)}
                                        {c.minOrderAmount > 0 && (
                                            <p className="text-[10px] font-normal mt-0.5" style={{ color: "var(--toss-text-tertiary)" }}>
                                                {c.minOrderAmount.toLocaleString()}원 이상
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-5 py-3 text-xs whitespace-nowrap" style={{ color: "var(--toss-text-secondary)" }}>
                                        <p>{new Date(c.validFrom).toLocaleDateString("ko-KR")}</p>
                                        <p>~ {new Date(c.validUntil).toLocaleDateString("ko-KR")}</p>
                                    </td>
                                    <td className="px-5 py-3 text-xs" style={{ color: "var(--toss-text-secondary)" }}>
                                        {c.usageLimit !== null
                                            ? `${c.usageCount} / ${c.usageLimit}회`
                                            : `${c.usageCount}회 (무제한)`}
                                    </td>
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-1.5">
                                            <ToggleSwitch
                                                checked={c.isActive}
                                                onChange={() => handleToggleActive(c.id, c.isActive)}
                                                disabled={isPending}
                                            />
                                            <span className="text-[10px]"
                                                style={{ color: c.isActive ? "var(--toss-blue)" : "var(--toss-text-tertiary)" }}>
                                                {c.isActive ? "활성" : "비활성"}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-1 justify-end">
                                            <button onClick={() => openEdit(c)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                                                style={{ color: "var(--toss-text-secondary)" }}>
                                                <Pencil className="size-4" />
                                            </button>
                                            <button onClick={() => handleDelete(c.id)} className="p-2 rounded-xl hover:bg-red-50 transition-colors"
                                                style={{ color: "var(--toss-red)" }}>
                                                <Trash2 className="size-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* 페이지네이션 */}
            <AdminPagination
                page={page} pageSize={pageSize} total={total}
                pageSizeId="select-coupons-pagesize"
                onPageChange={(p) => setPage(p)}
                onSizeChange={(s) => { setPageSize(s); setPage(1) }}
            />

            {/* 편집 드로어 */}
            {editing && (
                <CouponDrawer
                    form={editing}
                    isNew={isNew}
                    isPending={isPending}
                    saveError={saveError}
                    onChange={(f) => { setSaveError(null); setEditing(f) }}
                    onClose={() => { setEditing(null); setSaveError(null) }}
                    onSave={handleSave}
                />
            )}

        </div>
    )
}
