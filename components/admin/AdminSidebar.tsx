"use client"

import { usePathname } from "next/navigation"
import { LayoutDashboard, Users, Image, Package, Tag, Palette, LogOut, ChevronRight } from "lucide-react"

const navItems = [
  { href: "/admin/dashboard",     label: "대시보드",      icon: LayoutDashboard },
  { href: "/admin/members",       label: "회원 관리",     icon: Users },
  { href: "/admin/banners",       label: "배너 관리",     icon: Image },
  { href: "/admin/products",      label: "상품 관리",     icon: Package },
  { href: "/admin/categories",    label: "카테고리 관리",  icon: Tag },
  { href: "/admin/design-system", label: "디자인 시스템",  icon: Palette },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside
      data-ui-id="sidebar-admin-nav"
      className="w-56 flex-shrink-0 flex flex-col h-screen sticky top-0"
      style={{ backgroundColor: "var(--toss-text-primary)", color: "#fff" }}
    >
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black"
          style={{ backgroundColor: "var(--toss-blue)" }}
        >
          뽀
        </div>
        <div>
          <p className="text-sm font-black leading-none">뽀독샵</p>
          <p className="text-[10px] leading-none mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>관리자</p>
        </div>
      </div>

      {/* Nav */}
      <nav data-ui-id="nav-admin-menu" className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/")
          return (
            <a
              key={href}
              href={href}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors group"
              style={{
                backgroundColor: active ? "rgba(255,255,255,0.1)" : "transparent",
                color: active ? "#fff" : "rgba(255,255,255,0.5)",
              }}
            >
              <span className="flex items-center gap-2.5">
                <Icon className="size-4" />
                {label}
              </span>
              {active && <ChevronRight className="size-3 opacity-50" />}
            </a>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ backgroundColor: "var(--toss-blue)" }}
          >
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
