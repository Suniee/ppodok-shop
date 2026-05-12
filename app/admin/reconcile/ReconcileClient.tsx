"use client"

import { useState, useMemo, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
    CheckCircle2, XCircle, AlertTriangle, Search,
    TrendingUp, CreditCard, Scale, RotateCcw, Ban,
} from "lucide-react"
import type { TossTransaction } from "@/lib/toss"
import type { AdminPayment } from "@/lib/supabase/payments"
import { resavePaymentAction, cancelPaymentAction } from "./actions"

type MatchStatus = "matched" | "mismatch" | "toss_only" | "db_only"

type ReconcileRow = {
    paymentKey:  string
    orderId:     string
    orderName:   string
    tossAmount:  number | null
    dbAmount:    number | null
    tossStatus:  string | null
    dbStatus:    string | null
    approvedAt:  string | null
    match:       MatchStatus
}

const MATCH_META: Record<MatchStatus, { label: string; bg: string; color: string; icon: React.ElementType }> = {
    matched:   { label: "일치",     bg: "#E8F8F5", color: "#00A878", icon: CheckCircle2 },
    mismatch:  { label: "금액 불일치", bg: "#FFF8E1", color: "#FFB800", icon: AlertTriangle },
    toss_only: { label: "DB 미저장", bg: "#FFF0F0", color: "#FF4E4E", icon: XCircle },
    db_only:   { label: "Toss 없음", bg: "#F3E8FF", color: "#9333EA", icon: AlertTriangle },
}

function formatDateTime(iso: string | null) {
    if (!iso) return "-"
    return new Date(iso).toLocaleString("ko-KR", {
        month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit",
    })
}

function SummaryCard({
    label, value, sub, color, icon: Icon,
}: { label: string; value: string; sub?: string; color: string; icon: React.ElementType }) {
    return (
        <div className="bg-white rounded-2xl px-5 py-4 flex items-center gap-4"
            style={{ border: "1px solid var(--toss-border)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: color + "18" }}>
                <Icon className="size-5" style={{ color }} />
            </div>
            <div>
                <p className="text-xs font-medium" style={{ color: "var(--toss-text-secondary)" }}>{label}</p>
                <p className="text-lg font-black mt-0.5" style={{ color: "var(--toss-text-primary)", letterSpacing: "-0.03em" }}>{value}</p>
                {sub && <p className="text-[11px]" style={{ color: "var(--toss-text-tertiary)" }}>{sub}</p>}
            </div>
        </div>
    )
}

interface Props {
    tossTransactions:  TossTransaction[]
    dbPayments:        AdminPayment[]
    initialStart:      string
    initialEnd:        string
    tossApprovedTotal: number
    tossApprovedCount: number
    dbApprovedTotal:   number
    dbApprovedCount:   number
}

export default function ReconcileClient({ tossTransactions, dbPayments, initialStart, initialEnd, tossApprovedTotal, tossApprovedCount, dbApprovedTotal, dbApprovedCount }: Props) {
    const router = useRouter()
    const [start,  setStart]  = useState(initialStart)
    const [end,    setEnd]    = useState(initialEnd)
    const [tab,    setTab]    = useState<MatchStatus | "all">("all")
    const [search, setSearch] = useState("")
    const [isPending, startTransition] = useTransition()

    // 취소 인라인 폼 상태: paymentKey → 입력 중인 사유
    const [cancelForms, setCancelForms] = useState<Record<string, string>>({})
    // 결과 토스트: paymentKey → { ok, message }
    const [results, setResults] = useState<Record<string, { ok: boolean; message: string }>>({})

    const openCancelForm = (key: string) =>
        setCancelForms((prev) => ({ ...prev, [key]: prev[key] ?? "" }))
    const closeCancelForm = (key: string) =>
        setCancelForms((prev) => { const n = { ...prev }; delete n[key]; return n })

    const handleResave = (paymentKey: string, orderId: string) => {
        startTransition(async () => {
            const result = await resavePaymentAction(paymentKey, orderId)
            setResults((prev) => ({ ...prev, [paymentKey]: result }))
            if (result.ok) router.refresh()
        })
    }

    const handleCancel = (paymentKey: string, orderId: string) => {
        const reason = cancelForms[paymentKey]?.trim()
        if (!reason) return
        startTransition(async () => {
            const result = await cancelPaymentAction(paymentKey, orderId, reason)
            setResults((prev) => ({ ...prev, [paymentKey]: result }))
            closeCancelForm(paymentKey)
            if (result.ok) router.refresh()
        })
    }

    // Toss와 DB를 paymentKey 기준으로 대사
    const rows = useMemo<ReconcileRow[]>(() => {
        const dbMap = new Map(dbPayments.map((p) => [p.paymentKey, p]))
        const tossMap = new Map(tossTransactions.map((t) => [t.paymentKey, t]))
        const keys = new Set([...dbMap.keys(), ...tossMap.keys()])

        return Array.from(keys).map((key) => {
            const toss = tossMap.get(key) ?? null
            const db   = dbMap.get(key) ?? null

            let match: MatchStatus
            if (toss && db) {
                match = toss.amount === db.amount ? "matched" : "mismatch"
            } else if (toss && !db) {
                match = "toss_only"
            } else {
                match = "db_only"
            }

            return {
                paymentKey:  key,
                orderId:     toss?.orderId ?? db?.orderId ?? "",
                orderName:   toss?.orderName ?? db?.orderName ?? "",
                tossAmount:  toss?.amount ?? null,
                dbAmount:    db?.amount ?? null,
                tossStatus:  toss?.status ?? null,
                dbStatus:    db?.status ?? null,
                approvedAt:  db?.approvedAt ?? toss?.transactionAt ?? null,
                match,
            }
        }).sort((a, b) => {
            // 불일치 먼저 정렬
            const order: MatchStatus[] = ["toss_only", "mismatch", "db_only", "matched"]
            return order.indexOf(a.match) - order.indexOf(b.match)
        })
    }, [tossTransactions, dbPayments])

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase()
        return rows.filter((r) => {
            if (tab !== "all" && r.match !== tab) return false
            return !q
                || r.paymentKey.toLowerCase().includes(q)
                || r.orderId.toLowerCase().includes(q)
                || r.orderName.toLowerCase().includes(q)
        })
    }, [rows, tab, search])

    const counts = useMemo(() => ({
        all:       rows.length,
        matched:   rows.filter((r) => r.match === "matched").length,
        mismatch:  rows.filter((r) => r.match === "mismatch").length,
        toss_only: rows.filter((r) => r.match === "toss_only").length,
        db_only:   rows.filter((r) => r.match === "db_only").length,
    }), [rows])

    const diff = tossApprovedTotal - dbApprovedTotal

    const handleSearch = () => {
        router.push(`/admin/reconcile?start=${start}&end=${end}`)
    }

    const tabs: { key: MatchStatus | "all"; label: string }[] = [
        { key: "all",       label: `전체 ${counts.all}` },
        { key: "matched",   label: `일치 ${counts.matched}` },
        { key: "mismatch",  label: `금액 불일치 ${counts.mismatch}` },
        { key: "toss_only", label: `DB 미저장 ${counts.toss_only}` },
        { key: "db_only",   label: `Toss 없음 ${counts.db_only}` },
    ]

    return (
        <div data-ui-id="page-admin-reconcile" className="p-7 space-y-6">
            {/* 헤더 */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-xl font-black" style={{ color: "var(--toss-text-primary)", letterSpacing: "-0.03em" }}>
                        결제 대사
                    </h1>
                    <p className="text-sm mt-0.5" style={{ color: "var(--toss-text-secondary)" }}>
                        토스 거래내역 API ↔ DB 결제 테이블 비교
                    </p>
                </div>

                {/* 날짜 범위 조회 */}
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white"
                        style={{ border: "1px solid var(--toss-border)" }}>
                        <input
                            type="date" value={start} max={end}
                            onChange={(e) => setStart(e.target.value)}
                            className="text-sm outline-none bg-transparent"
                            style={{ color: "var(--toss-text-primary)" }}
                        />
                        <span className="text-xs" style={{ color: "var(--toss-text-tertiary)" }}>~</span>
                        <input
                            type="date" value={end} min={start}
                            onChange={(e) => setEnd(e.target.value)}
                            className="text-sm outline-none bg-transparent"
                            style={{ color: "var(--toss-text-primary)" }}
                        />
                    </div>
                    <button
                        onClick={handleSearch}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-85"
                        style={{ backgroundColor: "var(--toss-blue)" }}
                    >
                        <Search className="size-3.5" />
                        조회
                    </button>
                </div>
            </div>

            {/* 요약 카드 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Toss / DB 완료 금액 비교 카드 */}
                <div className="bg-white rounded-2xl px-5 py-4 sm:col-span-1"
                    style={{ border: "1px solid var(--toss-border)" }}>
                    <p className="text-xs font-semibold mb-3" style={{ color: "var(--toss-text-tertiary)" }}>완료 금액 비교</p>
                    <div className="flex items-end justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <CreditCard className="size-3.5" style={{ color: "#0064FF" }} />
                                <span className="text-[11px] font-medium" style={{ color: "var(--toss-text-secondary)" }}>Toss</span>
                            </div>
                            <p className="text-base font-black" style={{ color: "#0064FF", letterSpacing: "-0.03em" }}>
                                {(tossApprovedTotal / 10000).toLocaleString()}만원
                            </p>
                            <p className="text-[10px] mt-0.5" style={{ color: "var(--toss-text-tertiary)" }}>{tossApprovedCount}건</p>
                        </div>
                        <div className="text-lg font-bold pb-4" style={{ color: "var(--toss-border)" }}>/</div>
                        <div>
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <TrendingUp className="size-3.5" style={{ color: "#00A878" }} />
                                <span className="text-[11px] font-medium" style={{ color: "var(--toss-text-secondary)" }}>DB</span>
                            </div>
                            <p className="text-base font-black" style={{ color: "#00A878", letterSpacing: "-0.03em" }}>
                                {(dbApprovedTotal / 10000).toLocaleString()}만원
                            </p>
                            <p className="text-[10px] mt-0.5" style={{ color: "var(--toss-text-tertiary)" }}>{dbApprovedCount}건</p>
                        </div>
                    </div>
                </div>

                <SummaryCard
                    label="차액 (Toss − DB)"
                    value={`${Math.abs(diff / 10000).toLocaleString()}만원`}
                    sub={diff === 0 ? "일치" : diff > 0 ? "Toss 초과" : "DB 초과"}
                    color={diff === 0 ? "#00A878" : "#FF4E4E"} icon={Scale}
                />
                <SummaryCard
                    label="불일치 건수"
                    value={`${counts.mismatch + counts.toss_only + counts.db_only}건`}
                    sub={counts.mismatch + counts.toss_only + counts.db_only === 0 ? "이상 없음" : "확인 필요"}
                    color={counts.mismatch + counts.toss_only + counts.db_only === 0 ? "#00A878" : "#FF4E4E"}
                    icon={AlertTriangle}
                />
            </div>

            {/* 탭 + 검색 + 테이블 */}
            <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid var(--toss-border)" }}>
                <div className="px-5 pt-4 pb-0 flex items-center justify-between gap-4 flex-wrap">
                    {/* 탭 */}
                    <div className="flex gap-0.5 overflow-x-auto scrollbar-hide pb-0.5">
                        {tabs.map((t) => (
                            <button
                                key={t.key}
                                onClick={() => setTab(t.key)}
                                className="flex-shrink-0 px-3.5 py-2 text-xs font-semibold rounded-xl transition-colors"
                                style={{
                                    backgroundColor: tab === t.key ? "var(--toss-blue)" : "transparent",
                                    color: tab === t.key ? "#fff" : "var(--toss-text-secondary)",
                                }}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                    {/* 검색 */}
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-1"
                        style={{ backgroundColor: "var(--toss-page-bg)", border: "1px solid var(--toss-border)", minWidth: 220 }}>
                        <Search className="size-3.5 flex-shrink-0" style={{ color: "var(--toss-text-tertiary)" }} />
                        <input
                            type="text" value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="paymentKey, 주문번호, 주문명 검색"
                            className="bg-transparent text-xs outline-none flex-1"
                            style={{ color: "var(--toss-text-primary)" }}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto scrollbar-hide">
                    {filtered.length === 0 ? (
                        <div className="py-16 text-center" style={{ color: "var(--toss-text-tertiary)" }}>
                            <Scale className="size-10 mx-auto mb-3 opacity-20" />
                            <p className="text-sm">조회된 내역이 없습니다</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr style={{ borderTop: "1px solid var(--toss-border)", borderBottom: "1px solid var(--toss-border)" }}>
                                    {["상태", "승인 시각", "주문번호", "주문명", "Toss 금액", "DB 금액", "Toss 상태", "paymentKey", "액션"].map((h) => (
                                        <th key={h}
                                            className="px-4 py-3 text-left text-[11px] font-semibold whitespace-nowrap"
                                            style={{ color: "var(--toss-text-tertiary)", backgroundColor: "var(--toss-page-bg)" }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((r, i) => {
                                    const meta = MATCH_META[r.match]
                                    const amountMismatch = r.tossAmount !== null && r.dbAmount !== null && r.tossAmount !== r.dbAmount
                                    return (
                                        <tr key={r.paymentKey}
                                            className="hover:bg-gray-50 transition-colors"
                                            style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--toss-border)" : undefined }}>

                                            {/* 대사 상태 */}
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap"
                                                    style={{ backgroundColor: meta.bg, color: meta.color }}>
                                                    <meta.icon className="size-2.5" />
                                                    {meta.label}
                                                </span>
                                            </td>

                                            {/* 승인 시각 */}
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className="text-[11px]" style={{ color: "var(--toss-text-tertiary)" }}>
                                                    {formatDateTime(r.approvedAt)}
                                                </span>
                                            </td>

                                            {/* 주문번호 */}
                                            <td className="px-4 py-3">
                                                <a href={`/admin/sales?search=${r.orderId.slice(0, 8)}`}
                                                    className="font-mono text-xs font-semibold hover:underline"
                                                    style={{ color: "var(--toss-blue)" }}>
                                                    {r.orderId.slice(0, 8).toUpperCase()}
                                                </a>
                                            </td>

                                            {/* 주문명 */}
                                            <td className="px-4 py-3 max-w-[140px]">
                                                <p className="text-xs truncate" style={{ color: "var(--toss-text-secondary)" }}>
                                                    {r.orderName}
                                                </p>
                                            </td>

                                            {/* Toss 금액 */}
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className="text-xs font-bold"
                                                    style={{ color: amountMismatch ? "#FF4E4E" : "var(--toss-text-primary)" }}>
                                                    {r.tossAmount !== null ? `${r.tossAmount.toLocaleString()}원` : "-"}
                                                </span>
                                            </td>

                                            {/* DB 금액 */}
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className="text-xs font-bold"
                                                    style={{ color: amountMismatch ? "#FF4E4E" : "var(--toss-text-secondary)" }}>
                                                    {r.dbAmount !== null ? `${r.dbAmount.toLocaleString()}원` : "-"}
                                                </span>
                                            </td>

                                            {/* Toss 상태 */}
                                            <td className="px-4 py-3">
                                                <span className="text-[11px]" style={{ color: "var(--toss-text-tertiary)" }}>
                                                    {r.tossStatus ?? "-"}
                                                </span>
                                            </td>

                                            {/* paymentKey */}
                                            <td className="px-4 py-3">
                                                <span className="font-mono text-[10px] px-2 py-1 rounded-lg select-all cursor-text"
                                                    style={{ backgroundColor: "var(--toss-page-bg)", color: "var(--toss-text-tertiary)" }}
                                                    title={r.paymentKey}>
                                                    {r.paymentKey.slice(0, 18)}…
                                                </span>
                                            </td>

                                            {/* 액션 */}
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col gap-1.5 min-w-[120px]">
                                                    {/* 결과 메시지 */}
                                                    {results[r.paymentKey] && (
                                                        <p className="text-[10px] font-semibold"
                                                            style={{ color: results[r.paymentKey].ok ? "#00A878" : "#FF4E4E" }}>
                                                            {results[r.paymentKey].message}
                                                        </p>
                                                    )}

                                                    {/* 재저장 — DB 미저장 건이면서 취소되지 않은 건만 */}
                                                    {r.match === "toss_only" && r.tossStatus !== "CANCELED" && r.tossStatus !== "PARTIAL_CANCELED" && (
                                                        <button
                                                            onClick={() => handleResave(r.paymentKey, r.orderId)}
                                                            disabled={isPending}
                                                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
                                                            style={{ backgroundColor: "#EBF3FF", color: "var(--toss-blue)" }}
                                                        >
                                                            <RotateCcw className="size-3" />
                                                            재저장
                                                        </button>
                                                    )}

                                                    {/* 결제 취소 — DONE 상태인 Toss 건 */}
                                                    {r.tossStatus === "DONE" && !cancelForms[r.paymentKey] && (
                                                        <button
                                                            onClick={() => openCancelForm(r.paymentKey)}
                                                            disabled={isPending}
                                                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
                                                            style={{ backgroundColor: "#FFF0F0", color: "#FF4E4E" }}
                                                        >
                                                            <Ban className="size-3" />
                                                            결제취소
                                                        </button>
                                                    )}

                                                    {/* 취소 사유 입력 폼 */}
                                                    {cancelForms[r.paymentKey] !== undefined && (
                                                        <div className="flex flex-col gap-1">
                                                            <input
                                                                type="text"
                                                                value={cancelForms[r.paymentKey]}
                                                                onChange={(e) => setCancelForms((prev) => ({ ...prev, [r.paymentKey]: e.target.value }))}
                                                                placeholder="취소 사유 입력"
                                                                className="text-[11px] px-2 py-1 rounded-lg outline-none w-full"
                                                                style={{ border: "1px solid var(--toss-border)", color: "var(--toss-text-primary)" }}
                                                            />
                                                            <div className="flex gap-1">
                                                                <button
                                                                    onClick={() => handleCancel(r.paymentKey, r.orderId)}
                                                                    disabled={isPending || !cancelForms[r.paymentKey]?.trim()}
                                                                    className="flex-1 py-1 rounded-lg text-[10px] font-bold text-white transition-opacity hover:opacity-80 disabled:opacity-40"
                                                                    style={{ backgroundColor: "#FF4E4E" }}
                                                                >
                                                                    확인
                                                                </button>
                                                                <button
                                                                    onClick={() => closeCancelForm(r.paymentKey)}
                                                                    className="flex-1 py-1 rounded-lg text-[10px] font-semibold transition-colors hover:bg-gray-100"
                                                                    style={{ border: "1px solid var(--toss-border)", color: "var(--toss-text-secondary)" }}
                                                                >
                                                                    취소
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {filtered.length > 0 && (
                    <div className="px-5 py-3 flex items-center justify-between"
                        style={{ borderTop: "1px solid var(--toss-border)" }}>
                        <p className="text-xs" style={{ color: "var(--toss-text-tertiary)" }}>
                            {filtered.length}건 표시 중
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
