"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import {
    LayoutDashboard, Users, Image, Package, Tag, Palette,
    ScrollText, LogOut, ChevronRight, TrendingUp, CreditCard,
    BarChart2, ChevronDown, Scale, Undo2, ShieldCheck,
    Settings, List, Star, MessageCircle, Building2,
} from "lucide-react"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser"
import { ADMIN_STORAGE_KEY } from "@/lib/supabase/keys"
import type { AdminUser, AdminRole } from "@/lib/supabase/admins"
import { buildNavEntries } from "@/lib/admin-menu"
import type { NavEntry, NavItem, NavGroup, MenuConfig } from "@/lib/admin-menu"

// 아이콘 이름 문자열 → React 컴포넌트 매핑 (클라이언트에서만 사용)
const ICON_MAP: Record<string, React.ElementType> = {
    LayoutDashboard, BarChart2, TrendingUp, CreditCard, Scale, Undo2,
    Users, ShieldCheck, Image, Package, Tag, Palette, ScrollText, Settings, List,
    Star, MessageCircle, Building2,
}

function IconComp({ name, className }: { name: string; className?: string }) {
    const Comp = ICON_MAP[name]
    if (!Comp) return null
    return <Comp className={className} />
}

function isActive(href: string, pathname: string) {
    if (href === "/admin/sales") return pathname === href
    return pathname === href || pathname.startsWith(href + "/")
}

function initOpenState(entries: NavEntry[], pathname: string): Record<string, boolean> {
    const state: Record<string, boolean> = {}
    for (const entry of entries) {
        if (entry.type === "group") {
            state[entry.id] = entry.children.some((c) => isActive(c.href, pathname))
        }
    }
    return state
}

// 이름 또는 이메일 앞글자로 아바타 문자 생성
function avatarChar(name: string | null, email: string) {
    const source = name?.trim() || email
    return source[0]?.toUpperCase() ?? "관"
}

type Props = {
    currentUser: { id: string; email: string; name: string | null; adminRole: AdminRole } | null
    admins:      AdminUser[]
    menuConfig:  MenuConfig[]
}

export default function AdminSidebar({ currentUser, admins, menuConfig }: Props) {
    const pathname     = usePathname()
    const isSuperAdmin = currentUser?.adminRole === "super"

    const navEntries = buildNavEntries(menuConfig, isSuperAdmin)

    const [open, setOpen]               = useState<Record<string, boolean>>(() => initOpenState(navEntries, pathname))
    const [showSwitcher, setShowSwitcher] = useState(false)
    const [switching, setSwitching]       = useState<string | null>(null)
    const [switchError, setSwitchError]   = useState<string | null>(null)

    const toggleGroup = (key: string) =>
        setOpen((prev) => ({ ...prev, [key]: !prev[key] }))

    // 현재 로그인 계정을 제외한 다른 관리자 목록
    const otherAdmins = admins.filter((a) => a.id !== currentUser?.id && a.status === "active")

    const handleSwitch = async (targetEmail: string) => {
        setSwitchError(null)
        setSwitching(targetEmail)
        try {
            const res = await fetch("/api/admin/switch-account", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ targetEmail }),
            })
            const data = await res.json()

            if (!data.otp) {
                setSwitchError(data.error ?? "전환에 실패했습니다.")
                setSwitching(null)
                return
            }

            const supabase = createSupabaseBrowserClient(ADMIN_STORAGE_KEY)
            const { error: otpError } = await supabase.auth.verifyOtp({
                email: targetEmail,
                token: data.otp,
                type:  "magiclink",
            })

            if (otpError) {
                setSwitchError(otpError.message ?? "계정 전환에 실패했습니다.")
                setSwitching(null)
                return
            }

            window.location.href = "/admin/dashboard"
        } catch {
            setSwitchError("네트워크 오류가 발생했습니다.")
            setSwitching(null)
        }
    }

    const handleLogout = async () => {
        const supabase = createSupabaseBrowserClient(ADMIN_STORAGE_KEY)
        await supabase.auth.signOut()
        window.location.href = "/admin/login"
    }

    return (
        <aside
            data-ui-id="sidebar-admin-nav"
            className="w-56 flex-shrink-0 flex flex-col h-screen sticky top-0"
            style={{ backgroundColor: "var(--toss-text-primary)", color: "#fff" }}
        >
            {/* Logo */}
            <div className="px-5 py-5 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black"
                    style={{ backgroundColor: "var(--toss-blue)" }}>
                    뽀
                </div>
                <div>
                    <p className="text-sm font-black leading-none">뽀독샵</p>
                    <p className="text-[10px] leading-none mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>관리자</p>
                </div>
            </div>

            {/* Nav */}
            <nav data-ui-id="nav-admin-menu" className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                {navEntries.map((entry) => {
                    if (entry.type === "item") {
                        const active = isActive(entry.href, pathname)
                        return (
                            <a
                                key={entry.href}
                                href={entry.href}
                                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
                                style={{
                                    backgroundColor: active ? "rgba(255,255,255,0.1)" : "transparent",
                                    color: active ? "#fff" : "rgba(255,255,255,0.5)",
                                }}
                            >
                                <span className="flex items-center gap-2.5">
                                    <IconComp name={entry.icon} className="size-4" />
                                    {entry.label}
                                </span>
                                {active && <ChevronRight className="size-3 opacity-50" />}
                            </a>
                        )
                    }

                    const isOpen      = !!open[entry.id]
                    const groupActive = entry.children.some((c) => isActive(c.href, pathname))

                    return (
                        <div key={entry.id}>
                            <button
                                onClick={() => toggleGroup(entry.id)}
                                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-white/5"
                                style={{ color: groupActive ? "#fff" : "rgba(255,255,255,0.5)" }}
                            >
                                <span className="flex items-center gap-2.5">
                                    <IconComp name={entry.icon} className="size-4" />
                                    {entry.label}
                                </span>
                                <motion.span
                                    animate={{ rotate: isOpen ? 180 : 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <ChevronDown className="size-3.5 opacity-60" />
                                </motion.span>
                            </button>

                            <AnimatePresence initial={false}>
                                {isOpen && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2, ease: "easeInOut" }}
                                        className="overflow-hidden"
                                    >
                                        <div className="relative ml-[22px] pl-4 space-y-0.5 py-1"
                                            style={{ borderLeft: "1px solid rgba(255,255,255,0.1)" }}>
                                            {entry.children.map((child) => {
                                                const active = isActive(child.href, pathname)
                                                return (
                                                    <a
                                                        key={child.href}
                                                        href={child.href}
                                                        className="flex items-center justify-between pr-3 py-2 rounded-xl text-xs font-medium transition-colors"
                                                        style={{
                                                            backgroundColor: active ? "rgba(255,255,255,0.1)" : "transparent",
                                                            color: active ? "#fff" : "rgba(255,255,255,0.45)",
                                                            paddingLeft: "0.625rem",
                                                        }}
                                                    >
                                                        <span className="flex items-center gap-2">
                                                            <IconComp name={child.icon} className="size-3.5" />
                                                            {child.label}
                                                        </span>
                                                        {active && <ChevronRight className="size-3 opacity-50" />}
                                                    </a>
                                                )
                                            })}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )
                })}
            </nav>

            {/* Bottom — 계정 정보 + 전환 */}
            <div className="px-3 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>

                <AnimatePresence initial={false}>
                    {showSwitcher && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            className="overflow-hidden mb-2"
                        >
                            <div className="rounded-xl py-2" style={{ backgroundColor: "rgba(255,255,255,0.07)" }}>
                                <p className="px-3 pb-1.5 text-[10px] font-semibold tracking-wide"
                                    style={{ color: "rgba(255,255,255,0.3)" }}>
                                    계정 전환
                                </p>

                                {switchError && (
                                    <p className="px-3 pb-1.5 text-[10px]" style={{ color: "#f87171" }}>
                                        {switchError}
                                    </p>
                                )}

                                {otherAdmins.length === 0 ? (
                                    <p className="px-3 py-1 text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                                        다른 관리자 계정이 없습니다.
                                    </p>
                                ) : (
                                    otherAdmins.map((admin) => (
                                        <div
                                            key={admin.id}
                                            className="flex items-center gap-2 px-2 py-1.5 mx-1 rounded-lg"
                                        >
                                            <div
                                                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                                                style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
                                            >
                                                {avatarChar(admin.name, admin.email)}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold leading-none truncate" style={{ color: "#fff" }}>
                                                    {admin.name ?? admin.email.split("@")[0]}
                                                </p>
                                                {admin.isSuperAdmin && (
                                                    <p className="text-[9px] mt-0.5" style={{ color: "rgba(100,160,255,0.9)" }}>
                                                        수퍼관리자
                                                    </p>
                                                )}
                                            </div>

                                            <button
                                                onClick={() => handleSwitch(admin.email)}
                                                disabled={switching !== null}
                                                className="text-[10px] font-semibold px-2 py-0.5 rounded-md flex-shrink-0 transition-opacity"
                                                style={{
                                                    backgroundColor: "rgba(255,255,255,0.12)",
                                                    color: "rgba(255,255,255,0.75)",
                                                    opacity: switching !== null ? 0.5 : 1,
                                                }}
                                            >
                                                {switching === admin.email ? "..." : "전환"}
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 현재 계정 — 클릭 시 전환 패널 토글 */}
                <button
                    data-ui-id="btn-admin-account-switch"
                    onClick={() => {
                        setShowSwitcher((prev) => !prev)
                        setSwitchError(null)
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 mb-1 rounded-xl transition-colors hover:bg-white/5"
                >
                    <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: "var(--toss-blue)" }}
                    >
                        {avatarChar(currentUser?.name ?? null, currentUser?.email ?? "관")}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                        <p className="text-xs font-semibold leading-none truncate">
                            {currentUser?.name ?? "관리자"}
                        </p>
                        <p className="text-[10px] leading-none mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.4)" }}>
                            {currentUser?.email ?? ""}
                        </p>
                    </div>
                    <motion.span
                        animate={{ rotate: showSwitcher ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex-shrink-0"
                    >
                        <ChevronDown className="size-3.5 opacity-40" />
                    </motion.span>
                </button>

                {/* 로그아웃 */}
                <button
                    data-ui-id="btn-admin-logout"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-colors hover:bg-white/10"
                    style={{ color: "rgba(255,255,255,0.4)" }}
                >
                    <LogOut className="size-3.5" />
                    로그아웃
                </button>
            </div>
        </aside>
    )
}
