"use client"

import { useState, useTransition, useMemo } from "react"
import { Users, Search, CheckCircle2, XCircle, Clock, ShoppingBag, UserCheck } from "lucide-react"
import { updateMemberStatusAction, updateMemberGradeAction, approveMemberAction, rejectMemberAction } from "./actions"
import type { AdminMember, MemberStatus, MemberGrade, MemberRole } from "@/lib/supabase/members"
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
    label, value, color, icon: Icon, highlight,
}: { label: string; value: string; color: string; icon: React.ElementType; highlight?: boolean }) {
    return (
        <div className="bg-white rounded-2xl px-5 py-4 flex items-center gap-4"
            style={{ border: `1px solid ${highlight ? color + "60" : "var(--toss-border)"}` }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: color + "18" }}>
                <Icon className="size-5" style={{ color }} />
            </div>
            <div>
                <p className="text-xs font-medium" style={{ color: "var(--toss-text-secondary)" }}>{label}</p>
                <p className="text-lg font-black mt-0.5" style={{ color: highlight ? color : "var(--toss-text-primary)", letterSpacing: "-0.03em" }}>{value}</p>
            </div>
        </div>
    )
}

// ── 승인 모달 ──────────────────────────────────────────────────
function ApproveModal({
    member,
    onClose,
    onDone,
}: {
    member: AdminMember
    onClose: () => void
    onDone: (id: string, role: MemberRole) => void
}) {
    const [role, setRole]     = useState<MemberRole>("customer")
    const [isPending, start]  = useTransition()
    const [errMsg, setErrMsg] = useState<string | null>(null)

    const handleApprove = () => {
        setErrMsg(null)
        start(async () => {
            const result = await approveMemberAction(member.id, role)
            if (!result.ok) { setErrMsg(result.message ?? "오류가 발생했습니다."); return }
            onDone(member.id, role)
        })
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
            <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden">
                <div className="p-6 space-y-4">
                    <p className="text-base font-black" style={{ color: "var(--toss-text-primary)" }}>
                        회원 가입을 승인하시겠어요?
                    </p>

                    {/* 신청자 정보 */}
                    <div className="rounded-2xl p-4 space-y-1.5" style={{ backgroundColor: "var(--toss-page-bg)" }}>
                        <p className="text-xs font-semibold" style={{ color: "var(--toss-text-primary)" }}>
                            {member.name ?? "(이름 미설정)"}
                        </p>
                        <p className="text-xs" style={{ color: "var(--toss-text-secondary)" }}>{member.email}</p>
                        {member.phone && (
                            <p className="text-xs" style={{ color: "var(--toss-text-tertiary)" }}>{member.phone}</p>
                        )}
                        <p className="text-[11px]" style={{ color: "var(--toss-text-tertiary)" }}>
                            신청일 {formatDate(member.createdAt)}
                        </p>
                    </div>

                    {/* 권한 선택 */}
                    <div>
                        <label className="text-xs font-semibold block mb-2" style={{ color: "var(--toss-text-secondary)" }}>
                            부여할 권한
                        </label>
                        <div className="flex gap-2">
                            {([
                                { value: "customer", label: "일반 회원" },
                                { value: "admin",    label: "관리자" },
                            ] as { value: MemberRole; label: string }[]).map(({ value, label }) => (
                                <button
                                    key={value}
                                    onClick={() => setRole(value)}
                                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                                    style={{
                                        backgroundColor: role === value ? "var(--toss-blue)" : "var(--toss-page-bg)",
                                        color: role === value ? "#fff" : "var(--toss-text-secondary)",
                                        border: `1px solid ${role === value ? "transparent" : "var(--toss-border)"}`,
                                    }}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {errMsg && (
                        <p className="text-xs" style={{ color: "#FF4E4E" }}>{errMsg}</p>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 rounded-2xl text-sm font-bold"
                            style={{ backgroundColor: "var(--toss-page-bg)", color: "var(--toss-text-secondary)" }}
                        >
                            취소
                        </button>
                        <button
                            onClick={handleApprove}
                            disabled={isPending}
                            className="flex-1 py-3 rounded-2xl text-sm font-bold text-white transition-opacity disabled:opacity-60"
                            style={{ backgroundColor: "#059669" }}
                        >
                            {isPending ? "처리 중..." : "승인"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────
type TabKey = MemberStatus | "all"

export default function MembersClient({ members: initial }: { members: AdminMember[] }) {
    const [members, setMembers]           = useState<AdminMember[]>(initial)
    const [search, setSearch]             = useState("")
    const [statusFilter, setStatusFilter] = useState<TabKey>("all")
    const [isPending,  startTransition] = useTransition()
    const [isFetching, startFetch]     = useTransition()

    // 날짜 필터 (가입일 기준, pending 탭에서는 미적용)
    const defaultRange = getPresetRange("1month")
    const [inputStart,  setInputStart]  = useState(defaultRange.start)
    const [inputEnd,    setInputEnd]    = useState(defaultRange.end)
    const [activeStart, setActiveStart] = useState<string | null>(defaultRange.start)
    const [activeEnd,   setActiveEnd]   = useState<string | null>(defaultRange.end)

    // 승인 모달 / 거절 확인 대상
    const [approveTarget, setApproveTarget] = useState<AdminMember | null>(null)
    const [rejectTargetId, setRejectTargetId] = useState<string | null>(null)
    const [rejectError, setRejectError] = useState<string | null>(null)

    const handleFetch = () => {
        startFetch(() => { setActiveStart(inputStart); setActiveEnd(inputEnd) })
    }
    const handleReset = () => {
        startFetch(() => {
            const r = getPresetRange("1month")
            setInputStart(r.start); setInputEnd(r.end)
            setActiveStart(null);   setActiveEnd(null)
        })
    }
    const applyPreset = (p: "today" | "7d" | "1month" | "3month") => {
        const r = getPresetRange(p)
        setInputStart(r.start); setInputEnd(r.end)
        setActiveStart(r.start); setActiveEnd(r.end)
    }
    const showReset = activeStart !== null || activeEnd !== null

    // 가입 승인 완료 → 목록에서 해당 회원 status/role 업데이트
    const handleApproved = (id: string, role: MemberRole) => {
        setMembers((prev) => prev.map((m) =>
            m.id === id ? { ...m, status: "active", role } : m
        ))
        setApproveTarget(null)
    }

    // 가입 거절 확인 → 목록에서 제거
    const handleReject = (id: string) => {
        setRejectError(null)
        startTransition(async () => {
            const result = await rejectMemberAction(id)
            if (!result.ok) { setRejectError(result.message ?? "오류가 발생했습니다."); return }
            setMembers((prev) => prev.filter((m) => m.id !== id))
            setRejectTargetId(null)
        })
    }

    const counts = {
        pending:   members.filter((m) => m.status === "pending").length,
        all:       members.filter((m) => m.status !== "pending").length,
        active:    members.filter((m) => m.status === "active").length,
        inactive:  members.filter((m) => m.status === "inactive").length,
        suspended: members.filter((m) => m.status === "suspended").length,
    }

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase()
        if (statusFilter === "pending") {
            // 가입 신청 탭: 날짜 필터 미적용, 검색만
            return members.filter((m) => {
                if (m.status !== "pending") return false
                return !q || m.name?.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
            })
        }
        // 일반 탭: 날짜 필터 + 상태 + 검색
        const startMs = activeStart ? new Date(activeStart + "T00:00:00+09:00").getTime() : 0
        const endMs   = activeEnd   ? new Date(activeEnd   + "T23:59:59+09:00").getTime() : Infinity
        return members.filter((m) => {
            if (m.status === "pending") return false
            const ms = new Date(m.createdAt).getTime()
            if (ms < startMs || ms > endMs) return false
            const matchStatus = statusFilter === "all" || m.status === statusFilter
            const matchSearch = !q
                || m.name?.toLowerCase().includes(q)
                || m.email.toLowerCase().includes(q)
                || m.id.slice(0, 8).toLowerCase().includes(q)
                || m.phone?.includes(q)
            return matchStatus && matchSearch
        })
    }, [members, search, statusFilter, activeStart, activeEnd])

    const tabs: { key: TabKey; label: string; count: number }[] = [
        { key: "pending",   label: "가입 신청", count: counts.pending },
        { key: "all",       label: "전체",      count: counts.all },
        { key: "active",    label: "정상",      count: counts.active },
        { key: "inactive",  label: "휴면",      count: counts.inactive },
        { key: "suspended", label: "정지",      count: counts.suspended },
    ]

    const handleStatusToggle = (id: string, current: MemberStatus) => {
        const next: MemberStatus = current === "active" ? "suspended" : "active"
        setMembers((prev) => prev.map((m) => m.id === id ? { ...m, status: next } : m))
        startTransition(async () => { await updateMemberStatusAction(id, next) })
    }

    const handleGradeChange = (id: string, grade: MemberGrade) => {
        setMembers((prev) => prev.map((m) => m.id === id ? { ...m, grade } : m))
        startTransition(async () => { await updateMemberGradeAction(id, grade) })
    }

    const isPendingTab = statusFilter === "pending"

    return (
        <div data-ui-id="page-admin-members" className="p-7 space-y-6">
            <LoadingOverlay show={isFetching} label="조회 중..." />

            {/* 헤더 */}
            <div>
                <h1 className="text-xl font-black" style={{ color: "var(--toss-text-primary)", letterSpacing: "-0.03em" }}>
                    회원 관리
                </h1>
                <p className="text-sm mt-0.5" style={{ color: "var(--toss-text-secondary)" }}>
                    전체 {members.filter((m) => m.status !== "pending").length}명
                    {counts.pending > 0 && (
                        <span className="ml-2 font-semibold" style={{ color: "#FFB800" }}>
                            · 가입 신청 {counts.pending}건 대기 중
                        </span>
                    )}
                </p>
            </div>

            {/* 요약 카드 */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                <SummaryCard label="가입 신청" value={`${counts.pending}건`}    color="#FFB800" icon={UserCheck}    highlight={counts.pending > 0} />
                <SummaryCard label="전체 회원" value={`${counts.all}명`}        color="#0064FF" icon={Users} />
                <SummaryCard label="정상"      value={`${counts.active}명`}     color="#00A878" icon={CheckCircle2} />
                <SummaryCard label="정지"      value={`${counts.suspended}명`}  color="#FF4E4E" icon={XCircle} />
            </div>

            {/* 테이블 카드 */}
            <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid var(--toss-border)" }}>
                {/* Row 1: 조회 조건 (pending 탭에서는 검색창만) */}
                <div className="px-5 py-3 flex items-center gap-3 flex-wrap"
                    style={{ borderBottom: "1px solid var(--toss-border)" }}>
                    {!isPendingTab && (
                        <>
                            <span className="text-xs font-semibold flex-shrink-0"
                                style={{ color: "var(--toss-text-secondary)" }}>조회기간</span>
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
                        </>
                    )}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl flex-1 min-w-[180px]"
                        style={{ backgroundColor: "var(--toss-page-bg)", border: "1px solid var(--toss-border)" }}>
                        <Search className="size-3.5 flex-shrink-0" style={{ color: "var(--toss-text-tertiary)" }} />
                        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                            placeholder={isPendingTab ? "이름, 이메일 검색" : "이름, 이메일, ID, 전화번호 검색"}
                            className="bg-transparent text-xs outline-none flex-1"
                            style={{ color: "var(--toss-text-primary)" }} />
                    </div>
                    {!isPendingTab && (
                        <>
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
                        </>
                    )}
                </div>

                {/* Row 2: 상태 탭 */}
                <div className="px-5 py-1 flex items-center gap-2 flex-wrap overflow-x-auto scrollbar-hide">
                    {tabs.map((t) => (
                        <button key={t.key} onClick={() => setStatusFilter(t.key)}
                            className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl transition-colors"
                            style={{
                                backgroundColor: statusFilter === t.key
                                    ? (t.key === "pending" ? "#FFB800" : "var(--toss-blue)")
                                    : "transparent",
                                color: statusFilter === t.key ? "#fff" : "var(--toss-text-secondary)",
                            }}>
                            {t.label}
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                                style={{
                                    backgroundColor: statusFilter === t.key ? "rgba(255,255,255,0.25)" : "var(--toss-page-bg)",
                                    color: statusFilter === t.key ? "#fff" : t.key === "pending" && t.count > 0 ? "#FFB800" : "var(--toss-text-tertiary)",
                                }}>
                                {t.count}
                            </span>
                        </button>
                    ))}
                </div>
                <div style={{ borderTop: "1px solid var(--toss-border)" }} />

                {/* 테이블 */}
                <div className="overflow-x-auto scrollbar-hide">
                    {filtered.length === 0 ? (
                        <div className="py-16 text-center" style={{ color: "var(--toss-text-tertiary)" }}>
                            <Users className="size-10 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">
                                {isPendingTab ? "가입 신청이 없습니다" : "조건에 맞는 회원이 없습니다"}
                            </p>
                        </div>
                    ) : isPendingTab ? (
                        /* ── 가입 신청 테이블 ── */
                        <table className="w-full">
                            <thead>
                                <tr style={{ borderBottom: "1px solid var(--toss-border)" }}>
                                    {["이름", "이메일", "전화번호", "신청일", "액션"].map((h) => (
                                        <th key={h}
                                            className="px-4 py-3 text-left text-[11px] font-semibold whitespace-nowrap"
                                            style={{ color: "var(--toss-text-tertiary)", backgroundColor: "var(--toss-page-bg)" }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((m, i) => (
                                    <tr key={m.id}
                                        className="hover:bg-gray-50 transition-colors"
                                        style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--toss-border)" : undefined }}>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <p className="text-xs font-semibold" style={{ color: "var(--toss-text-primary)" }}>
                                                {m.name ?? "(이름 미설정)"}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-xs" style={{ color: "var(--toss-text-secondary)" }}>{m.email}</p>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <p className="text-xs" style={{ color: "var(--toss-text-secondary)" }}>{m.phone ?? "-"}</p>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="text-[11px]" style={{ color: "var(--toss-text-tertiary)" }}>
                                                {formatDate(m.createdAt)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {rejectTargetId === m.id ? (
                                                /* 거절 확인 인라인 */
                                                <div className="flex flex-col gap-1.5">
                                                    <p className="text-[11px] font-semibold" style={{ color: "#FF4E4E" }}>
                                                        정말 거절하시겠어요?
                                                    </p>
                                                    {rejectError && (
                                                        <p className="text-[11px]" style={{ color: "#FF4E4E" }}>{rejectError}</p>
                                                    )}
                                                    <div className="flex gap-1.5">
                                                        <button
                                                            onClick={() => handleReject(m.id)}
                                                            disabled={isPending}
                                                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-white transition-opacity disabled:opacity-40"
                                                            style={{ backgroundColor: "#FF4E4E" }}>
                                                            거절
                                                        </button>
                                                        <button
                                                            onClick={() => { setRejectTargetId(null); setRejectError(null) }}
                                                            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors"
                                                            style={{ backgroundColor: "var(--toss-page-bg)", color: "var(--toss-text-secondary)", border: "1px solid var(--toss-border)" }}>
                                                            취소
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5">
                                                    <button
                                                        onClick={() => setApproveTarget(m)}
                                                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-white transition-opacity hover:opacity-80"
                                                        style={{ backgroundColor: "#059669" }}>
                                                        <CheckCircle2 className="size-3" />
                                                        승인
                                                    </button>
                                                    <button
                                                        onClick={() => setRejectTargetId(m.id)}
                                                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-white transition-opacity hover:opacity-80"
                                                        style={{ backgroundColor: "#FF4E4E" }}>
                                                        <XCircle className="size-3" />
                                                        거절
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        /* ── 일반 회원 테이블 ── */
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
                                {filtered.map((m, i) => {
                                    const statusMeta = STATUS_META[m.status]
                                    const StatusIcon = statusMeta.icon
                                    const gradeMeta  = GRADE_META[m.grade]
                                    return (
                                        <tr key={m.id}
                                            className="hover:bg-gray-50 transition-colors"
                                            style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--toss-border)" : undefined }}>
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
                                                        onClick={() => handleStatusToggle(m.id, m.status)}
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

                {filtered.length > 0 && !isPendingTab && (
                    <div className="px-5 py-3 flex items-center justify-between"
                        style={{ borderTop: "1px solid var(--toss-border)" }}>
                        <p className="text-xs" style={{ color: "var(--toss-text-tertiary)" }}>
                            {filtered.length}명 표시 중
                        </p>
                        <p className="text-xs font-bold" style={{ color: "var(--toss-text-primary)" }}>
                            총 구매액 합계&nbsp;
                            <span style={{ color: "var(--toss-blue)" }}>
                                {filtered.reduce((s, m) => s + m.totalSpent, 0).toLocaleString()}원
                            </span>
                        </p>
                    </div>
                )}
                {filtered.length > 0 && isPendingTab && (
                    <div className="px-5 py-3" style={{ borderTop: "1px solid var(--toss-border)" }}>
                        <p className="text-xs" style={{ color: "var(--toss-text-tertiary)" }}>
                            {filtered.length}건 대기 중
                        </p>
                    </div>
                )}
            </div>

            {/* 승인 모달 */}
            {approveTarget && (
                <ApproveModal
                    member={approveTarget}
                    onClose={() => setApproveTarget(null)}
                    onDone={handleApproved}
                />
            )}
        </div>
    )
}
