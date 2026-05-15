"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, X, MessageCircle, Lock, ChevronLeft, ChevronRight, Trash2 } from "lucide-react"
import { fetchAdminQnAAction, answerQnAAction, deleteAdminQnAAction, type AdminQnA } from "./actions"

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]
type Filter = "all" | "pending" | "answered"

function formatDate(iso: string) {
    return iso.slice(0, 10).replace(/-/g, ".")
}

const inputCls   = "rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-300 transition-all w-full"
const inputStyle = { backgroundColor: "var(--toss-page-bg)", color: "var(--toss-text-primary)", border: "1px solid var(--toss-border)" }

export default function AdminQnAPage() {
    const [items, setItems]         = useState<AdminQnA[]>([])
    const [total, setTotal]         = useState(0)
    const [page, setPage]           = useState(1)
    const [pageSize, setPageSize]   = useState(20)
    const [filter, setFilter]       = useState<Filter>("all")
    const [query, setQuery]         = useState("")
    const [loading, setLoading]     = useState(true)

    // 답변 드로어
    const [editing, setEditing]     = useState<AdminQnA | null>(null)
    const [answer, setAnswer]       = useState("")
    const [saving, setSaving]       = useState(false)
    const [saveError, setSaveError] = useState<string | null>(null)

    const load = useCallback(async () => {
        setLoading(true)
        const { items: rows, total: count } = await fetchAdminQnAAction(page, pageSize, filter, query)
        setItems(rows)
        setTotal(count)
        setLoading(false)
    }, [page, pageSize, filter, query])

    useEffect(() => { load() }, [load])

    const openDrawer = (item: AdminQnA) => {
        setEditing(item)
        setAnswer(item.answer ?? "")
        setSaveError(null)
    }
    const closeDrawer = () => { setEditing(null); setSaveError(null) }

    const handleSave = async () => {
        if (!editing) return
        if (!answer.trim()) { setSaveError("답변을 입력해 주세요."); return }
        setSaving(true)
        setSaveError(null)
        try {
            await answerQnAAction(editing.id, answer)
            closeDrawer()
            await load()
        } catch (err) {
            setSaveError((err as Error).message)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Q&A를 삭제하시겠습니까?")) return
        try {
            await deleteAdminQnAAction(id)
            if (editing?.id === id) closeDrawer()
            await load()
        } catch (err) {
            alert((err as Error).message)
        }
    }

    const totalPages = Math.ceil(total / pageSize)

    const FILTERS: { id: Filter; label: string }[] = [
        { id: "all",      label: "전체" },
        { id: "pending",  label: "답변 대기" },
        { id: "answered", label: "답변 완료" },
    ]

    return (
        <div data-ui-id="page-admin-qna" className="p-7 space-y-5">
            {/* 헤더 */}
            <div>
                <h1 className="text-xl font-black" style={{ color: "var(--toss-text-primary)", letterSpacing: "-0.03em" }}>
                    Q&A 관리
                </h1>
                <p className="text-sm mt-0.5" style={{ color: "var(--toss-text-secondary)" }}>
                    전체 {total}건
                </p>
            </div>

            {/* 필터 바 */}
            <div className="flex flex-wrap gap-3 items-center">
                {/* 상태 필터 탭 */}
                <div className="flex gap-1.5">
                    {FILTERS.map((f) => (
                        <button
                            key={f.id}
                            onClick={() => { setFilter(f.id); setPage(1) }}
                            className="px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
                            style={{
                                backgroundColor: filter === f.id ? "var(--toss-text-primary)" : "white",
                                color:           filter === f.id ? "white" : "var(--toss-text-secondary)",
                                border:          "1px solid var(--toss-border)",
                            }}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* 키워드 검색 */}
                <div
                    data-ui-id="input-admin-qna-search"
                    className="flex items-center gap-2 bg-white rounded-2xl px-4 py-2.5 flex-1 min-w-52"
                    style={{ border: "1px solid var(--toss-border)" }}
                >
                    <Search className="size-4 flex-shrink-0" style={{ color: "var(--toss-text-tertiary)" }} />
                    <input
                        value={query}
                        onChange={(e) => { setQuery(e.target.value); setPage(1) }}
                        placeholder="질문 내용 검색"
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
                data-ui-id="table-admin-qna-list"
                className="bg-white rounded-2xl overflow-hidden"
                style={{ border: "1px solid var(--toss-border)" }}
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr style={{ borderBottom: "1px solid var(--toss-border)", backgroundColor: "#FAFBFC" }}>
                                {["상품명", "질문", "작성자", "접수일", "상태", "액션"].map((h) => (
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
                            ) : items.map((item, i) => (
                                <tr
                                    key={item.id}
                                    className="hover:bg-gray-50 transition-colors"
                                    style={{ borderBottom: i < items.length - 1 ? "1px solid var(--toss-border)" : undefined }}
                                >
                                    {/* 상품명 */}
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <p className="text-xs font-semibold max-w-[120px] truncate" style={{ color: "var(--toss-text-primary)" }}>
                                            {item.productName}
                                        </p>
                                    </td>

                                    {/* 질문 */}
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1.5 max-w-[320px]">
                                            {item.isSecret && (
                                                <Lock className="size-3 flex-shrink-0" style={{ color: "var(--toss-text-tertiary)" }} />
                                            )}
                                            <p className="text-xs truncate" style={{ color: "var(--toss-text-primary)" }}>
                                                {item.question}
                                            </p>
                                        </div>
                                    </td>

                                    {/* 작성자 */}
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <p className="text-xs" style={{ color: "var(--toss-text-secondary)" }}>{item.userName}</p>
                                    </td>

                                    {/* 접수일 */}
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <p className="text-xs" style={{ color: "var(--toss-text-tertiary)" }}>{formatDate(item.createdAt)}</p>
                                    </td>

                                    {/* 상태 뱃지 */}
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <span
                                            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                            style={item.answer
                                                ? { backgroundColor: "#EFF6FF", color: "var(--toss-blue)" }
                                                : { backgroundColor: "#FFF7ED", color: "#EA580C" }
                                            }
                                        >
                                            {item.answer ? "답변완료" : "답변대기"}
                                        </span>
                                    </td>

                                    {/* 액션 */}
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1">
                                            <button
                                                data-ui-id={`btn-qna-answer-${item.id}`}
                                                onClick={() => openDrawer(item)}
                                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors hover:opacity-80"
                                                style={{ backgroundColor: "var(--toss-blue)", color: "#fff" }}
                                            >
                                                <MessageCircle className="size-3" />
                                                {item.answer ? "수정" : "답변"}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                                style={{ color: "var(--toss-red)" }}
                                            >
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
                        <p className="text-sm">Q&A가 없습니다</p>
                    </div>
                )}
            </div>

            {/* 페이지네이션 */}
            {total > 0 && (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: "var(--toss-text-tertiary)" }}>페이지당</span>
                        <select
                            data-ui-id="select-admin-qna-pagesize"
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

            {/* 답변 드로어 */}
            {editing && (
                <div data-ui-id="drawer-admin-qna-answer" className="fixed top-0 bottom-0 right-0 left-56 z-50 flex">
                    <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={closeDrawer} />
                    <div className="w-[480px] bg-white h-full overflow-auto flex flex-col shadow-2xl">
                        {/* 드로어 헤더 */}
                        <div className="px-6 py-5 flex items-center justify-between flex-shrink-0" style={{ borderBottom: "1px solid var(--toss-border)" }}>
                            <p className="text-base font-bold" style={{ color: "var(--toss-text-primary)" }}>
                                {editing.answer ? "답변 수정" : "답변 작성"}
                            </p>
                            <button onClick={closeDrawer} className="p-1.5 rounded-xl hover:bg-gray-100 transition-colors">
                                <X className="size-4" style={{ color: "var(--toss-text-secondary)" }} />
                            </button>
                        </div>

                        {/* 드로어 본문 */}
                        <div className="px-6 py-5 space-y-5 flex-1">
                            {/* 질문 정보 */}
                            <div
                                className="rounded-2xl p-4 space-y-3"
                                style={{ backgroundColor: "var(--toss-page-bg)", border: "1px solid var(--toss-border)" }}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold" style={{ color: "var(--toss-text-secondary)" }}>질문</span>
                                    <div className="flex items-center gap-2">
                                        {editing.isSecret && (
                                            <span className="flex items-center gap-1 text-[10px] font-medium" style={{ color: "var(--toss-text-tertiary)" }}>
                                                <Lock className="size-3" /> 비밀글
                                            </span>
                                        )}
                                        <span className="text-[10px]" style={{ color: "var(--toss-text-tertiary)" }}>
                                            {formatDate(editing.createdAt)}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--toss-text-primary)" }}>
                                    {editing.question}
                                </p>
                                <div className="flex items-center gap-3 pt-1" style={{ borderTop: "1px solid var(--toss-border)" }}>
                                    <span className="text-xs" style={{ color: "var(--toss-text-tertiary)" }}>
                                        작성자: <span style={{ color: "var(--toss-text-secondary)" }}>{editing.userName}</span>
                                    </span>
                                    <span className="text-xs" style={{ color: "var(--toss-text-tertiary)" }}>
                                        상품: <span style={{ color: "var(--toss-text-secondary)" }}>{editing.productName}</span>
                                    </span>
                                </div>
                            </div>

                            {/* 답변 입력 */}
                            <div className="flex flex-col gap-1.5">
                                <span className="text-xs font-semibold" style={{ color: "var(--toss-text-secondary)" }}>답변 내용 *</span>
                                <textarea
                                    data-ui-id="textarea-admin-qna-answer"
                                    className={`${inputCls} resize-none`}
                                    style={{ ...inputStyle, minHeight: "160px", lineHeight: "1.7" }}
                                    value={answer}
                                    onChange={(e) => setAnswer(e.target.value)}
                                    placeholder="고객 질문에 대한 답변을 작성해 주세요."
                                />
                            </div>
                        </div>

                        {/* 저장 버튼 */}
                        <div className="px-6 py-4 flex-shrink-0" style={{ borderTop: "1px solid var(--toss-border)" }}>
                            {saveError && (
                                <p className="text-xs font-medium mb-3 px-3 py-2 rounded-xl" style={{ backgroundColor: "#FFF0F0", color: "var(--toss-red)" }}>
                                    {saveError}
                                </p>
                            )}
                            <div className="flex gap-2">
                                <button
                                    data-ui-id="btn-admin-qna-cancel"
                                    onClick={closeDrawer}
                                    className="flex-1 py-3 rounded-2xl text-sm font-semibold"
                                    style={{ color: "var(--toss-text-secondary)", border: "1px solid var(--toss-border)" }}
                                >
                                    취소
                                </button>
                                <button
                                    data-ui-id="btn-admin-qna-save"
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white hover:opacity-85 transition-opacity disabled:opacity-50"
                                    style={{ backgroundColor: "var(--toss-blue)" }}
                                >
                                    {saving ? "저장 중..." : "저장"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
