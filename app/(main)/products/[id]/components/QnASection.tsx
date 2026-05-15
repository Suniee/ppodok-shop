"use client"

import { useState, useEffect, useCallback } from "react"
import { Lock, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, X, Trash2 } from "lucide-react"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser"
import { createQnAAction, deleteQnAAction, fetchQnAAction } from "../actions"
import { type QnA } from "@/lib/data/qna"

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

function formatDate(iso: string) {
    return iso.slice(0, 10).replace(/-/g, ".")
}

interface Props {
    productId: string
    initialCount: number
    onCountChange?: (count: number) => void
}

export default function QnASection({ productId, initialCount, onCountChange }: Props) {
    const [items, setItems]           = useState<QnA[]>([])
    const [total, setTotal]           = useState(initialCount)
    const [page, setPage]             = useState(1)
    const [pageSize, setPageSize]     = useState(10)
    const [loading, setLoading]       = useState(false)
    const [expandedId, setExpandedId] = useState<string | null>(null)

    // 작성 폼
    const [showForm, setShowForm]     = useState(false)
    const [question, setQuestion]     = useState("")
    const [isSecret, setIsSecret]     = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [formError, setFormError]   = useState<string | null>(null)

    const [myUserId, setMyUserId]     = useState<string | null>(null)

    useEffect(() => {
        createSupabaseBrowserClient().auth.getUser().then(({ data }) => setMyUserId(data.user?.id ?? null))
    }, [])

    const load = useCallback(async () => {
        setLoading(true)
        const { items: rows, total: count } = await fetchQnAAction(productId, page, pageSize)
        setItems(rows)
        setTotal(count)
        onCountChange?.(count)
        setLoading(false)
    }, [productId, page, pageSize])

    useEffect(() => { load() }, [load])

    const handleSubmit = async () => {
        if (question.trim().length < 5) { setFormError("질문을 5자 이상 작성해 주세요."); return }
        setSubmitting(true)
        setFormError(null)
        try {
            await createQnAAction(productId, question.trim(), isSecret)
            setQuestion("")
            setIsSecret(false)
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
        if (!confirm("Q&A를 삭제하시겠습니까?")) return
        try {
            await deleteQnAAction(id)
            await load()
        } catch (err) {
            alert((err as Error).message)
        }
    }

    const totalPages = Math.ceil(total / pageSize)

    return (
        <div data-ui-id="section-product-qna" className="space-y-5">
            {/* 상단: 건수 + 질문하기 버튼 */}
            <div className="flex items-center justify-between">
                <p className="text-sm" style={{ color: "var(--toss-text-tertiary)" }}>
                    총 {total}건
                </p>
                {!showForm && (
                    <button
                        data-ui-id="btn-qna-write"
                        onClick={() => {
                            if (!myUserId) { alert("로그인이 필요합니다."); return }
                            setShowForm(true)
                        }}
                        className="px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-75"
                        style={{ backgroundColor: "var(--toss-page-bg)", color: "var(--toss-text-secondary)", border: "1px solid var(--toss-border)" }}
                    >
                        질문하기
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
                        <p className="text-sm font-bold" style={{ color: "var(--toss-text-primary)" }}>질문 작성</p>
                        <button onClick={() => { setShowForm(false); setFormError(null) }}>
                            <X className="size-4" style={{ color: "var(--toss-text-tertiary)" }} />
                        </button>
                    </div>
                    <textarea
                        data-ui-id="textarea-qna-question"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="상품에 대해 궁금한 점을 남겨주세요. (5자 이상)"
                        className="w-full rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                        style={{
                            minHeight: "90px",
                            backgroundColor: "#fff",
                            color: "var(--toss-text-primary)",
                            border: "1px solid var(--toss-border)",
                            lineHeight: "1.6",
                        }}
                    />
                    {/* 비밀글 토글 */}
                    <button
                        data-ui-id="btn-qna-secret-toggle"
                        type="button"
                        onClick={() => setIsSecret((v) => !v)}
                        className="flex items-center gap-2 text-sm font-medium"
                        style={{ color: isSecret ? "var(--toss-blue)" : "var(--toss-text-tertiary)" }}
                    >
                        <Lock className="size-4" />
                        {isSecret ? "비밀글로 등록됩니다" : "비밀글로 등록하기"}
                    </button>
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
                            data-ui-id="btn-qna-submit"
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

            {/* Q&A 목록 */}
            {loading ? (
                <div className="py-12 text-center text-sm" style={{ color: "var(--toss-text-tertiary)" }}>불러오는 중...</div>
            ) : items.length === 0 ? (
                <div className="py-12 text-center" style={{ color: "var(--toss-text-tertiary)" }}>
                    <p className="text-sm">아직 등록된 질문이 없습니다</p>
                </div>
            ) : (
                <div className="divide-y" style={{ borderColor: "var(--toss-border)" }}>
                    {items.map((item) => {
                        const isExpanded = expandedId === item.id
                        const isOwn = myUserId === item.userId
                        // 비밀글 열람 권한: 본인이거나 비밀글이 아닌 경우
                        const canView = !item.isSecret || isOwn
                        return (
                            <div key={item.id} data-ui-id={`card-qna-${item.id}`}>
                                {/* 질문 행 — 비밀글 포함 모두 클릭 가능 (펼치면 '비밀글입니다' 표시) */}
                                <button
                                    className="w-full flex items-start gap-3 py-4 text-left hover:bg-gray-50 transition-colors px-1 rounded-xl"
                                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                                >
                                    <span
                                        className="flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full mt-0.5"
                                        style={{
                                            backgroundColor: item.answer ? "var(--toss-blue-light, #EFF6FF)" : "var(--toss-page-bg)",
                                            color: item.answer ? "var(--toss-blue)" : "var(--toss-text-tertiary)",
                                            border: "1px solid var(--toss-border)",
                                        }}
                                    >
                                        {item.answer ? "답변완료" : "답변대기"}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            {item.isSecret && (
                                                <Lock
                                                    className="size-3 flex-shrink-0"
                                                    style={{ color: "var(--toss-text-tertiary)" }}
                                                />
                                            )}
                                            <p
                                                className="text-sm font-medium truncate"
                                                style={{ color: canView ? "var(--toss-text-primary)" : "var(--toss-text-tertiary)" }}
                                            >
                                                {canView ? item.question : "비밀글입니다."}
                                            </p>
                                        </div>
                                        <p className="text-xs" style={{ color: "var(--toss-text-tertiary)" }}>
                                            {item.userName} · {formatDate(item.createdAt)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        {isOwn && (
                                            <span
                                                role="button"
                                                onClick={(e) => { e.stopPropagation(); handleDelete(item.id) }}
                                                className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                                style={{ color: "var(--toss-red)" }}
                                            >
                                                <Trash2 className="size-3.5" />
                                            </span>
                                        )}
                                        {isExpanded
                                            ? <ChevronUp className="size-4" style={{ color: "var(--toss-text-tertiary)" }} />
                                            : <ChevronDown className="size-4" style={{ color: "var(--toss-text-tertiary)" }} />
                                        }
                                    </div>
                                </button>

                                {/* 펼침 영역 — 비밀글 비권한자는 '비밀글입니다' 안내 표시 */}
                                {isExpanded && (
                                    <div
                                        className="mx-1 mb-3 rounded-xl p-4"
                                        style={{ backgroundColor: "var(--toss-page-bg)", border: "1px solid var(--toss-border)" }}
                                    >
                                        {!canView ? (
                                            <div className="flex items-center gap-2" style={{ color: "var(--toss-text-tertiary)" }}>
                                                <Lock className="size-3.5 flex-shrink-0" />
                                                <p className="text-sm">비밀글입니다.</p>
                                            </div>
                                        ) : item.answer ? (
                                            <>
                                                <p className="text-xs font-bold mb-2" style={{ color: "var(--toss-blue)" }}>
                                                    관리자 답변
                                                    {item.answeredAt && (
                                                        <span className="font-normal ml-2" style={{ color: "var(--toss-text-tertiary)" }}>
                                                            {formatDate(item.answeredAt)}
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--toss-text-primary)" }}>
                                                    {item.answer}
                                                </p>
                                            </>
                                        ) : (
                                            <p className="text-sm" style={{ color: "var(--toss-text-tertiary)" }}>
                                                아직 답변이 등록되지 않았습니다.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}

            {/* 페이지네이션 */}
            {total > 0 && (
                <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: "var(--toss-text-tertiary)" }}>페이지당</span>
                        <select
                            data-ui-id="select-qna-pagesize"
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
