"use client"

import { useState, useTransition, useMemo, useEffect, useCallback } from "react"
import { ShieldCheck, Shield, Clock, CheckCircle2, XCircle, AlertCircle, Search, Pencil } from "lucide-react"
import type { AdminUser, PendingUser, AdminRole } from "@/lib/supabase/admins"
import {
    approveUserAction,
    rejectUserAction,
    toggleAdminStatusAction,
    demoteAdminAction,
    updateAdminProfileAction,
    fetchAdminUsersPagedAction,
} from "./actions"
import AdminPagination from "@/components/admin/AdminPagination"

type Tab        = "pending" | "list"
type RoleFilter = "all" | "super" | "general"

// ── 승인 모달 ───────────────────────────────────────────────────────────────
function ApproveModal({
    user,
    onDone,
    onClose,
}: {
    user: PendingUser
    onDone: (id: string, adminRole: AdminRole) => void
    onClose: () => void
}) {
    const [adminRole, setAdminRole] = useState<AdminRole>("general")
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    const handleApprove = () => {
        startTransition(async () => {
            const res = await approveUserAction(user.id, adminRole)
            if (res.ok) {
                onDone(user.id, adminRole)
            } else {
                setError(res.message ?? "오류가 발생했습니다.")
            }
        })
    }

    const ROLE_OPTIONS: { value: AdminRole; label: string; desc: string }[] = [
        { value: "general", label: "일반관리자", desc: "관리자 기능 사용 가능" },
        { value: "super",   label: "수퍼관리자", desc: "모든 권한 + 관리자 승인" },
    ]

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl p-6 w-[400px] shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-2 mb-5">
                    <ShieldCheck className="size-5" style={{ color: "var(--toss-blue)" }} />
                    <h3 className="text-base font-bold" style={{ color: "var(--toss-text-primary)" }}>
                        가입 신청 승인
                    </h3>
                </div>

                {/* 신청자 정보 */}
                <div
                    className="rounded-xl p-4 mb-5"
                    style={{ backgroundColor: "var(--toss-bg-secondary)" }}
                >
                    <p className="text-sm font-semibold" style={{ color: "var(--toss-text-primary)" }}>
                        {user.name ?? "(이름 없음)"}
                    </p>
                    <p className="text-xs mt-1" style={{ color: "var(--toss-text-secondary)" }}>
                        {user.email}
                    </p>
                    {user.phone && (
                        <p className="text-xs mt-0.5" style={{ color: "var(--toss-text-secondary)" }}>
                            {user.phone}
                        </p>
                    )}
                    <p className="text-xs mt-0.5" style={{ color: "var(--toss-text-tertiary)" }}>
                        신청일: {new Date(user.createdAt).toLocaleDateString("ko-KR")}
                    </p>
                </div>

                {/* 등급 선택 */}
                <p className="text-xs font-semibold mb-2" style={{ color: "var(--toss-text-secondary)" }}>
                    승인 권한 선택
                </p>
                <div className="grid grid-cols-2 gap-2 mb-5">
                    {ROLE_OPTIONS.map(({ value, label, desc }) => (
                        <button
                            key={value}
                            onClick={() => setAdminRole(value)}
                            className="py-3 px-3 rounded-xl text-sm font-semibold border transition-all text-left"
                            style={{
                                backgroundColor: adminRole === value ? "var(--toss-blue)" : "transparent",
                                color:           adminRole === value ? "#fff" : "var(--toss-text-secondary)",
                                borderColor:     adminRole === value ? "var(--toss-blue)" : "var(--toss-border)",
                            }}
                        >
                            <span className="block font-bold">{label}</span>
                            <span
                                className="block text-[11px] mt-0.5"
                                style={{ color: adminRole === value ? "rgba(255,255,255,0.75)" : "var(--toss-text-tertiary)" }}
                            >
                                {desc}
                            </span>
                        </button>
                    ))}
                </div>

                {error && (
                    <div className="flex items-center gap-1.5 mb-3">
                        <AlertCircle className="size-3.5 text-red-500" />
                        <p className="text-xs text-red-500">{error}</p>
                    </div>
                )}

                <div className="flex gap-2">
                    <button
                        onClick={onClose}
                        disabled={isPending}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold border"
                        style={{ borderColor: "var(--toss-border)", color: "var(--toss-text-secondary)" }}
                    >
                        취소
                    </button>
                    <button
                        onClick={handleApprove}
                        disabled={isPending}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                        style={{ backgroundColor: "var(--toss-blue)", opacity: isPending ? 0.6 : 1 }}
                    >
                        {isPending ? "처리 중..." : "승인"}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ── 관리자 정보 수정 모달 ────────────────────────────────────────────────────
function EditAdminModal({
    admin,
    onDone,
    onClose,
}: {
    admin: AdminUser
    onDone: (id: string, name: string | null, phone: string | null, adminRole: AdminRole) => void
    onClose: () => void
}) {
    const [name, setName]         = useState(admin.name ?? "")
    const [phone, setPhone]       = useState(admin.phone ?? "")
    const [adminRole, setAdminRole] = useState<AdminRole>(admin.adminRole)
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    const handleSave = () => {
        startTransition(async () => {
            const res = await updateAdminProfileAction(admin.id, { name, phone, adminRole })
            if (res.ok) {
                onDone(admin.id, name.trim() || null, phone.trim() || null, adminRole)
            } else {
                setError(res.message ?? "오류가 발생했습니다.")
            }
        })
    }

    const ROLE_OPTIONS: { value: AdminRole; label: string }[] = [
        { value: "general", label: "일반관리자" },
        { value: "super",   label: "수퍼관리자" },
    ]

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl p-6 w-[400px] shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-2 mb-1">
                    <Pencil className="size-4" style={{ color: "var(--toss-blue)" }} />
                    <h3 className="text-base font-bold" style={{ color: "var(--toss-text-primary)" }}>
                        관리자 정보 수정
                    </h3>
                </div>

                <p className="text-xs mb-5" style={{ color: "var(--toss-text-tertiary)" }}>
                    {admin.email}
                </p>

                <div className="space-y-4 mb-5">
                    {/* 관리자 구분 */}
                    <div>
                        <label className="block text-xs font-semibold mb-2" style={{ color: "var(--toss-text-secondary)" }}>
                            관리자 구분
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {ROLE_OPTIONS.map(({ value, label }) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setAdminRole(value)}
                                    className="py-2.5 rounded-xl text-sm font-semibold border transition-all"
                                    style={{
                                        backgroundColor: adminRole === value ? "var(--toss-blue)" : "transparent",
                                        color:           adminRole === value ? "#fff" : "var(--toss-text-secondary)",
                                        borderColor:     adminRole === value ? "var(--toss-blue)" : "var(--toss-border)",
                                    }}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 이름 */}
                    <div>
                        <label className="block text-xs font-semibold mb-1" style={{ color: "var(--toss-text-secondary)" }}>
                            이름
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="이름 입력"
                            className="w-full px-3 py-2.5 text-sm rounded-xl outline-none"
                            style={{
                                backgroundColor: "var(--toss-bg-secondary)",
                                border: "1px solid var(--toss-border)",
                                color: "var(--toss-text-primary)",
                            }}
                        />
                    </div>

                    {/* 전화번호 */}
                    <div>
                        <label className="block text-xs font-semibold mb-1" style={{ color: "var(--toss-text-secondary)" }}>
                            전화번호
                        </label>
                        <input
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="010-0000-0000"
                            className="w-full px-3 py-2.5 text-sm rounded-xl outline-none"
                            style={{
                                backgroundColor: "var(--toss-bg-secondary)",
                                border: "1px solid var(--toss-border)",
                                color: "var(--toss-text-primary)",
                            }}
                        />
                    </div>
                </div>

                {error && (
                    <div className="flex items-center gap-1.5 mb-3">
                        <AlertCircle className="size-3.5 text-red-500" />
                        <p className="text-xs text-red-500">{error}</p>
                    </div>
                )}

                <div className="flex gap-2">
                    <button
                        onClick={onClose}
                        disabled={isPending}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold border"
                        style={{ borderColor: "var(--toss-border)", color: "var(--toss-text-secondary)" }}
                    >
                        취소
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isPending}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                        style={{ backgroundColor: "var(--toss-blue)", opacity: isPending ? 0.6 : 1 }}
                    >
                        {isPending ? "저장 중..." : "저장"}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ── 메인 컴포넌트 ────────────────────────────────────────────────────────────
export default function AdminsClient({
    pending: initialPending,
}: {
    pending: PendingUser[]
}) {
    const [tab, setTab]             = useState<Tab>("pending")
    const [roleFilter, setRoleFilter] = useState<RoleFilter>("all")
    const [search, setSearch]       = useState("")
    const [items, setItems]         = useState<AdminUser[]>([])
    const [total, setTotal]         = useState(0)
    const [page, setPage]           = useState(1)
    const [pageSize, setPageSize]   = useState(20)
    const [listLoading, setListLoading] = useState(false)
    const [pending, setPending]     = useState(initialPending)
    const [approveTarget, setApproveTarget] = useState<PendingUser | null>(null)

    const [rejectTargetId, setRejectTargetId] = useState<string | null>(null)
    const [editTarget, setEditTarget]         = useState<AdminUser | null>(null)
    const [actionError, setActionError] = useState<string | null>(null)
    const [, startTransition]       = useTransition()

    useEffect(() => { setPending(initialPending) }, [initialPending])

    const load = useCallback(async () => {
        setListLoading(true)
        try {
            const res = await fetchAdminUsersPagedAction(page, pageSize, roleFilter, search)
            setItems(res.items)
            setTotal(res.total)
        } finally {
            setListLoading(false)
        }
    }, [page, pageSize, roleFilter, search])

    useEffect(() => { load() }, [load])

    // ── 검색 필터 (신청 대기 탭, 소량이므로 클라이언트 필터링) ─────────────
    const filteredPending = useMemo(() => {
        const q = search.trim().toLowerCase()
        if (!q) return pending
        return pending.filter(
            (u) =>
                u.name?.toLowerCase().includes(q) ||
                u.email.toLowerCase().includes(q) ||
                u.phone?.includes(q)
        )
    }, [pending, search])

    // ── 신청 승인 ──────────────────────────────────────────────────────────
    const handleApproved = (id: string, _adminRole: AdminRole) => {
        setPending((prev) => prev.filter((u) => u.id !== id))
        // 승인 후 관리자 목록 탭으로 전환하고 데이터 새로고침
        setTab("list")
        setSearch("")
        setRoleFilter("all")
        setPage(1)
        setApproveTarget(null)
    }

    // ── 신청 거절 ──────────────────────────────────────────────────────────
    const handleReject = (id: string) => {
        setActionError(null)
        startTransition(async () => {
            const res = await rejectUserAction(id)
            if (res.ok) {
                setPending((prev) => prev.filter((u) => u.id !== id))
                setRejectTargetId(null)
            } else {
                setActionError(res.message ?? "오류가 발생했습니다.")
                setRejectTargetId(null)
            }
        })
    }

    // ── 관리자 상태 토글 ───────────────────────────────────────────────────
    const handleToggleStatus = (admin: AdminUser) => {
        setActionError(null)
        startTransition(async () => {
            const res = await toggleAdminStatusAction(admin.id, admin.email, admin.status)
            if (res.ok) {
                load()
            } else {
                setActionError(res.message ?? "오류가 발생했습니다.")
            }
        })
    }

    // ── 권한 강등 ──────────────────────────────────────────────────────────
    const handleDemote = (admin: AdminUser) => {
        setActionError(null)
        startTransition(async () => {
            const res = await demoteAdminAction(admin.id, admin.email)
            if (res.ok) {
                load()
            } else {
                setActionError(res.message ?? "오류가 발생했습니다.")
            }
        })
    }

    // ── 관리자 정보 수정 완료 ─────────────────────────────────────────────
    const handleEditSaved = (_id: string, _name: string | null, _phone: string | null, _adminRole: AdminRole) => {
        setEditTarget(null)
        load()
    }

    // ── 탭 전환 시 검색·필터 초기화 ──────────────────────────────────────
    const handleTabChange = (t: Tab) => {
        setTab(t)
        setSearch("")
        setRoleFilter("all")
        setPage(1)
        setActionError(null)
    }

    // ── 요약 카드 수치 ─────────────────────────────────────────────────────
    const activeCount   = items.filter((a) => a.status === "active").length
    const inactiveCount = items.filter((a) => a.status !== "active").length

    const TABS: { key: Tab; label: string; count?: number }[] = [
        { key: "pending", label: "신청 대기", count: pending.length },
        { key: "list",    label: "관리자 목록", count: total },
    ]

    return (
        <>
            {approveTarget && (
                <ApproveModal
                    user={approveTarget}
                    onDone={handleApproved}
                    onClose={() => setApproveTarget(null)}
                />
            )}
            {editTarget && (
                <EditAdminModal
                    admin={editTarget}
                    onDone={handleEditSaved}
                    onClose={() => setEditTarget(null)}
                />
            )}

            <div className="p-8">
                {/* 헤더 */}
                <div className="mb-6">
                    <h1
                        className="text-2xl font-black"
                        style={{ color: "var(--toss-text-primary)", letterSpacing: "-0.03em" }}
                    >
                        관리자 관리
                    </h1>
                    <p className="mt-1 text-sm" style={{ color: "var(--toss-text-secondary)" }}>
                        관리자 계정 승인 및 권한을 관리합니다.
                    </p>
                </div>

                {/* 요약 카드 */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                    {[
                        {
                            label: "신청 대기",
                            value: pending.length,
                            icon: Clock,
                            highlight: pending.length > 0,
                            color: "var(--toss-blue)",
                        },
                        {
                            label: "전체 관리자",
                            value: total,
                            icon: Shield,
                            highlight: false,
                            color: "var(--toss-text-primary)",
                        },
                        {
                            label: "활성",
                            value: activeCount,
                            icon: CheckCircle2,
                            highlight: false,
                            color: "#22c55e",
                        },
                        {
                            label: "비활성",
                            value: inactiveCount,
                            icon: XCircle,
                            highlight: false,
                            color: "#94a3b8",
                        },
                    ].map(({ label, value, icon: Icon, highlight, color }) => (
                        <div
                            key={label}
                            className="rounded-2xl p-5"
                            style={{
                                backgroundColor: highlight ? "rgba(0,102,255,0.06)" : "var(--toss-bg-card)",
                                border: `1px solid ${highlight ? "rgba(0,102,255,0.2)" : "var(--toss-border)"}`,
                            }}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-xs font-medium" style={{ color: "var(--toss-text-secondary)" }}>
                                    {label}
                                </p>
                                <Icon className="size-4" style={{ color }} />
                            </div>
                            <p
                                className="text-2xl font-black"
                                style={{ color: highlight ? "var(--toss-blue)" : "var(--toss-text-primary)" }}
                            >
                                {value}
                            </p>
                        </div>
                    ))}
                </div>

                {/* 에러 메시지 */}
                {actionError && (
                    <div
                        className="flex items-center gap-2 px-4 py-3 rounded-xl mb-4 text-sm"
                        style={{ backgroundColor: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca" }}
                    >
                        <AlertCircle className="size-4 flex-shrink-0" />
                        {actionError}
                    </div>
                )}

                {/* 테이블 카드 */}
                <div
                    className="rounded-2xl overflow-hidden"
                    style={{ backgroundColor: "var(--toss-bg-card)", border: "1px solid var(--toss-border)" }}
                >
                    {/* Row 1: 탭 + 검색 */}
                    <div
                        className="flex items-center justify-between px-5 py-3"
                        style={{ borderBottom: "1px solid var(--toss-border)" }}
                    >
                        {/* 탭 */}
                        <div className="flex gap-1">
                            {TABS.map(({ key, label, count }) => (
                                <button
                                    key={key}
                                    onClick={() => handleTabChange(key)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
                                    style={{
                                        backgroundColor:
                                            tab === key ? "var(--toss-blue)" : "transparent",
                                        color:
                                            tab === key ? "#fff" : "var(--toss-text-secondary)",
                                    }}
                                >
                                    {label}
                                    {count !== undefined && count > 0 && (
                                        <span
                                            className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                                            style={{
                                                backgroundColor:
                                                    tab === key ? "rgba(255,255,255,0.25)" : "var(--toss-bg-secondary)",
                                                color: tab === key ? "#fff" : "var(--toss-text-secondary)",
                                            }}
                                        >
                                            {count}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* 검색 */}
                        <div className="relative">
                            <Search
                                className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5"
                                style={{ color: "var(--toss-text-tertiary)" }}
                            />
                            <input
                                type="text"
                                placeholder="이름, 이메일 검색"
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                                className="pl-8 pr-3 py-1.5 text-sm rounded-xl outline-none"
                                style={{
                                    backgroundColor: "var(--toss-bg-secondary)",
                                    color: "var(--toss-text-primary)",
                                    border: "1px solid var(--toss-border)",
                                    width: "200px",
                                }}
                            />
                        </div>
                    </div>

                    {/* ── 관리자 목록: 등급 필터 ──────────────────────────── */}
                    {tab === "list" && (
                        <div
                            className="flex items-center gap-1.5 px-5 py-2.5"
                            style={{ borderBottom: "1px solid var(--toss-border)", backgroundColor: "var(--toss-bg-secondary)" }}
                        >
                            {(
                                [
                                    { key: "all",     label: "전체" },
                                    { key: "super",   label: "수퍼관리자" },
                                    { key: "general", label: "일반관리자" },
                                ] as { key: RoleFilter; label: string }[]
                            ).map(({ key, label }) => (
                                <button
                                    key={key}
                                    onClick={() => { setRoleFilter(key); setPage(1) }}
                                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-colors"
                                    style={{
                                        backgroundColor: roleFilter === key ? "var(--toss-blue)" : "transparent",
                                        color:           roleFilter === key ? "#fff" : "var(--toss-text-secondary)",
                                    }}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* ── 신청 대기 탭 ────────────────────────────────────── */}
                    {tab === "pending" && (
                        <table className="w-full text-sm">
                            <thead>
                                <tr style={{ backgroundColor: "var(--toss-bg-secondary)", borderBottom: "1px solid var(--toss-border)" }}>
                                    {["이름", "이메일", "전화번호", "신청일", "처리"].map((h) => (
                                        <th
                                            key={h}
                                            className="px-5 py-3 text-left text-xs font-semibold"
                                            style={{ color: "var(--toss-text-secondary)" }}
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPending.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-5 py-12 text-center text-sm" style={{ color: "var(--toss-text-tertiary)" }}>
                                            신청 대기 중인 계정이 없습니다.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredPending.map((user) => (
                                        <tr
                                            key={user.id}
                                            style={{ borderBottom: "1px solid var(--toss-border)" }}
                                        >
                                            <td className="px-5 py-3.5 font-medium" style={{ color: "var(--toss-text-primary)" }}>
                                                {user.name ?? <span style={{ color: "var(--toss-text-tertiary)" }}>—</span>}
                                            </td>
                                            <td className="px-5 py-3.5" style={{ color: "var(--toss-text-secondary)" }}>
                                                {user.email}
                                            </td>
                                            <td className="px-5 py-3.5" style={{ color: "var(--toss-text-secondary)" }}>
                                                {user.phone ?? "—"}
                                            </td>
                                            <td className="px-5 py-3.5" style={{ color: "var(--toss-text-secondary)" }}>
                                                {new Date(user.createdAt).toLocaleDateString("ko-KR")}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                {rejectTargetId === user.id ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs" style={{ color: "var(--toss-text-secondary)" }}>
                                                            거절하시겠습니까?
                                                        </span>
                                                        <button
                                                            onClick={() => handleReject(user.id)}
                                                            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-white"
                                                            style={{ backgroundColor: "#ef4444" }}
                                                        >
                                                            확인
                                                        </button>
                                                        <button
                                                            onClick={() => setRejectTargetId(null)}
                                                            className="px-2.5 py-1 rounded-lg text-xs font-semibold border"
                                                            style={{ borderColor: "var(--toss-border)", color: "var(--toss-text-secondary)" }}
                                                        >
                                                            취소
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => setApproveTarget(user)}
                                                            className="px-3 py-1 rounded-lg text-xs font-semibold text-white"
                                                            style={{ backgroundColor: "var(--toss-blue)" }}
                                                        >
                                                            승인
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setActionError(null)
                                                                setRejectTargetId(user.id)
                                                            }}
                                                            className="px-3 py-1 rounded-lg text-xs font-semibold border"
                                                            style={{ borderColor: "#fca5a5", color: "#ef4444" }}
                                                        >
                                                            거절
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}

                    {/* ── 관리자 목록 탭 ───────────────────────────────────── */}
                    {tab === "list" && (
                        <table className="w-full text-sm">
                            <thead>
                                <tr style={{ backgroundColor: "var(--toss-bg-secondary)", borderBottom: "1px solid var(--toss-border)" }}>
                                    {["이름", "이메일", "가입일", "상태", "구분", "처리"].map((h) => (
                                        <th
                                            key={h}
                                            className="px-5 py-3 text-left text-xs font-semibold"
                                            style={{ color: "var(--toss-text-secondary)" }}
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {listLoading ? (
                                    <tr>
                                        <td colSpan={6} className="px-5 py-12 text-center text-sm" style={{ color: "var(--toss-text-tertiary)" }}>
                                            불러오는 중...
                                        </td>
                                    </tr>
                                ) : items.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-5 py-12 text-center text-sm" style={{ color: "var(--toss-text-tertiary)" }}>
                                            등록된 관리자가 없습니다.
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((admin) => (
                                        <tr
                                            key={admin.id}
                                            style={{
                                                borderBottom: "1px solid var(--toss-border)",
                                                backgroundColor: admin.isSuperAdmin ? "rgba(0,102,255,0.03)" : "transparent",
                                            }}
                                        >
                                            <td className="px-5 py-3.5 font-medium" style={{ color: "var(--toss-text-primary)" }}>
                                                {admin.name ?? <span style={{ color: "var(--toss-text-tertiary)" }}>—</span>}
                                            </td>
                                            <td className="px-5 py-3.5" style={{ color: "var(--toss-text-secondary)" }}>
                                                {admin.email}
                                            </td>
                                            <td className="px-5 py-3.5" style={{ color: "var(--toss-text-secondary)" }}>
                                                {new Date(admin.createdAt).toLocaleDateString("ko-KR")}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span
                                                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                                                    style={
                                                        admin.status === "active"
                                                            ? { backgroundColor: "#dcfce7", color: "#16a34a" }
                                                            : { backgroundColor: "#f1f5f9", color: "#64748b" }
                                                    }
                                                >
                                                    {admin.status === "active" ? "활성" : "비활성"}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                {admin.isSuperAdmin ? (
                                                    <span
                                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
                                                        style={{ backgroundColor: "rgba(0,102,255,0.1)", color: "var(--toss-blue)" }}
                                                    >
                                                        <ShieldCheck className="size-3" />
                                                        수퍼관리자
                                                    </span>
                                                ) : (
                                                    <span
                                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                                                        style={{ backgroundColor: "var(--toss-bg-secondary)", color: "var(--toss-text-secondary)" }}
                                                    >
                                                        <Shield className="size-3" />
                                                        일반관리자
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-2">
                                                    {/* 수퍼관리자 포함 모든 행에 수정 버튼 표시 */}
                                                    <button
                                                        onClick={() => {
                                                            setActionError(null)
                                                            setEditTarget(admin)
                                                        }}
                                                        className="px-3 py-1 rounded-lg text-xs font-semibold border"
                                                        style={{ borderColor: "var(--toss-border)", color: "var(--toss-text-secondary)" }}
                                                    >
                                                        수정
                                                    </button>
                                                    {/* 수퍼관리자는 상태·권한 변경 불가 */}
                                                    {!admin.isSuperAdmin && (
                                                        <>
                                                            <button
                                                                onClick={() => handleToggleStatus(admin)}
                                                                className="px-3 py-1 rounded-lg text-xs font-semibold border transition-colors"
                                                                style={
                                                                    admin.status === "active"
                                                                        ? { borderColor: "#fca5a5", color: "#ef4444" }
                                                                        : { borderColor: "#86efac", color: "#16a34a" }
                                                                }
                                                            >
                                                                {admin.status === "active" ? "비활성화" : "활성화"}
                                                            </button>
                                                            <button
                                                                onClick={() => handleDemote(admin)}
                                                                className="px-3 py-1 rounded-lg text-xs font-semibold border"
                                                                style={{ borderColor: "var(--toss-border)", color: "var(--toss-text-secondary)" }}
                                                                title="일반 회원으로 권한 강등"
                                                            >
                                                                권한 제거
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                    {tab === "list" && total > 0 && (
                        <div className="px-5 py-3 space-y-2" style={{ borderTop: "1px solid var(--toss-border)" }}>
                            <p className="text-xs" style={{ color: "var(--toss-text-tertiary)" }}>
                                총 {total}건 중 {items.length}건 표시
                            </p>
                            <AdminPagination
                                page={page}
                                pageSize={pageSize}
                                total={total}
                                pageSizeId="select-admins-pagesize"
                                onPageChange={setPage}
                                onSizeChange={(s) => { setPageSize(s); setPage(1) }}
                            />
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
