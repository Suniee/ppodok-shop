"use client"

import { useState, useEffect, useCallback } from "react"
import { Star, Pencil, Trash2, X, ChevronLeft, ChevronRight } from "lucide-react"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser"
import { fetchReviews } from "@/lib/supabase/reviews"
import { createReviewAction, deleteReviewAction } from "../actions"
import { type Review } from "@/lib/data/reviews"

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

// 별점 렌더 (읽기 전용 또는 입력용)
function Stars({
    value,
    size = "sm",
    onChange,
}: {
    value: number
    size?: "sm" | "lg"
    onChange?: (v: number) => void
}) {
    const [hover, setHover] = useState(0)
    const active = hover || value
    const cls = size === "lg" ? "size-7" : "size-4"

    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
                <button
                    key={i}
                    type="button"
                    onClick={() => onChange?.(i)}
                    onMouseEnter={() => onChange && setHover(i)}
                    onMouseLeave={() => onChange && setHover(0)}
                    className={onChange ? "cursor-pointer" : "cursor-default"}
                    tabIndex={onChange ? 0 : -1}
                >
                    <Star
                        className={cls}
                        fill={i <= active ? "#FFB800" : "none"}
                        color={i <= active ? "#FFB800" : "var(--toss-border)"}
                    />
                </button>
            ))}
        </div>
    )
}

function formatDate(iso: string) {
    return iso.slice(0, 10).replace(/-/g, ".")
}

interface Props {
    productId: string
    initialCount: number
    onCountChange?: (count: number) => void
}

export default function ReviewSection({ productId, initialCount, onCountChange }: Props) {
    const [reviews, setReviews]     = useState<Review[]>([])
    const [total, setTotal]         = useState(initialCount)
    const [page, setPage]           = useState(1)
    const [pageSize, setPageSize]   = useState(10)
    const [loading, setLoading]     = useState(false)

    // 작성 폼
    const [showForm, setShowForm]   = useState(false)
    const [rating, setRating]       = useState(5)
    const [content, setContent]     = useState("")
    const [submitting, setSubmitting] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)

    // 현재 사용자 ID (삭제 버튼 표시용)
    const [myUserId, setMyUserId]   = useState<string | null>(null)

    useEffect(() => {
        createSupabaseBrowserClient().auth.getUser().then(({ data }) => setMyUserId(data.user?.id ?? null))
    }, [])

    const load = useCallback(async () => {
        setLoading(true)
        const { reviews: rows, total: count } = await fetchReviews(productId, page, pageSize)
        setReviews(rows)
        setTotal(count)
        onCountChange?.(count)
        setLoading(false)
    }, [productId, page, pageSize])

    useEffect(() => { load() }, [load])

    const avgRating = reviews.length
        ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
        : null

    const handleSubmit = async () => {
        if (content.trim().length < 5) { setFormError("리뷰를 5자 이상 작성해 주세요."); return }
        setSubmitting(true)
        setFormError(null)
        try {
            await createReviewAction(productId, rating, content.trim())
            setContent("")
            setRating(5)
            setShowForm(false)
            setPage(1)
            await load()
        } catch (err) {
            setFormError((err as Error).message)
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("리뷰를 삭제하시겠습니까?")) return
        try {
            await deleteReviewAction(id)
            await load()
        } catch (err) {
            alert((err as Error).message)
        }
    }

    const totalPages = Math.ceil(total / pageSize)

    return (
        <div data-ui-id="section-product-reviews" className="space-y-5">
            {/* 요약 헤더 */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {avgRating && (
                        <>
                            <span className="text-3xl font-black" style={{ color: "var(--toss-text-primary)" }}>
                                {avgRating}
                            </span>
                            <div>
                                <Stars value={Math.round(Number(avgRating))} />
                                <p className="text-xs mt-0.5" style={{ color: "var(--toss-text-tertiary)" }}>
                                    {total}개 리뷰
                                </p>
                            </div>
                        </>
                    )}
                    {!avgRating && (
                        <p className="text-sm" style={{ color: "var(--toss-text-tertiary)" }}>
                            아직 리뷰가 없습니다
                        </p>
                    )}
                </div>
                {!showForm && (
                    <button
                        data-ui-id="btn-review-write"
                        onClick={() => {
                            if (!myUserId) { alert("로그인이 필요합니다."); return }
                            setShowForm(true)
                        }}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-75"
                        style={{ backgroundColor: "var(--toss-page-bg)", color: "var(--toss-text-secondary)", border: "1px solid var(--toss-border)" }}
                    >
                        <Pencil className="size-3.5" />
                        리뷰 작성
                    </button>
                )}
            </div>

            {/* 작성 폼 */}
            {showForm && (
                <div
                    className="rounded-2xl p-5 space-y-4"
                    style={{ backgroundColor: "var(--toss-page-bg)", border: "1px solid var(--toss-border)" }}
                >
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-bold" style={{ color: "var(--toss-text-primary)" }}>리뷰 작성</p>
                        <button onClick={() => { setShowForm(false); setFormError(null) }}>
                            <X className="size-4" style={{ color: "var(--toss-text-tertiary)" }} />
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <Stars value={rating} size="lg" onChange={setRating} />
                        <span className="text-sm font-semibold" style={{ color: "var(--toss-text-secondary)" }}>
                            {["", "별로예요", "그저그래요", "보통이에요", "좋아요", "최고예요"][rating]}
                        </span>
                    </div>
                    <textarea
                        data-ui-id="textarea-review-content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="상품 사용 후 솔직한 리뷰를 남겨주세요. (5자 이상)"
                        className="w-full rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                        style={{
                            minHeight: "100px",
                            backgroundColor: "#fff",
                            color: "var(--toss-text-primary)",
                            border: "1px solid var(--toss-border)",
                            lineHeight: "1.6",
                        }}
                    />
                    {formError && (
                        <p className="text-xs px-3 py-2 rounded-xl" style={{ backgroundColor: "#FFF0F0", color: "var(--toss-red)" }}>
                            {formError}
                        </p>
                    )}
                    <div className="flex gap-2">
                        <button
                            onClick={() => { setShowForm(false); setFormError(null) }}
                            className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                            style={{ color: "var(--toss-text-secondary)", border: "1px solid var(--toss-border)" }}
                        >
                            취소
                        </button>
                        <button
                            data-ui-id="btn-review-submit"
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                            style={{ backgroundColor: "var(--toss-blue)" }}
                        >
                            {submitting ? "등록 중..." : "등록"}
                        </button>
                    </div>
                </div>
            )}

            {/* 리뷰 목록 */}
            {loading ? (
                <div className="py-12 text-center text-sm" style={{ color: "var(--toss-text-tertiary)" }}>불러오는 중...</div>
            ) : reviews.length === 0 ? (
                <div className="py-12 text-center" style={{ color: "var(--toss-text-tertiary)" }}>
                    <p className="text-sm">첫 리뷰를 남겨보세요!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {reviews.map((r) => (
                        <div
                            key={r.id}
                            data-ui-id={`card-review-${r.id}`}
                            className="rounded-2xl p-4"
                            style={{ backgroundColor: "var(--toss-page-bg)", border: "1px solid var(--toss-border)" }}
                        >
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <div>
                                    <Stars value={r.rating} />
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs font-semibold" style={{ color: "var(--toss-text-primary)" }}>
                                            {r.userName}
                                        </span>
                                        <span className="text-xs" style={{ color: "var(--toss-text-tertiary)" }}>
                                            {formatDate(r.createdAt)}
                                        </span>
                                    </div>
                                </div>
                                {myUserId === r.userId && (
                                    <button
                                        onClick={() => handleDelete(r.id)}
                                        className="p-1.5 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0"
                                        style={{ color: "var(--toss-red)" }}
                                    >
                                        <Trash2 className="size-3.5" />
                                    </button>
                                )}
                            </div>
                            <p className="text-sm leading-relaxed" style={{ color: "var(--toss-text-primary)" }}>
                                {r.content}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {/* 페이지네이션 */}
            {total > 0 && (
                <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: "var(--toss-text-tertiary)" }}>페이지당</span>
                        <select
                            data-ui-id="select-reviews-pagesize"
                            value={pageSize}
                            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}
                            className="rounded-lg px-2 py-1 text-xs outline-none"
                            style={{ border: "1px solid var(--toss-border)", color: "var(--toss-text-secondary)", backgroundColor: "var(--toss-page-bg)" }}
                        >
                            {PAGE_SIZE_OPTIONS.map((s) => (
                                <option key={s} value={s}>{s}개</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-1.5 rounded-lg disabled:opacity-30 hover:bg-gray-100 transition-colors"
                        >
                            <ChevronLeft className="size-4" style={{ color: "var(--toss-text-secondary)" }} />
                        </button>
                        <span className="text-xs px-2" style={{ color: "var(--toss-text-secondary)" }}>
                            {page} / {totalPages || 1}
                        </span>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            className="p-1.5 rounded-lg disabled:opacity-30 hover:bg-gray-100 transition-colors"
                        >
                            <ChevronRight className="size-4" style={{ color: "var(--toss-text-secondary)" }} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
