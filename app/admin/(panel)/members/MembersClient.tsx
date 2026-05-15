"use client"

import { useState, useTransition, useCallback, useEffect } from "react"
import { Users, Search, CheckCircle2, XCircle, Clock, ShoppingBag } from "lucide-react"
import { updateMemberStatusAction, updateMemberGradeAction, fetchMembersPagedAction } from "./actions"
import type { AdminMember, MemberStatus, MemberGrade } from "@/lib/supabase/members"
import type { MemberCounts } from "./actions"
import AdminPagination from "@/components/admin/AdminPagination"
import LoadingOverlay from "@/components/admin/LoadingOverlay"

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

const GRADE_META: Record<MemberGrade, { bg: string; color: string }> = {
    "일반": { bg: "#F2F4F6", color: "#8B95A1" },
    "실버": { bg: "#F0F4FF", color: "#607D8B" },
    "골드": { bg: "#FFF8E1", color: "#FF8C00" },
    "VIP":  { bg: "#FFF0F6", color: "#C9006B" },
}

const STATUS_META: Record<MemberStatus, { label: string; bg: string; color: string; icon: React.ElementType }> = {
    pending:   { label: "대기",  bg: "#FFF8E1", color: "#FFB800", icon: Clock },
    active:    { label: "정상",  bg: "#E8F8F5", color: "#00A878", icon: CheckCircle2 },
    inactive:  { label: "휴면",  bg: "#F2F4F6", color: "#8B95A1", icon: Clock },
    suspended: { label: "정지",  bg: "#FFF0F0", color: "#FF4E4E", icon: XCircle },
}

const GRADES: MemberGrade[] = ["일반", "실버", "골드", "VIP"]

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" })
}

function SummaryCard({
    label, value, color, icon: Icon,
}: { label: string; value: string; color: string; icon: React.ElementType }) {
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
            </div>
        </div>
    )
}

type TabKey = Exclude<MemberStatus, "pending"> | "all"

export default function MembersClient() {
    const [items,    setItems]    = useState<AdminMember[]>([])
    const [total,    setTotal]    = useState(0)
    const [counts,   setCounts]   = useState<MemberCounts>({ all: 0, active: 0, inactive: 0, suspended: 0 })
    const [page,     setPage]     = useState(1)
    const [pageSize, setPageSize] = useState(20)
    const [loading,  setLoading]  = useState(true)

    const [statusFilter, setStatusFilter] = useState<TabKey>("all")
    const [search,       setSearch]       = useState("")
    const [isPending,    startTransition] = useTransition()

    const defaultRange = getPresetRange("1month")
    const [inputStart,  setInputStart]  = useState(defaultRange.start)
    const [inputEnd,    setInputEnd]    = useState(defaultRange.end)
    const [activeDateStart, setActiveDateStart] = useState<string | null>(defaultRange.start)
    const [activeDateEnd,   setActiveDateEnd]   = useState<string | null>(defaultRange.end)

    const load = useCallback(async () => {
        setLoading(true)
        const { items: rows, total: cnt, counts: c } = await fetchMembersPagedAction(
            page, pageSize, statusFilter, activeDateStart, activeDateEnd, search
        )
        setItems(rows)
        setTotal(cnt)
        setCounts(c)
        setLoading(false)
    }, [page, pageSize, statusFilter, activeDateStart, activeDateEnd, search])

    useEffect(() => { load() }, [load])

    const handleFetch = () => {
        setActiveDateStart(inputStart)
        setActiveDateEnd(inputEnd)
        setPage(1)
    }
    const handleReset = () => {
        const r = getPresetRange("1month")
        setInputStart(r.start); setInputEnd(r.end)
        setActiveDateStart(null); setActiveDateEnd(null)
        setPage(1)
    }
    const applyPreset = (p: "today" | "7d" | "1month" | "3month") => {
        const r = getPresetRange(p)
        setInputStart(r.start); setInputEnd(r.end)
        setActiveDateStart(r.start); setActiveDateEnd(r.end)
        setPage(1)
    }
    const showReset = activeDateStart !== null || activeDateEnd !== null

    const tabs: { key: TabKey; label: string; count: number }[] = [
        { key: "all",       label: "전체",  count: counts.all },
        { key: "active",    label: "정상",  count: counts.active },
        { key: "inactive",  label: "휴면",  count: counts.inactive },
        { key: "suspended", label: "정지",  count: counts.suspended },
    ]

    const handleStatusToggle = (id: string, current: Exclude<MemberStatus, "pending">) => {
        const next: MemberStatus = current === "active" ? "suspended" : "active"
        setItems((prev) => prev.map((m) => m.id === id ? { ...m, status: next } : m))
        startTransition(async () => { await updateMemberStatusAction(id, next) })
    }

    const handleGradeChange = (id: string, grade: MemberGrade) => {
        setItems((prev) => prev.map((m) => m.id === id ? { ...m, grade } : m))
        startTransition(async () => { await updateMemberGradeAction(id, grade) })
    }

    return (
        <div data-ui-id="page-admin-members" className="p-7 space-y-6">
            <LoadingOverlay show={loading} label="조회 중..." />

            {/* 헤더 */}
            <div>
                <h1 className="text-xl font-black" style={{ color: "var(--toss-text-primary)", letterSpacing: "-0.03em" }}>
                    회원 관리
                </h1>
                <p className="text-sm mt-0.5" style={{ color: "var(--toss-text-secondary)" }}>
                    전체 {counts.all}명
                </p>
            </div>

            {/* 요약 카드 */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                <SummaryCard label="전체 회원" value={`${counts.all}명`}       color="#0064FF" icon={Users} />
                <SummaryCard label="정상"      value={`${counts.active}명`}    color="#00A878" icon={CheckCircle2} />
                <SummaryCard label="휴면"      value={`${counts.inactive}명`}  color="#8B95A1" icon={Clock} />
                <SummaryCard label="정지"      value={`${counts.suspended}명`} color="#FF4E4E" icon={XCircle} />
            </div>

            {/* 테이블 카드 */}
            <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid var(--toss-border)" }}>
                {/* Row 1: 조회 조건 */}
                <div className="px-5 py-3 flex items-center gap-3 flex-wrap"
                    style={{ borderBottom: "1px solid var(--toss-border)" }}>
                    <span className="text-xs font-semibold flex-shrink-0" style={{ color: "var(--toss-text-secondary)" }}>조회기간</span>
                    <div className="flex gap-1">
                        {PRESETS.map((p) => (
                            <button key={p.key} onClick={() => applyPreset(p.key)}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors"
                                style={{ backgroundColor: "var(--toss-page-bg)", color: "var(--toss-text-secondary)", border: "1px solid var(--toss-border)" }}>
                                {p.label}
                            </button>
                        ))}
                    </div>
                    <div className="h-4 w-px flex-shrink-0" style={{ backgroundColor: "var(--toss-border)" }} />
                    <div className="flex items-center gap-1.5">
                        <input type="date" value={inputStart} max={inputEnd}
                            onChange={(e) => setInputStart(e.target.value)}
                            className="text-xs outline-none bg-transparent"
                            style={{ color: "var(--toss-text-primary)" }} />
                        <span className="text-xs" style={{ color: "var(--toss-text-tertiary)" }}>~</span>
                        <input type="date" value={inputEnd} min={inputStart}
                            onChange={(e) => setInputEnd(e.target.value)}
                            className="text-xs outline-none bg-transparent"
                            style={{ color: "var(--toss-text-primary)" }} />
                    </div>
                    <div className="h-4 w-px flex-shrink-0" style={{ backgroundColor: "var(--toss-border)" }} />
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl flex-1 min-w-[180px]"
                        style={{ backgroundColor: "var(--toss-page-bg)", border: "1px solid var(--toss-border)" }}>
                        <Search className="size-3.5 flex-shrink-0" style={{ color: "var(--toss-text-tertiary)" }} />
                        <input type="text" value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                            placeholder="이름, 이메일, 전화번호 검색"
                            className="bg-transparent text-xs outline-none flex-1"
                            style={{ color: "var(--toss-text-primary)" }} />
                    </div>
                    <button onClick={handleFetch}
                        className="flex-shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-85"
                        style={{ backgroundColor: "var(--toss-blue)" }}>
                        조회
                    </button>
                    {showReset && (
                        <button onClick={handleReset}
                            className="flex-shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors"
                            style={{ backgroundColor: "var(--toss-page-bg)", color: "var(--toss-text-secondary)", border: "1px solid var(--toss-border)" }}>
                            초기화
                        </button>
                    )}
                </div>

                {/* Row 2: 상태 탭 */}
                <div className="px-5 py-1 flex items-center gap-2 flex-wrap overflow-x-auto scrollbar-hide">
                    {tabs.map((t) => (
                        <button key={t.key}
                            onClick={() => { setStatusFilter(t.key); setPage(1) }}
                            className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl transition-colors"
                            style={{
                                backgroundColor: statusFilter === t.key ? "var(--toss-blue)" : "transparent",
                                color: statusFilter === t.key ? "#fff" : "var(--toss-text-secondary)",
                            }}>
                            {t.label}
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                                style={{
                                    backgroundColor: statusFilter === t.key ? "rgba(255,255,255,0.25)" : "var(--toss-page-bg)",
                                    color: statusFilter === t.key ? "#fff" : "var(--toss-text-tertiary)",
                                }}>
                                {t.count}
                            </span>
                        </button>
                    ))}
                </div>
                <div style={{ borderTop: "1px solid var(--toss-border)" }} />

                {/* 테이블 */}
                <div className="overflow-x-auto scrollbar-hide">
                    {items.length === 0 && !loading ? (
                        <div className="py-16 text-center" style={{ color: "var(--toss-text-tertiary)" }}>
                            <Users className="size-10 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">조건에 맞는 회원이 없습니다</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr style={{ borderBottom: "1px solid var(--toss-border)" }}>
                                    {["ID", "이름", "이메일", "전화번호", "등급", "가입일", "주문수", "총구매액", "상태", "액션"].map((h) => (
                                        <th key={h}
                                            className="px-4 py-3 text-left text-[11px] font-semibold whitespace-nowrap"
                                            style={{ color: "var(--toss-text-tertiary)", backgroundColor: "var(--toss-page-bg)" }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((m, i) => {
                                    const statusMeta = STATUS_META[m.status]
                                    const StatusIcon = statusMeta.icon
                                    const gradeMeta  = GRADE_META[m.grade]
                                    return (
                                        <tr key={m.id}
                                            className="hover:bg-gray-50 transition-colors"
                                            style={{ borderBottom: i < items.length - 1 ? "1px solid var(--toss-border)" : undefined }}>
                                            <td className="px-4 py-3">
                                                <span className="font-mono text-xs" style={{ color: "var(--toss-text-tertiary)" }}>
                                                    {m.id.slice(0, 8).toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <p className="text-xs font-semibold" style={{ color: "var(--toss-text-primary)" }}>
                                                    {m.name ?? "-"}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-xs" style={{ color: "var(--toss-text-secondary)" }}>{m.email}</p>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <p className="text-xs" style={{ color: "var(--toss-text-secondary)" }}>{m.phone ?? "-"}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <select
                                                    value={m.grade}
                                                    disabled={isPending}
                                                    onChange={(e) => handleGradeChange(m.id, e.target.value as MemberGrade)}
                                                    className="text-[11px] font-bold px-2 py-0.5 rounded-full outline-none cursor-pointer disabled:opacity-60"
                                                    style={{ backgroundColor: gradeMeta.bg, color: gradeMeta.color, border: "none" }}>
                                                    {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className="text-[11px]" style={{ color: "var(--toss-text-tertiary)" }}>
                                                    {formatDate(m.createdAt)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right whitespace-nowrap">
                                                <span className="text-xs font-semibold" style={{ color: "var(--toss-text-primary)" }}>
                                                    {m.orderCount.toLocaleString()}건
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right whitespace-nowrap">
                                                <span className="text-xs font-bold" style={{ color: "var(--toss-text-primary)" }}>
                                                    {m.totalSpent.toLocaleString()}원
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap"
                                                    style={{ backgroundColor: statusMeta.bg, color: statusMeta.color }}>
                                                    <StatusIcon className="size-2.5" />
                                                    {statusMeta.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1.5">
                                                    <button
                                                        onClick={() => handleStatusToggle(m.id, m.status as Exclude<MemberStatus, "pending">)}
                                                        disabled={isPending || m.status === "inactive"}
                                                        className="text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-opacity hover:opacity-80 disabled:opacity-40 whitespace-nowrap"
                                                        style={{
                                                            backgroundColor: m.status === "active" ? "#FFF0F0" : "#E8F8F5",
                                                            color:           m.status === "active" ? "#FF4E4E" : "#00A878",
                                                        }}>
                                                        {m.status === "active" ? "정지" : "해제"}
                                                    </button>
                                                    {m.orderCount > 0 && (
                                                        <a
                                                            href={`/admin/sales?search=${encodeURIComponent(m.name ?? m.email)}`}
                                                            className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-opacity hover:opacity-80 whitespace-nowrap"
                                                            style={{ backgroundColor: "#EBF3FF", color: "var(--toss-blue)" }}
                                                            title="주문 조회 화면에서 해당 회원 주문 검색">
                                                            <ShoppingBag className="size-3" />
                                                            주문
                                                        </a>
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

                {/* 하단 합계 + 페이지네이션 */}
                {total > 0 && (
                    <div className="px-5 py-3 flex items-center justify-between flex-wrap gap-3"
                        style={{ borderTop: "1px solid var(--toss-border)" }}>
                        <p className="text-xs" style={{ color: "var(--toss-text-tertiary)" }}>
                            총 {total}명 중 {items.length}명 표시
                        </p>
                        <p className="text-xs font-bold" style={{ color: "var(--toss-text-primary)" }}>
                            총 구매액 합계&nbsp;
                            <span style={{ color: "var(--toss-blue)" }}>
                                {items.reduce((s, m) => s + m.totalSpent, 0).toLocaleString()}원
                            </span>
                        </p>
                    </div>
                )}
            </div>

            {/* 페이지네이션 */}
            <AdminPagination
                page={page}
                pageSize={pageSize}
                total={total}
                pageSizeId="select-members-pagesize"
                onPageChange={(p) => setPage(p)}
                onSizeChange={(s) => { setPageSize(s); setPage(1) }}
            />
        </div>
    )
}
