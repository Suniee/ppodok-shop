"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, X, Star, ChevronLeft, ChevronRight, Trash2, ChevronDown, ChevronUp } from "lucide-react"
import { fetchAdminReviewsAction, deleteAdminReviewAction, type AdminReview } from "./actions"

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

function formatDate(iso: string) {
    return iso.slice(0, 10).replace(/-/g, ".")
}

function StarBadge({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-1">
            <Star className="size-3.5" fill="#FFB800" color="#FFB800" />
            <span className="text-xs font-bold" style={{ color: "var(--toss-text-primary)" }}>{rating}</span>
        </div>
    )
}

export default function AdminReviewsPage() {
    const [items, setItems]           = useState<AdminReview[]>([])
    const [total, setTotal]           = useState(0)
    const [page, setPage]             = useState(1)
    const [pageSize, setPageSize]     = useState(20)
    const [ratingFilter, setRating]   = useState<number | null>(null)
    const [query, setQuery]           = useState("")
    const [loading, setLoading]       = useState(true)
    const [expandedId, setExpandedId] = useState<string | null>(null)

    const load = useCallback(async () => {
        setLoading(true)
        const { items: rows, total: count } = await fetchAdminReviewsAction(page, pageSize, ratingFilter, query)
        setItems(rows)
        setTotal(count)
        setLoading(false)
    }, [page, pageSize, ratingFilter, query])

    useEffect(() => { load() }, [load])

    const handleDelete = async (id: string) => {
        if (!confirm("리뷰를 삭제하시겠습니까?")) return
        try {
            await deleteAdminReviewAction(id)
            await load()
        } catch (err) {
            alert((err as Error).message)
        }
    }

    const totalPages = Math.ceil(total / pageSize)

    const RATING_OPTIONS = [null, 5, 4, 3, 2, 1] as const

    return (
        <div data-ui-id="page-admin-reviews" className="p-7 space-y-5">
            {/* 헤더 */}
            <div>
                <h1 className="text-xl font-black" style={{ color: "var(--toss-text-primary)", letterSpacing: "-0.03em" }}>
                    리뷰 관리
                </h1>
                <p className="text-sm mt-0.5" style={{ color: "var(--toss-text-secondary)" }}>
                    전체 {total}건
                </p>
            </div>

            {/* 필터 바 */}
            <div className="flex flex-wrap gap-3 items-center">
                {/* 별점 필터 */}
                <div className="flex gap-1.5 flex-wrap">
                    {RATING_OPTIONS.map((r) => (
                        <button
                            key={r ?? "all"}
                            onClick={() => { setRating(r); setPage(1) }}
                            className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
                            style={{
                                backgroundColor: ratingFilter === r ? "var(--toss-text-primary)" : "white",
                                color:           ratingFilter === r ? "white" : "var(--toss-text-secondary)",
                                border:          "1px solid var(--toss-border)",
                            }}
                        >
                            {r === null ? "전체" : (
                                <span className="flex items-center gap-0.5">
                                    <Star className="size-3" fill="#FFB800" color="#FFB800" />
                                    {r}점
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* 키워드 검색 */}
                <div
                    data-ui-id="input-admin-reviews-search"
                    className="flex items-center gap-2 bg-white rounded-2xl px-4 py-2.5 flex-1 min-w-52"
                    style={{ border: "1px solid var(--toss-border)" }}
                >
                    <Search className="size-4 flex-shrink-0" style={{ color: "var(--toss-text-tertiary)" }} />
                    <input
                        value={query}
                        onChange={(e) => { setQuery(e.target.value); setPage(1) }}
                        placeholder="리뷰 내용 검색"
                        className="bg-transparent flex-1 text-sm outline-none"
                        style={{ color: "var(--toss-text-primary)" }}
                    />
                    {query && (
                        <button onClick={() => { setQuery(""); setPage(1) }}>
                            <X className="size-3.5" style={{ color: "var(--toss-text-tertiary)" }} />
                        </button>
                    )}
                </div>
            </div>

            {/* 테이블 */}
            <div
                data-ui-id="table-admin-reviews-list"
                className="bg-white rounded-2xl overflow-hidden"
                style={{ border: "1px solid var(--toss-border)" }}
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr style={{ borderBottom: "1px solid var(--toss-border)", backgroundColor: "#FAFBFC" }}>
                                {["상품명", "별점", "리뷰 내용", "작성자", "작성일", "액션"].map((h) => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-bold" style={{ color: "var(--toss-text-tertiary)" }}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="py-16 text-center text-sm" style={{ color: "var(--toss-text-tertiary)" }}>
                                        불러오는 중...
                                    </td>
                                </tr>
                            ) : items.map((item, i) => {
                                const isExpanded = expandedId === item.id
                                return (
                                    <>
                                        <tr
                                            key={item.id}
                                            className="hover:bg-gray-50 transition-colors cursor-pointer"
                                            style={{ borderBottom: "1px solid var(--toss-border)" }}
                                            onClick={() => setExpandedId(isExpanded ? null : item.id)}
                                        >
                                            {/* 상품명 */}
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <p className="text-xs font-semibold max-w-[120px] truncate" style={{ color: "var(--toss-text-primary)" }}>
                                                    {item.productName}
                                                </p>
                                            </td>

                                            {/* 별점 */}
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <StarBadge rating={item.rating} />
                                            </td>

                                            {/* 리뷰 내용 (한 줄 미리보기) */}
                                            <td className="px-4 py-3">
                                                <p className="text-xs max-w-[280px] truncate" style={{ color: "var(--toss-text-primary)" }}>
                                                    {item.content}
                                                </p>
                                            </td>

                                            {/* 작성자 */}
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <p className="text-xs" style={{ color: "var(--toss-text-secondary)" }}>{item.userName}</p>
                                            </td>

                                            {/* 작성일 */}
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <p className="text-xs" style={{ color: "var(--toss-text-tertiary)" }}>{formatDate(item.createdAt)}</p>
                                            </td>

                                            {/* 액션 */}
                                            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                                                        onClick={() => setExpandedId(isExpanded ? null : item.id)}
                                                    >
                                                        {isExpanded
                                                            ? <ChevronUp className="size-3.5" style={{ color: "var(--toss-text-tertiary)" }} />
                                                            : <ChevronDown className="size-3.5" style={{ color: "var(--toss-text-tertiary)" }} />
                                                        }
                                                    </button>
                                                    <button
                                                        data-ui-id={`btn-review-delete-${item.id}`}
                                                        onClick={() => handleDelete(item.id)}
                                                        className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                                        style={{ color: "var(--toss-red)" }}
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>

                                        {/* 리뷰 내용 펼침 행 */}
                                        {isExpanded && (
                                            <tr key={`${item.id}-expand`} style={{ borderBottom: i < items.length - 1 ? "1px solid var(--toss-border)" : undefined }}>
                                                <td colSpan={6} className="px-4 pb-4 pt-0">
                                                    <div
                                                        className="rounded-xl p-4"
                                                        style={{ backgroundColor: "var(--toss-page-bg)", border: "1px solid var(--toss-border)" }}
                                                    >
                                                        {/* 별점 5개 표시 */}
                                                        <div className="flex gap-0.5 mb-2">
                                                            {[1,2,3,4,5].map((s) => (
                                                                <Star
                                                                    key={s}
                                                                    className="size-4"
                                                                    fill={s <= item.rating ? "#FFB800" : "none"}
                                                                    color={s <= item.rating ? "#FFB800" : "var(--toss-border)"}
                                                                />
                                                            ))}
                                                        </div>
                                                        <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--toss-text-primary)" }}>
                                                            {item.content}
                                                        </p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                {!loading && items.length === 0 && (
                    <div className="py-16 text-center" style={{ color: "var(--toss-text-tertiary)" }}>
                        <p className="text-sm">리뷰가 없습니다</p>
                    </div>
                )}
            </div>

            {/* 페이지네이션 */}
            {total > 0 && (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: "var(--toss-text-tertiary)" }}>페이지당</span>
                        <select
                            data-ui-id="select-admin-reviews-pagesize"
                            value={pageSize}
                            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}
                            className="rounded-lg px-2 py-1 text-xs outline-none"
                            style={{ border: "1px solid var(--toss-border)", color: "var(--toss-text-secondary)", backgroundColor: "var(--toss-page-bg)" }}
                        >
                            {PAGE_SIZE_OPTIONS.map((s) => <option key={s} value={s}>{s}개</option>)}
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
