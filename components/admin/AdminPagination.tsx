"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

interface Props {
    page:         number
    pageSize:     number
    total:        number
    pageSizeId:   string
    onPageChange: (page: number) => void
    onSizeChange: (size: number) => void
}

export default function AdminPagination({ page, pageSize, total, pageSizeId, onPageChange, onSizeChange }: Props) {
    const totalPages = Math.ceil(total / pageSize) || 1
    if (total === 0) return null
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: "var(--toss-text-tertiary)" }}>페이지당</span>
                <select
                    data-ui-id={pageSizeId}
                    value={pageSize}
                    onChange={(e) => onSizeChange(Number(e.target.value))}
                    className="rounded-lg px-2 py-1 text-xs outline-none"
                    style={{ border: "1px solid var(--toss-border)", color: "var(--toss-text-secondary)", backgroundColor: "var(--toss-page-bg)" }}
                >
                    {PAGE_SIZE_OPTIONS.map((s) => <option key={s} value={s}>{s}개</option>)}
                </select>
            </div>
            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPageChange(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-lg disabled:opacity-30 hover:bg-gray-100 transition-colors"
                >
                    <ChevronLeft className="size-4" style={{ color: "var(--toss-text-secondary)" }} />
                </button>
                <span className="text-xs px-2" style={{ color: "var(--toss-text-secondary)" }}>
                    {page} / {totalPages}
                </span>
                <button
                    onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                    disabled={page >= totalPages}
                    className="p-1.5 rounded-lg disabled:opacity-30 hover:bg-gray-100 transition-colors"
                >
                    <ChevronRight className="size-4" style={{ color: "var(--toss-text-secondary)" }} />
                </button>
            </div>
        </div>
    )
}
