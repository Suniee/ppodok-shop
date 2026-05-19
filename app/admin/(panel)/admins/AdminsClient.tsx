"use client"

import { useState, useTransition, useEffect, useCallback } from "react"
import { ShieldCheck, Shield, CheckCircle2, XCircle, AlertCircle, Search, Pencil } from "lucide-react"
import type { AdminUser, AdminRole } from "@/lib/supabase/admins"
import {
    toggleAdminStatusAction,
    updateAdminProfileAction,
    fetchAdminUsersPagedAction,
} from "./actions"
import AdminPagination from "@/components/admin/AdminPagination"

type RoleFilter = "all" | "super" | "general"

// ── 관리자 정보 수정 모달 ────────────────────────────────────────────────────
function EditAdminModal({
    admin,
    onDone,
    onClose,
}: {
    admin: AdminUser
    onDone: () => void
    onClose: () => void
}) {
    const [name, setName]           = useState(admin.name ?? "")
    const [phone, setPhone]         = useState(admin.phone ?? "")
    const [adminRole, setAdminRole] = useState<AdminRole>(admin.adminRole)
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    const handleSave = () => {
        startTransition(async () => {
            const res = await updateAdminProfileAction(admin.id, { name, phone, adminRole })
            if (res.ok) {
                onDone()
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
export default function AdminsClient() {
    const [roleFilter, setRoleFilter] = useState<RoleFilter>("all")
    const [search, setSearch]         = useState("")
    const [items, setItems]           = useState<AdminUser[]>([])
    const [total, setTotal]           = useState(0)
    const [page, setPage]             = useState(1)
    const [pageSize, setPageSize]     = useState(20)
    const [loading, setLoading]       = useState(false)
    const [editTarget, setEditTarget] = useState<AdminUser | null>(null)
    const [actionError, setActionError] = useState<string | null>(null)
    const [, startTransition]         = useTransition()

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetchAdminUsersPagedAction(page, pageSize, roleFilter, search)
            setItems(res.items)
            setTotal(res.total)
        } finally {
            setLoading(false)
        }
    }, [page, pageSize, roleFilter, search])

    useEffect(() => { load() }, [load])

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

    const activeCount   = items.filter((a) => a.status === "active").length
    const inactiveCount = items.filter((a) => a.status !== "active").length

    return (
        <>
            {editTarget && (
                <EditAdminModal
                    admin={editTarget}
                    onDone={() => { setEditTarget(null); load() }}
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
                        관리자 계정 및 권한을 관리합니다.
                    </p>
                </div>

                {/* 요약 카드 */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    {[
                        { label: "전체 관리자", value: total,        icon: Shield,       color: "var(--toss-text-primary)" },
                        { label: "활성",        value: activeCount,  icon: CheckCircle2, color: "#22c55e" },
                        { label: "비활성",      value: inactiveCount,icon: XCircle,      color: "#94a3b8" },
                    ].map(({ label, value, icon: Icon, color }) => (
                        <div
                            key={label}
                            className="rounded-2xl p-5"
                            style={{ backgroundColor: "var(--toss-bg-card)", border: "1px solid var(--toss-border)" }}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-xs font-medium" style={{ color: "var(--toss-text-secondary)" }}>{label}</p>
                                <Icon className="size-4" style={{ color }} />
                            </div>
                            <p className="text-2xl font-black" style={{ color: "var(--toss-text-primary)" }}>{value}</p>
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
                    {/* 필터 + 검색 */}
                    <div
                        className="flex items-center justify-between px-5 py-3"
                        style={{ borderBottom: "1px solid var(--toss-border)" }}
                    >
                        <div className="flex gap-1">
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
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
                                    style={{
                                        backgroundColor: roleFilter === key ? "var(--toss-blue)" : "transparent",
                                        color:           roleFilter === key ? "#fff" : "var(--toss-text-secondary)",
                                    }}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

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

                    {/* 테이블 */}
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
                            {loading ? (
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
                                                <button
                                                    onClick={() => { setActionError(null); setEditTarget(admin) }}
                                                    className="px-3 py-1 rounded-lg text-xs font-semibold border"
                                                    style={{ borderColor: "var(--toss-border)", color: "var(--toss-text-secondary)" }}
                                                >
                                                    수정
                                                </button>
                                                {/* 수퍼관리자는 상태 변경 불가 */}
                                                {!admin.isSuperAdmin && (
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
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {total > 0 && (
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
