"use client"

import { useState } from "react"
import { Search, ChevronUp, ChevronDown } from "lucide-react"
import { members, type Member } from "@/lib/data/members"

const gradeColor: Record<Member["grade"], { bg: string; color: string }> = {
  일반: { bg: "#F2F4F6", color: "#8B95A1" },
  실버: { bg: "#F0F4FF", color: "#607D8B" },
  골드: { bg: "#FFF8E1", color: "#FF8C00" },
  VIP:  { bg: "#FFF0F6", color: "#C9006B" },
}

const statusColor: Record<Member["status"], { bg: string; color: string; label: string }> = {
  active:    { bg: "#E8F8F5", color: "#00A878", label: "정상" },
  inactive:  { bg: "#F2F4F6", color: "#8B95A1", label: "휴면" },
  suspended: { bg: "#FFF0F0", color: "#FF4E4E", label: "정지" },
}

type SortKey = "name" | "joinedAt" | "orderCount" | "totalSpent"

export default function MembersPage() {
  const [query, setQuery]     = useState("")
  const [status, setStatus]   = useState<"all" | Member["status"]>("all")
  const [sortKey, setSortKey] = useState<SortKey>("joinedAt")
  const [sortAsc, setSortAsc] = useState(false)
  const [list, setList]       = useState(members)

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc)
    else { setSortKey(key); setSortAsc(false) }
  }

  const filtered = [...list]
    .filter((m) =>
      (status === "all" || m.status === status) &&
      (m.name.includes(query) || m.email.includes(query) || m.id.includes(query))
    )
    .sort((a, b) => {
      const va = a[sortKey], vb = b[sortKey]
      const cmp = typeof va === "string" ? va.localeCompare(vb as string) : (va as number) - (vb as number)
      return sortAsc ? cmp : -cmp
    })

  const toggleStatus = (id: string) => {
    setList((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, status: m.status === "active" ? "suspended" : "active" }
          : m
      )
    )
  }

  const SortIcon = ({ col }: { col: SortKey }) =>
    sortKey === col
      ? sortAsc ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />
      : <ChevronDown className="size-3 opacity-30" />

  return (
    <div className="p-7 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black" style={{ color: "var(--toss-text-primary)", letterSpacing: "-0.03em" }}>회원 관리</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--toss-text-secondary)" }}>전체 {list.length}명</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-white rounded-2xl px-4 py-2.5 flex-1 min-w-52" style={{ border: "1px solid var(--toss-border)" }}>
          <Search className="size-4 flex-shrink-0" style={{ color: "var(--toss-text-tertiary)" }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="이름, 이메일, ID 검색"
            className="bg-transparent flex-1 text-sm outline-none"
            style={{ color: "var(--toss-text-primary)" }}
          />
        </div>
        <div className="flex gap-1.5">
          {(["all", "active", "inactive", "suspended"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className="px-4 py-2.5 rounded-2xl text-xs font-semibold transition-colors"
              style={{
                backgroundColor: status === s ? "var(--toss-text-primary)" : "white",
                color: status === s ? "white" : "var(--toss-text-secondary)",
                border: status === s ? "none" : "1px solid var(--toss-border)",
              }}
            >
              {s === "all" ? "전체" : statusColor[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid var(--toss-border)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--toss-border)", backgroundColor: "#FAFBFC" }}>
                {[
                  { label: "ID", key: null },
                  { label: "이름", key: "name" },
                  { label: "이메일", key: null },
                  { label: "등급", key: null },
                  { label: "가입일", key: "joinedAt" },
                  { label: "주문수", key: "orderCount" },
                  { label: "총 구매액", key: "totalSpent" },
                  { label: "상태", key: null },
                  { label: "액션", key: null },
                ].map(({ label, key }) => (
                  <th
                    key={label}
                    className={`px-4 py-3 text-left text-xs font-bold whitespace-nowrap ${key ? "cursor-pointer select-none" : ""}`}
                    style={{ color: "var(--toss-text-tertiary)" }}
                    onClick={() => key && handleSort(key as SortKey)}
                  >
                    <span className="flex items-center gap-1">
                      {label}
                      {key && <SortIcon col={key as SortKey} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => {
                const g = gradeColor[m.grade]
                const s = statusColor[m.status]
                return (
                  <tr
                    key={m.id}
                    className="hover:bg-gray-50 transition-colors"
                    style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--toss-border)" : undefined }}
                  >
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--toss-text-tertiary)" }}>{m.id}</td>
                    <td className="px-4 py-3 font-semibold text-xs whitespace-nowrap" style={{ color: "var(--toss-text-primary)" }}>{m.name}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--toss-text-secondary)" }}>{m.email}</td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: g.bg, color: g.color }}>
                        {m.grade}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "var(--toss-text-secondary)" }}>{m.joinedAt}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-right" style={{ color: "var(--toss-text-primary)" }}>{m.orderCount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs font-bold text-right whitespace-nowrap" style={{ color: "var(--toss-text-primary)" }}>
                      {m.totalSpent.toLocaleString()}원
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: s.bg, color: s.color }}>
                        {s.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleStatus(m.id)}
                        className="text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-colors hover:opacity-80"
                        style={{
                          backgroundColor: m.status === "active" ? "#FFF0F0" : "var(--toss-blue-light)",
                          color: m.status === "active" ? "var(--toss-red)" : "var(--toss-blue)",
                        }}
                      >
                        {m.status === "active" ? "정지" : "해제"}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center" style={{ color: "var(--toss-text-tertiary)" }}>
            <p className="text-sm">검색 결과가 없습니다</p>
          </div>
        )}
      </div>
    </div>
  )
}
