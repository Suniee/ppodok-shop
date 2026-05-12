"use client"

import { useState, useEffect, useRef } from "react"
import { Search, ShoppingCart, Bell, ChevronDown, User, LogOut, Package } from "lucide-react"
import { useRouter } from "next/navigation"
import { type Category } from "@/lib/data/categories"
import { fetchActiveCategories } from "@/lib/supabase/categories"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser"
import { useCart } from "@/lib/store/CartContext"
export default function Header() {
  const router = useRouter()
  const { totalCount, openCart } = useCart()
  const [searchQuery, setSearchQuery] = useState("")
  const [catOpen, setCatOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchActiveCategories().then(setCategories)
  }, [])

  // profiles 테이블에서 이름 조회
  const fetchProfile = async (uid: string) => {
    const supabase = createSupabaseBrowserClient()
    const { data } = await supabase
      .from("profiles")
      .select("name, email")
      .eq("id", uid)
      .single()
    setDisplayName(data?.name ?? data?.email?.split("@")[0] ?? null)
  }

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()

    // 페이지 로드마다 세션 확인 및 이름 갱신
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null)
      if (user) fetchProfile(user.id)
    })

    // 로그인/로그아웃 상태 변화 구독
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user?.id ?? null
      setUserId(uid)
      if (uid) fetchProfile(uid)
      else setDisplayName(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // 유저 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut()
    setUserMenuOpen(false)
    router.push("/")
    router.refresh()
  }

  return (
    <header data-ui-id="header-main" className="bg-white sticky top-0 z-50" style={{ borderBottom: "1px solid var(--toss-border)" }}>
      <div className="max-w-5xl mx-auto px-5">
        <div className="flex items-center gap-5 h-[60px]">

          {/* Logo */}
          <a data-ui-id="link-header-logo" href="/" className="flex-shrink-0 flex items-center gap-1.5">
            <span
              className="font-black text-xl tracking-tight"
              style={{ color: "var(--toss-blue)" }}
            >
              뽀독샵
            </span>
          </a>

          {/* Category dropdown */}
          <div className="relative hidden md:block">
            <button
              data-ui-id="btn-header-category"
              onClick={() => setCatOpen(!catOpen)}
              className="flex items-center gap-1 text-sm font-medium px-3 py-2 rounded-xl transition-colors hover:bg-gray-50"
              style={{ color: "var(--toss-text-secondary)" }}
            >
              카테고리
              <ChevronDown className={`size-3.5 transition-transform ${catOpen ? "rotate-180" : ""}`} />
            </button>
            {catOpen && (
              <div
                data-ui-id="dropdown-header-category"
                className="absolute top-full left-0 mt-2 w-44 bg-white rounded-2xl shadow-lg overflow-hidden"
                style={{ border: "1px solid var(--toss-border)" }}
              >
                {categories.map((cat) => (
                  <a
                    key={cat.id}
                    href={`/products?category=${cat.slug}`}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-gray-50"
                    style={{ color: "var(--toss-text-primary)" }}
                    onClick={() => setCatOpen(false)}
                  >
                    <span>{cat.icon}</span>
                    {cat.name}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md">
            <div
              data-ui-id="input-header-search"
              className="flex items-center gap-2 rounded-2xl px-4 py-2.5 transition-all focus-within:ring-2"
              style={{
                backgroundColor: "var(--toss-page-bg)",
                "--tw-ring-color": "var(--toss-blue)",
              } as React.CSSProperties}
            >
              <Search className="size-4 flex-shrink-0" style={{ color: "var(--toss-text-tertiary)" }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="어떤 상품을 찾고 계세요?"
                className="bg-transparent flex-1 text-sm outline-none"
                style={{ color: "var(--toss-text-primary)" }}
              />
            </div>
          </div>

          {/* Icons */}
          <div className="flex items-center gap-1 ml-auto">
            <button data-ui-id="btn-header-notification" className="p-2.5 rounded-xl transition-colors hover:bg-gray-50 relative" style={{ color: "var(--toss-text-secondary)" }}>
              <Bell className="size-5" />
              <span
                className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: "var(--toss-blue)" }}
              />
            </button>
            <button
              data-ui-id="btn-header-cart"
              onClick={openCart}
              className="p-2.5 rounded-xl transition-colors hover:bg-gray-50 relative"
              style={{ color: "var(--toss-text-secondary)" }}
            >
              <ShoppingCart className="size-5" />
              {totalCount > 0 && (
                <span
                  className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                  style={{ backgroundColor: "var(--toss-blue)" }}
                >
                  {totalCount > 99 ? "99+" : totalCount}
                </span>
              )}
            </button>
            {userId ? (
              <div data-ui-id="menu-header-user" className="relative ml-2" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold transition-colors hover:bg-gray-50"
                  style={{ color: "var(--toss-text-primary)", border: "1px solid var(--toss-border)" }}
                >
                  <User className="size-4" style={{ color: "var(--toss-blue)" }} />
                  <span className="max-w-[80px] truncate">
                    {displayName ?? "…"}
                  </span>
                </button>
                {userMenuOpen && (
                  <div
                    className="absolute top-full right-0 mt-2 w-44 bg-white rounded-2xl shadow-lg overflow-hidden"
                    style={{ border: "1px solid var(--toss-border)" }}
                  >
                    <a
                      data-ui-id="link-user-menu-profile"
                      href="/account"
                      className="flex items-center gap-2.5 px-4 py-3 text-sm transition-colors hover:bg-gray-50"
                      style={{ color: "var(--toss-text-primary)" }}
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <User className="size-4" style={{ color: "var(--toss-text-tertiary)" }} />
                      내 계정
                    </a>
                    <a
                      data-ui-id="link-user-menu-orders"
                      href="/orders"
                      className="flex items-center gap-2.5 px-4 py-3 text-sm transition-colors hover:bg-gray-50"
                      style={{ color: "var(--toss-text-primary)" }}
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Package className="size-4" style={{ color: "var(--toss-text-tertiary)" }} />
                      주문/취소 내역
                    </a>
                    <div style={{ height: "1px", backgroundColor: "var(--toss-border)" }} />
                    <button
                      data-ui-id="btn-user-menu-logout"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm transition-colors hover:bg-gray-50"
                      style={{ color: "var(--toss-red)" }}
                    >
                      <LogOut className="size-4" />
                      로그아웃
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <a
                data-ui-id="btn-header-login"
                href="/login"
                className="hidden sm:flex ml-2 px-4 py-2 rounded-full text-sm font-semibold text-white transition-colors hover:opacity-90"
                style={{ backgroundColor: "var(--toss-blue)" }}
              >
                로그인
              </a>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
