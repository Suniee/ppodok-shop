"use client"

import { useState, useTransition, useMemo, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import {
    RefreshCw, CheckCircle2, XCircle, Clock, Search,
    Package, ChevronDown, ChevronUp, ArrowLeftRight, Undo2,
} from "lucide-react"
import type { AdminCancelRequest, CancelRequestStatus, CancelRequestType } from "@/lib/supabase/cancelRequests"
import { CANCEL_REQUEST_TYPE_LABEL, CANCEL_REQUEST_STATUS_LABEL } from "@/lib/supabase/cancelRequests"
import { approveCancelRequestAction, rejectCancelRequestAction } from "./actions"

function toKSTDateString(date: Date): string {
    return new Date(date.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

function getPresetRange(preset: "today" | "7d" | "1month" | "3month"): { start: string; end: string } {
    const now = new Date()
    const end = toKSTDateString(now)
    if (preset === "today") return { start: end, end }
    const from = new Date(now)
    if (preset === "7d")     from.setDate(from.getDate() - 6)
    if (preset === "1month") from.setMonth(from.getMonth() - 1)
    if (preset === "3month") from.setMonth(from.getMonth() - 3)
    return { start: toKSTDateString(from), end }
}

const PRESETS: { key: "today" | "7d" | "1month" | "3month"; label: string }[] = [
    { key: "today",  label: "오늘" },
    { key: "7d",     label: "7일" },
    { key: "1month", label: "1개월" },
    { key: "3month", label: "3개월" },
]

const STATUS_META: Record<CancelRequestStatus, { label: string; bg: string; color: string; icon: React.ElementType }> = {
    pending:  { label: "처리 대기", bg: "#FFF8E1", color: "#FFB800", icon: Clock },
    approved: { label: "승인",     bg: "#ECFDF5", color: "#059669", icon: CheckCircle2 },
    rejected: { label: "거절",     bg: "#FFF0F0", color: "#FF4E4E", icon: XCircle },
}

const TYPE_META: Record<CancelRequestType, { bg: string; color: string }> = {
    exchange: { bg: "#F3E8FF", color: "#9333EA" },
    refund:   { bg: "#EBF3FF", color: "#0064FF" },
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("ko-KR", {
        month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
    })
}

// ── 처리 모달 ────────────────────────────────────────────────────
function ProcessModal({
    request,
    mode,
    onClose,
    onDone,
}: {
    request: AdminCancelRequest
    mode: "approve" | "reject"
    onClose: () => void
    onDone: (note: string) => void
}) {
    const [note, setNote]       = useState("")
    const [isPending, start]    = useTransition()
    const [errMsg, setErrMsg]   = useState<string | null>(null)

    const isApprove = mode === "approve"
    const isRefund  = request.type === "refund"

    const handleSubmit = () => {
        if (!isApprove && !note.trim()) {
            setErrMsg("거절 사유를 입력해주세요.")
            return
        }
        setErrMsg(null)
        start(async () => {
            let result: { ok: boolean; message?: string }
            if (isApprove) {
                result = await approveCancelRequestAction(request.id, request.orderId, request.type, note)
            } else {
                result = await rejectCancelRequestAction(request.id, note)
            }
            if (!result.ok) {
                setErrMsg(result.message ?? "처리 중 오류가 발생했습니다.")
                return
            }
            onDone(note)
        })
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
            <div
                data-ui-id={`modal-cancel-request-${mode}`}
                className="w-full max-w-md bg-white rounded-3xl overflow-hidden"
            >
                <div className="p-6 space-y-4">
                    <p className="text-base font-black" style={{ color: "var(--toss-text-primary)" }}>
                        {isApprove ? "신청을 승인하시겠어요?" : "신청을 거절하시겠어요?"}
                    </p>

                    {/* 신청 요약 */}
                    <div className="rounded-2xl p-4 space-y-2" style={{ backgroundColor: "var(--toss-page-bg)" }}>
                        <div className="flex items-center gap-2">
                            <span
                                className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: TYPE_META[request.type].bg, color: TYPE_META[request.type].color }}
                            >
                                {CANCEL_REQUEST_TYPE_LABEL[request.type]}
                            </span>
                            <span className="text-xs font-semibold" style={{ color: "var(--toss-text-primary)" }}>
                                {request.recipientName}
                            </span>
                        </div>
                        <p className="text-xs" style={{ color: "var(--toss-text-secondary)" }}>{request.itemsSummary}</p>
                        <p className="text-xs" style={{ color: "var(--toss-text-tertiary)" }}>신청 사유: {request.reason}</p>
                        {isApprove && isRefund && (
                            <p className="text-xs font-semibold" style={{ color: "#FF4E4E" }}>
                                승인 시 {request.totalPrice.toLocaleString()}원이 즉시 환불됩니다.
                            </p>
                        )}
                    </div>

                    {/* 메모 입력 */}
                    <div>
                        <label className="text-xs font-semibold block mb-1.5" style={{ color: "var(--toss-text-secondary)" }}>
                            {isApprove ? "처리 메모 (선택)" : "거절 사유 *"}
                        </label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder={isApprove
                                ? "고객에게 전달할 메모를 입력해주세요."
                                : "거절 사유를 입력해주세요."
                            }
                            rows={3}
                            className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none"
                            style={{
                                backgroundColor: "var(--toss-page-bg)",
                                border: "1px solid var(--toss-border)",
                                color: "var(--toss-text-primary)",
                            }}
                        />
                        {errMsg && (
                            <p className="text-xs mt-1" style={{ color: "#FF4E4E" }}>{errMsg}</p>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 rounded-2xl text-sm font-bold"
                            style={{ backgroundColor: "var(--toss-page-bg)", color: "var(--toss-text-secondary)" }}
                        >
                            취소
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isPending}
                            className="flex-1 py-3 rounded-2xl text-sm font-bold text-white transition-opacity disabled:opacity-60"
                            style={{ backgroundColor: isApprove ? "#059669" : "#FF4E4E" }}
                        >
                            {isPending ? "처리 중..." : (isApprove ? "승인" : "거절")}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ── 요청 행 ──────────────────────────────────────────────────────
function RequestRow({
    request,
    onUpdate,
}: {
    request: AdminCancelRequest
    onUpdate: (id: string, status: CancelRequestStatus, note: string | null) => void
}) {
    const [modal, setModal]   = useState<"approve" | "reject" | null>(null)
    const [expanded, setExpanded] = useState(false)
    const meta     = STATUS_META[request.status]
    const typeMeta = TYPE_META[request.type]
    const StatusIcon = meta.icon

    return (
        <>
            <tr className="hover:bg-gray-50 transition-colors">
                {/* 주문번호 */}
                <td className="px-4 py-3">
                    <a
                        href={`/admin/sales?orderId=${request.orderId}`}
                        className="font-mono text-xs font-semibold hover:underline"
                        style={{ color: "var(--toss-blue)" }}
                    >
                        {request.orderId.slice(0, 8).toUpperCase()}
                    </a>
                </td>

                {/* 유형 */}
                <td className="px-4 py-3">
                    <span
                        className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: typeMeta.bg, color: typeMeta.color }}
                    >
                        {CANCEL_REQUEST_TYPE_LABEL[request.type]}
                    </span>
                </td>

                {/* 주문자 */}
                <td className="px-4 py-3">
                    <p className="text-xs font-semibold" style={{ color: "var(--toss-text-primary)" }}>{request.recipientName}</p>
                    <p className="text-[11px]" style={{ color: "var(--toss-text-tertiary)" }}>{request.itemsSummary}</p>
                </td>

                {/* 금액 */}
                <td className="px-4 py-3 whitespace-nowrap">
                    <p className="text-xs font-black" style={{ color: "var(--toss-text-primary)" }}>
                        {request.totalPrice.toLocaleString()}원
                    </p>
                </td>

                {/* 신청 사유 (토글) */}
                <td className="px-4 py-3 max-w-[160px]">
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="flex items-center gap-1 text-xs text-left"
                        style={{ color: "var(--toss-text-secondary)" }}
                    >
                        <span className="line-clamp-1">{request.reason}</span>
                        {expanded ? <ChevronUp className="size-3 flex-shrink-0" /> : <ChevronDown className="size-3 flex-shrink-0" />}
                    </button>
                    {expanded && request.adminNote && (
                        <p className="text-[11px] mt-1" style={{ color: "var(--toss-text-tertiary)" }}>
                            처리 메모: {request.adminNote}
                        </p>
                    )}
                </td>

                {/* 상태 */}
                <td className="px-4 py-3">
                    <span
                        className="flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full w-fit"
                        style={{ backgroundColor: meta.bg, color: meta.color }}
                    >
                        <StatusIcon className="size-3" />
                        {meta.label}
                    </span>
                </td>

                {/* 신청일 */}
                <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-[11px]" style={{ color: "var(--toss-text-tertiary)" }}>
                        {formatDate(request.createdAt)}
                    </span>
                </td>

                {/* 처리 버튼 */}
                <td className="px-4 py-3">
                    {request.status === "pending" ? (
                        <div className="flex gap-1.5">
                            <button
                                onClick={() => setModal("approve")}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-white transition-opacity"
                                style={{ backgroundColor: "#059669" }}
                            >
                                <CheckCircle2 className="size-3" />
                                승인
                            </button>
                            <button
                                onClick={() => setModal("reject")}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-white transition-opacity"
                                style={{ backgroundColor: "#FF4E4E" }}
                            >
                                <XCircle className="size-3" />
                                거절
                            </button>
                        </div>
                    ) : (
                        <span className="text-[11px]" style={{ color: "var(--toss-text-tertiary)" }}>처리 완료</span>
                    )}
                </td>
            </tr>

            {modal && (
                <ProcessModal
                    request={request}
                    mode={modal}
                    onClose={() => setModal(null)}
                    onDone={(note) => {
                        onUpdate(request.id, modal === "approve" ? "approved" : "rejected", note || null)
                        setModal(null)
                    }}
                />
            )}
        </>
    )
}

// ── 메인 컴포넌트 ────────────────────────────────────────────────
export default function CancelRequestsClient({
    requests: initial,
}: {
    requests: AdminCancelRequest[]
}) {
    const searchParams  = useSearchParams()
    const [requests, setRequests]  = useState<AdminCancelRequest[]>(initial)
    const [statusFilter, setFilter] = useState<CancelRequestStatus | "all">("pending")
    const [search, setSearch]      = useState("")

    const defaultRange = getPresetRange("1month")
    const [inputStart,  setInputStart]  = useState(defaultRange.start)
    const [inputEnd,    setInputEnd]    = useState(defaultRange.end)
    const [activeStart, setActiveStart] = useState<string | null>(defaultRange.start)
    const [activeEnd,   setActiveEnd]   = useState<string | null>(defaultRange.end)

    // 주문 조회 화면에서 특정 주문의 교환/환불 배지를 클릭하면 orderId로 자동 검색
    useEffect(() => {
        const orderId = searchParams.get("orderId")
        if (orderId) {
            setSearch(orderId.slice(0, 8).toUpperCase())
            setFilter("all")
        }
    }, [searchParams])

    const handleFetch = () => {
        setActiveStart(inputStart)
        setActiveEnd(inputEnd)
    }

    // 초기화: 날짜 필터 해제 → 전체 기간 표시
    const handleReset = () => {
        const range = getPresetRange("1month")
        setInputStart(range.start)
        setInputEnd(range.end)
        setActiveStart(null)
        setActiveEnd(null)
    }

    const applyPreset = (preset: "today" | "7d" | "1month" | "3month") => {
        const range = getPresetRange(preset)
        setInputStart(range.start)
        setInputEnd(range.end)
        setActiveStart(range.start)
        setActiveEnd(range.end)
    }

    const showReset = activeStart !== null || activeEnd !== null

    const filtered = useMemo(() => {
        const startMs = activeStart ? new Date(activeStart + "T00:00:00+09:00").getTime() : 0
        const endMs   = activeEnd   ? new Date(activeEnd   + "T23:59:59+09:00").getTime() : Infinity
        return requests.filter((r) => {
            const ms = new Date(r.createdAt).getTime()
            if (ms < startMs || ms > endMs) return false
            const matchStatus = statusFilter === "all" || r.status === statusFilter
            const q = search.trim().toLowerCase()
            const matchSearch = !q
                || r.recipientName.toLowerCase().includes(q)
                || r.orderId.toLowerCase().includes(q)
                || r.orderId.slice(0, 8).toUpperCase().toLowerCase().includes(q)
                || r.reason.toLowerCase().includes(q)
            return matchStatus && matchSearch
        })
    }, [requests, statusFilter, search, activeStart, activeEnd])

    const counts = {
        all:      requests.length,
        pending:  requests.filter((r) => r.status === "pending").length,
        approved: requests.filter((r) => r.status === "approved").length,
        rejected: requests.filter((r) => r.status === "rejected").length,
    }

    const handleUpdate = (id: string, status: CancelRequestStatus, note: string | null) => {
        setRequests((prev) => prev.map((r) =>
            r.id === id ? { ...r, status, adminNote: note } : r
        ))
    }

    const tabs: { key: CancelRequestStatus | "all"; label: string; count: number }[] = [
        { key: "all",      label: "전체",     count: counts.all },
        { key: "pending",  label: "처리 대기", count: counts.pending },
        { key: "approved", label: "승인",     count: counts.approved },
        { key: "rejected", label: "거절",     count: counts.rejected },
    ]

    return (
        <div className="p-7 space-y-6">
            {/* 헤더 */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-xl font-black" style={{ color: "var(--toss-text-primary)", letterSpacing: "-0.03em" }}>
                        교환/환불 관리
                    </h1>
                    <p className="text-sm mt-0.5" style={{ color: "var(--toss-text-secondary)" }}>
                        대기 중 {counts.pending}건
                    </p>
                </div>
            </div>

            {/* 요약 카드 */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: "처리 대기", value: counts.pending, color: "#FFB800", icon: Clock },
                    { label: "승인 완료", value: counts.approved, color: "#059669", icon: CheckCircle2 },
                    { label: "거절",     value: counts.rejected, color: "#FF4E4E", icon: XCircle },
                ].map(({ label, value, color, icon: Icon }) => (
                    <div key={label}
                        className="bg-white rounded-2xl px-5 py-4 flex items-center gap-4"
                        style={{ border: "1px solid var(--toss-border)" }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: color + "18" }}>
                            <Icon className="size-5" style={{ color }} />
                        </div>
                        <div>
                            <p className="text-xs font-medium" style={{ color: "var(--toss-text-secondary)" }}>{label}</p>
                            <p className="text-lg font-black mt-0.5" style={{ color: "var(--toss-text-primary)", letterSpacing: "-0.03em" }}>
                                {value}건
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* 필터 + 테이블 */}
            <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid var(--toss-border)" }}>
                {/* Row 1: 조회 조건 */}
                <div className="px-5 py-3 flex items-center gap-3 flex-wrap"
                    style={{ borderBottom: "1px solid var(--toss-border)" }}>
                    <span className="text-xs font-semibold flex-shrink-0"
                        style={{ color: "var(--toss-text-secondary)" }}>
                        조회기간
                    </span>
                    <div className="flex gap-1">
                        {PRESETS.map((p) => (
                            <button
                                key={p.key}
                                onClick={() => applyPreset(p.key)}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors"
                                style={{
                                    backgroundColor: "var(--toss-page-bg)",
                                    color: "var(--toss-text-secondary)",
                                    border: "1px solid var(--toss-border)",
                                }}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                    <div className="h-4 w-px flex-shrink-0" style={{ backgroundColor: "var(--toss-border)" }} />
                    <div className="flex items-center gap-1.5">
                        <input
                            type="date"
                            value={inputStart}
                            max={inputEnd}
                            onChange={(e) => setInputStart(e.target.value)}
                            className="text-xs outline-none bg-transparent"
                            style={{ color: "var(--toss-text-primary)" }}
                        />
                        <span className="text-xs" style={{ color: "var(--toss-text-tertiary)" }}>~</span>
                        <input
                            type="date"
                            value={inputEnd}
                            min={inputStart}
                            onChange={(e) => setInputEnd(e.target.value)}
                            className="text-xs outline-none bg-transparent"
                            style={{ color: "var(--toss-text-primary)" }}
                        />
                    </div>
                    <div className="h-4 w-px flex-shrink-0" style={{ backgroundColor: "var(--toss-border)" }} />
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl flex-1 min-w-[180px]"
                        style={{ backgroundColor: "var(--toss-page-bg)", border: "1px solid var(--toss-border)" }}>
                        <Search className="size-3.5 flex-shrink-0" style={{ color: "var(--toss-text-tertiary)" }} />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="이름, 주문번호, 사유 검색"
                            className="bg-transparent text-xs outline-none flex-1"
                            style={{ color: "var(--toss-text-primary)" }}
                        />
                    </div>
                    <button
                        onClick={handleFetch}
                        className="flex-shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-85"
                        style={{ backgroundColor: "var(--toss-blue)" }}
                    >
                        조회
                    </button>
                    {showReset && (
                        <button
                            onClick={handleReset}
                            className="flex-shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors"
                            style={{
                                backgroundColor: "var(--toss-page-bg)",
                                color: "var(--toss-text-secondary)",
                                border: "1px solid var(--toss-border)",
                            }}
                        >
                            초기화
                        </button>
                    )}
                </div>

                {/* Row 2: 상태 탭 */}
                <div className="px-5 py-1 flex items-center gap-2 flex-wrap overflow-x-auto scrollbar-hide">
                    {tabs.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setFilter(t.key)}
                            className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl transition-colors"
                            style={{
                                backgroundColor: statusFilter === t.key ? "var(--toss-blue)" : "transparent",
                                color: statusFilter === t.key ? "#fff" : "var(--toss-text-secondary)",
                            }}
                        >
                            {t.label}
                            <span
                                className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                                style={{
                                    backgroundColor: statusFilter === t.key ? "rgba(255,255,255,0.25)" : "var(--toss-page-bg)",
                                    color: statusFilter === t.key ? "#fff" : "var(--toss-text-tertiary)",
                                }}
                            >
                                {t.count}
                            </span>
                        </button>
                    ))}
                </div>
                <div style={{ borderTop: "1px solid var(--toss-border)" }} />

                {/* 테이블 */}
                <div className="overflow-x-auto">
                    {filtered.length === 0 ? (
                        <div className="py-16 text-center text-sm" style={{ color: "var(--toss-text-tertiary)" }}>
                            <Package className="size-10 mx-auto mb-3 opacity-30" />
                            {statusFilter === "pending" ? "처리 대기 중인 신청이 없습니다" : "조건에 맞는 신청이 없습니다"}
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr style={{ borderBottom: "1px solid var(--toss-border)" }}>
                                    {["주문번호", "유형", "주문자", "금액", "신청 사유", "상태", "신청일", "처리"].map((h) => (
                                        <th key={h}
                                            className="px-4 py-3 text-left text-[11px] font-semibold whitespace-nowrap"
                                            style={{ color: "var(--toss-text-tertiary)", backgroundColor: "var(--toss-page-bg)" }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((r) => (
                                    <RequestRow
                                        key={r.id}
                                        request={r}
                                        onUpdate={handleUpdate}
                                    />
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {filtered.length > 0 && (
                    <div className="px-5 py-3" style={{ borderTop: "1px solid var(--toss-border)" }}>
                        <p className="text-xs" style={{ color: "var(--toss-text-tertiary)" }}>{filtered.length}건 표시 중</p>
                    </div>
                )}
            </div>
        </div>
    )
}
