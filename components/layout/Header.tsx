"use client"

import { useState, useEffect } from "react"
import { Search, ShoppingCart, Bell, ChevronDown } from "lucide-react"
import { type Category } from "@/lib/data/categories"
import { fetchActiveCategories } from "@/lib/supabase/categories"

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("")
  const [catOpen, setCatOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    fetchActiveCategories().then(setCategories)
  }, [])

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
                    href={`/category/${cat.slug}`}
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
            <button data-ui-id="btn-header-cart" className="p-2.5 rounded-xl transition-colors hover:bg-gray-50 relative" style={{ color: "var(--toss-text-secondary)" }}>
              <ShoppingCart className="size-5" />
              <span
                className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                style={{ backgroundColor: "var(--toss-blue)" }}
              >
                3
              </span>
            </button>
            <a
              data-ui-id="btn-header-login"
              href="/login"
              className="hidden sm:flex ml-2 px-4 py-2 rounded-full text-sm font-semibold text-white transition-colors hover:opacity-90"
              style={{ backgroundColor: "var(--toss-blue)" }}
            >
              로그인
            </a>
          </div>
        </div>
      </div>
    </header>
  )
}
