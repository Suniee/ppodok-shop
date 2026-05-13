"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import {
    LayoutDashboard, Users, Image, Package, Tag, Palette,
    Settings, LogOut, ChevronRight, TrendingUp, CreditCard,
    BarChart2, ChevronDown, Scale, Undo2,
} from "lucide-react"

type NavItem = {
    type: "item"
    href: string
    label: string
    icon: React.ElementType
}

type NavGroup = {
    type: "group"
    key: string
    label: string
    icon: React.ElementType
    children: NavItem[]
}

type NavEntry = NavItem | NavGroup

const navEntries: NavEntry[] = [
    { type: "item", href: "/admin/dashboard",     label: "대시보드",      icon: LayoutDashboard },
    {
        type: "group",
        key: "sales",
        label: "매출 관리",
        icon: BarChart2,
        children: [
            { type: "item", href: "/admin/sales",                  label: "주문 조회",   icon: TrendingUp },
            { type: "item", href: "/admin/sales/payments",         label: "결제 내역",   icon: CreditCard },
            { type: "item", href: "/admin/reconcile",              label: "결제 대사",   icon: Scale },
            { type: "item", href: "/admin/sales/cancel-requests",  label: "교환/환불",   icon: Undo2 },
        ],
    },
    { type: "item", href: "/admin/members",       label: "회원 관리",     icon: Users },
    { type: "item", href: "/admin/banners",       label: "배너 관리",     icon: Image },
    { type: "item", href: "/admin/products",      label: "상품 관리",     icon: Package },
    { type: "item", href: "/admin/categories",    label: "카테고리 관리", icon: Tag },
    { type: "item", href: "/admin/design-system", label: "디자인 시스템", icon: Palette },
    { type: "item", href: "/admin/settings",      label: "환경설정",      icon: Settings },
]

function isActive(href: string, pathname: string) {
    if (href === "/admin/sales") return pathname === href
    return pathname === href || pathname.startsWith(href + "/")
}

// 초기 펼침 상태: 현재 경로가 그룹 내에 있으면 자동 펼침
function initOpenState(pathname: string): Record<string, boolean> {
    const state: Record<string, boolean> = {}
    navEntries.forEach((entry) => {
        if (entry.type === "group") {
            state[entry.key] = entry.children.some((c) => isActive(c.href, pathname))
        }
    })
    return state
}

export default function AdminSidebar() {
    const pathname = usePathname()
    const [open, setOpen] = useState<Record<string, boolean>>(() => initOpenState(pathname))

    const toggleGroup = (key: string) =>
        setOpen((prev) => ({ ...prev, [key]: !prev[key] }))

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
                    /* ── 일반 항목 ── */
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
                                    <entry.icon className="size-4" />
                                    {entry.label}
                                </span>
                                {active && <ChevronRight className="size-3 opacity-50" />}
                            </a>
                        )
                    }

                    /* ── 그룹 ── */
                    const isOpen       = !!open[entry.key]
                    const groupActive  = entry.children.some((c) => isActive(c.href, pathname))

                    return (
                        <div key={entry.key}>
                            {/* 그룹 헤더 (클릭으로 토글) */}
                            <button
                                onClick={() => toggleGroup(entry.key)}
                                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-white/5"
                                style={{ color: groupActive ? "#fff" : "rgba(255,255,255,0.5)" }}
                            >
                                <span className="flex items-center gap-2.5">
                                    <entry.icon className="size-4" />
                                    {entry.label}
                                </span>
                                <motion.span
                                    animate={{ rotate: isOpen ? 180 : 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <ChevronDown className="size-3.5 opacity-60" />
                                </motion.span>
                            </button>

                            {/* 자식 항목들 — 접기/펼치기 */}
                            <AnimatePresence initial={false}>
                                {isOpen && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2, ease: "easeInOut" }}
                                        className="overflow-hidden"
                                    >
                                        {/* 트리 라인 */}
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
                                                            <child.icon className="size-3.5" />
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

            {/* Bottom */}
            <div className="px-3 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ backgroundColor: "var(--toss-blue)" }}>
                        관
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-semibold leading-none">관리자</p>
                        <p className="text-[10px] leading-none mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.4)" }}>
                            admin@ppodok.kr
                        </p>
                    </div>
                </div>
                <a
                    data-ui-id="btn-admin-logout"
                    href="/"
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-colors hover:bg-white/10"
                    style={{ color: "rgba(255,255,255,0.4)" }}
                >
                    <LogOut className="size-3.5" />
                    로그아웃
                </a>
            </div>
        </aside>
    )
}
