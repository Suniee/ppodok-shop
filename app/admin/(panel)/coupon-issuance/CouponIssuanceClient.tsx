"use client"

import { useState, useEffect, useCallback, useTransition } from "react"
import {
    Search, Loader2, Tag, Send, X, Users, CheckCircle2, Clock, TicketX,
} from "lucide-react"
import {
    fetchCouponsPagedAction, fetchCouponIssuancesPagedAction,
    issueCouponAction, searchMembersForCouponAction,
} from "./actions"
import type { Coupon, CouponIssuance } from "@/lib/supabase/coupon-utils"
import type { MemberSearchResult } from "./actions"
import AdminPagination from "@/components/admin/AdminPagination"

// ── 스타일 상수 ────────────────────────────────────────────────
const inputCls   = "rounded-xl px-3 py-2.5 text-sm outline-none transition-all w-full"
const inputStyle = {
    backgroundColor: "var(--toss-page-bg)",
    color:           "var(--toss-text-primary)",
    border:          "1px solid var(--toss-border)",
}

// ── 공통 배지 ──────────────────────────────────────────────────
function Badge({ color, children }: { color: "green" | "red" | "gray" | "purple" | "blue"; children: React.ReactNode }) {
    const styles: Record<string, { bg: string; color: string }> = {
        green:  { bg: "#E8F8F5", color: "#00A878" },
        red:    { bg: "#FFF0F0", color: "#FF4E4E" },
        gray:   { bg: "#F2F4F6", color: "#8B95A1" },
        purple: { bg: "#F3E8FF", color: "#9333EA" },
        blue:   { bg: "#EBF3FF", color: "#0064FF" },
    }
    const s = styles[color]
    return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
            style={{ backgroundColor: s.bg, color: s.color }}>
            {children}
        </span>
    )
}

function discountLabel(coupon: Coupon): string {
    if (coupon.discountType === "fixed") return `${coupon.discountValue.toLocaleString()}원 할인`
    let s = `${coupon.discountValue}% 할인`
    if (coupon.maxDiscountAmount) s += ` (최대 ${coupon.maxDiscountAmount.toLocaleString()}원)`
    return s
}

function couponStatus(coupon: Coupon): { label: string; color: "green" | "red" | "gray" | "purple" } {
    const now = new Date()
    if (!coupon.isActive)                  return { label: "비활성", color: "gray" }
    if (new Date(coupon.validFrom)  > now) return { label: "예약",   color: "purple" }
    if (new Date(coupon.validUntil) < now) return { label: "만료",   color: "red" }
    if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit)
                                           return { label: "소진",   color: "red" }
    return { label: "활성", color: "green" }
}

// ── 발급 모달 ──────────────────────────────────────────────────
function IssueModal({
    coupon, onClose, onIssued,
}: {
    coupon:   Coupon
    onClose:  () => void
    onIssued: () => void
}) {
    const [query, setQuery]            = useState("")
    const [results, setResults]        = useState<MemberSearchResult[]>([])
    const [selected, setSelected]      = useState<MemberSearchResult | null>(null)
    const [searching, setSearching]    = useState(false)
    const [isPending, startTransition] = useTransition()
    const [error, setError]            = useState<string | null>(null)

    useEffect(() => {
        const t = setTimeout(async () => {
            if (!query.trim()) { setResults([]); return }
            setSearching(true)
            const res = await searchMembersForCouponAction(query)
            setResults(res)
            setSearching(false)
        }, 300)
        return () => clearTimeout(t)
    }, [query])

    const handleIssue = () => {
        if (!selected) return
        setError(null)
        startTransition(async () => {
            const res = await issueCouponAction(coupon.id, selected.id)
            if (res.ok) { onIssued(); onClose() }
            else setError(res.message ?? "발급 실패")
        })
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-4"
                style={{ border: "1px solid var(--toss-border)" }}>
                <div className="flex items-center justify-between">
                    <p className="text-base font-bold" style={{ color: "var(--toss-text-primary)" }}>쿠폰 발급</p>
                    <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 transition-colors">
                        <X className="size-4" style={{ color: "var(--toss-text-secondary)" }} />
                    </button>
                </div>

                {/* 발급할 쿠폰 정보 */}
                <div className="rounded-2xl p-3" style={{ backgroundColor: "var(--toss-page-bg)", border: "1px solid var(--toss-border)" }}>
                    <p className="text-xs font-bold mb-0.5" style={{ color: "var(--toss-text-secondary)" }}>{coupon.name}</p>
                    <p className="text-sm font-black" style={{ color: "var(--toss-blue)" }}>{discountLabel(coupon)}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: "var(--toss-text-tertiary)" }}>
                        {coupon.type === "cart" ? "장바구니 쿠폰" : "상품 쿠폰"} · 코드: {coupon.code}
                    </p>
                </div>

                {/* 회원 검색 */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4" style={{ color: "var(--toss-text-tertiary)" }} />
                    <input
                        className={inputCls}
                        style={{ ...inputStyle, paddingLeft: "2.25rem" }}
                        placeholder="이름, 이메일, 전화번호 검색"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>

                <div className="min-h-[120px] max-h-[200px] overflow-y-auto space-y-1">
                    {searching && (
                        <div className="flex justify-center py-6">
                            <Loader2 className="size-4 animate-spin" style={{ color: "var(--toss-text-tertiary)" }} />
                        </div>
                    )}
                    {!searching && results.length === 0 && query.trim() && (
                        <p className="text-xs text-center py-6" style={{ color: "var(--toss-text-tertiary)" }}>검색 결과가 없습니다.</p>
                    )}
                    {!searching && results.map((m) => (
                        <button key={m.id} onClick={() => setSelected(m)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors hover:bg-gray-50"
                            style={{
                                border:          selected?.id === m.id ? "1.5px solid var(--toss-blue)" : "1.5px solid transparent",
                                backgroundColor: selected?.id === m.id ? "var(--toss-blue-light)" : "",
                            }}>
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                                style={{ backgroundColor: "var(--toss-blue)" }}>
                                {(m.name ?? m.email)[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-semibold truncate" style={{ color: "var(--toss-text-primary)" }}>
                                    {m.name ?? "(이름 없음)"}
                                </p>
                                <p className="text-[11px] truncate" style={{ color: "var(--toss-text-tertiary)" }}>{m.email}</p>
                            </div>
                        </button>
                    ))}
                </div>

                {error && <p className="text-xs font-medium" style={{ color: "var(--toss-red)" }}>{error}</p>}

                <div className="flex gap-2 pt-1">
                    <button onClick={onClose}
                        className="flex-1 py-2.5 rounded-2xl text-sm font-semibold transition-colors hover:bg-gray-100"
                        style={{ color: "var(--toss-text-secondary)", border: "1px solid var(--toss-border)" }}>
                        취소
                    </button>
                    <button onClick={handleIssue} disabled={!selected || isPending}
                        className="flex-1 py-2.5 rounded-2xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity hover:opacity-85"
                        style={{ backgroundColor: "var(--toss-blue)" }}>
                        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                        발급하기
                    </button>
                </div>
            </div>
        </div>
    )
}

// ── 좌측: 쿠폰 목록 ────────────────────────────────────────────
function CouponList({
    selected,
    onSelect,
}: {
    selected:  Coupon | null
    onSelect:  (c: Coupon) => void
}) {
    const [items, setItems]       = useState<Coupon[]>([])
    const [total, setTotal]       = useState(0)
    const [page, setPage]         = useState(1)
    const [pageSize, setPageSize] = useState(20)
    const [query, setQuery]       = useState("")
    const [loading, setLoading]   = useState(false)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetchCouponsPagedAction(page, pageSize, query)
            setItems(res.items)
            setTotal(res.total)
        } finally {
            setLoading(false)
        }
    }, [page, pageSize, query])

    useEffect(() => { load() }, [load])

    return (
        <div className="flex flex-col gap-4 h-full">
            {/* 검색 */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4" style={{ color: "var(--toss-text-tertiary)" }} />
                <input
                    className="w-full rounded-2xl pl-9 pr-4 py-2.5 text-sm outline-none"
                    style={{ ...inputStyle, backgroundColor: "#fff" }}
                    placeholder="쿠폰명, 코드 검색"
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setPage(1) }}
                />
            </div>

            {/* 목록 */}
            <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
                {loading ? (
                    <div className="flex justify-center py-10">
                        <Loader2 className="size-5 animate-spin" style={{ color: "var(--toss-text-tertiary)" }} />
                    </div>
                ) : items.length === 0 ? (
                    <div className="flex flex-col items-center py-10 gap-2">
                        <Tag className="size-7 opacity-20" style={{ color: "var(--toss-text-tertiary)" }} />
                        <p className="text-sm" style={{ color: "var(--toss-text-tertiary)" }}>쿠폰이 없습니다.</p>
                    </div>
                ) : items.map((c) => {
                    const isSelected = selected?.id === c.id
                    const st = couponStatus(c)
                    return (
                        <button key={c.id} onClick={() => onSelect(c)}
                            className="w-full text-left p-4 rounded-2xl transition-all"
                            style={{
                                backgroundColor: isSelected ? "var(--toss-blue-light)" : "#fff",
                                border:          isSelected ? "1.5px solid var(--toss-blue)" : "1.5px solid var(--toss-border)",
                            }}>
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                                <p className="text-sm font-bold leading-snug" style={{ color: "var(--toss-text-primary)" }}>
                                    {c.name}
                                </p>
                                <Badge color={st.color}>{st.label}</Badge>
                            </div>
                            <p className="text-xs font-black mb-1" style={{ color: "var(--toss-blue)" }}>
                                {discountLabel(c)}
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                                <Badge color={c.type === "cart" ? "blue" : "purple"}>
                                    {c.type === "cart" ? "장바구니" : "상품"}
                                </Badge>
                                <span className="text-[10px] font-mono" style={{ color: "var(--toss-text-tertiary)" }}>
                                    {c.code}
                                </span>
                                <span className="text-[10px]" style={{ color: "var(--toss-text-tertiary)" }}>
                                    발급 {c.usageCount}{c.usageLimit !== null ? `/${c.usageLimit}` : ""}회
                                </span>
                            </div>
                        </button>
                    )
                })}
            </div>

            {/* 페이지네이션 */}
            <AdminPagination
                page={page} pageSize={pageSize} total={total}
                pageSizeId="select-coupon-issuance-list-pagesize"
                onPageChange={(p) => setPage(p)}
                onSizeChange={(s) => { setPageSize(s); setPage(1) }}
            />
        </div>
    )
}

// ── 우측: 발급 내역 ─────────────────────────────────────────────
function IssuancePanel({
    coupon,
    refreshKey,
    onIssue,
}: {
    coupon:     Coupon
    refreshKey: number
    onIssue:    () => void
}) {
    const [items, setItems]       = useState<CouponIssuance[]>([])
    const [total, setTotal]       = useState(0)
    const [page, setPage]         = useState(1)
    const [pageSize, setPageSize] = useState(20)
    const [loading, setLoading]   = useState(false)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetchCouponIssuancesPagedAction(coupon.id, page, pageSize)
            setItems(res.items)
            setTotal(res.total)
        } finally {
            setLoading(false)
        }
    }, [coupon.id, page, pageSize])

    // 쿠폰 변경 또는 발급 후 새로고침
    useEffect(() => { setPage(1) }, [coupon.id])
    useEffect(() => { load() }, [load, refreshKey])

    const st = couponStatus(coupon)

    return (
        <div className="flex flex-col gap-5 h-full">
            {/* 선택된 쿠폰 요약 카드 */}
            <div className="rounded-2xl p-5" style={{ backgroundColor: "#fff", border: "1px solid var(--toss-border)" }}>
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <Badge color={st.color}>{st.label}</Badge>
                            <Badge color={coupon.type === "cart" ? "blue" : "purple"}>
                                {coupon.type === "cart" ? "장바구니" : "상품"}
                            </Badge>
                        </div>
                        <p className="text-base font-black" style={{ color: "var(--toss-text-primary)" }}>
                            {coupon.name}
                        </p>
                        <p className="text-sm font-bold mt-0.5" style={{ color: "var(--toss-blue)" }}>
                            {discountLabel(coupon)}
                        </p>
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                            <span className="text-xs font-mono px-2 py-0.5 rounded-lg"
                                style={{ backgroundColor: "var(--toss-page-bg)", color: "var(--toss-text-secondary)", border: "1px solid var(--toss-border)" }}>
                                {coupon.code}
                            </span>
                            {coupon.minOrderAmount > 0 && (
                                <span className="text-xs" style={{ color: "var(--toss-text-tertiary)" }}>
                                    {coupon.minOrderAmount.toLocaleString()}원 이상 구매 시
                                </span>
                            )}
                            <span className="text-xs" style={{ color: "var(--toss-text-tertiary)" }}>
                                {new Date(coupon.validFrom).toLocaleDateString("ko-KR")} ~{" "}
                                {new Date(coupon.validUntil).toLocaleDateString("ko-KR")}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onIssue}
                        className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold text-white flex-shrink-0 hover:opacity-85 transition-opacity"
                        style={{ backgroundColor: "var(--toss-blue)" }}>
                        <Send className="size-4" />
                        발급하기
                    </button>
                </div>

                {/* 발급 현황 요약 */}
                <div className="grid grid-cols-3 gap-3 mt-4">
                    {[
                        { label: "총 발급",   value: total,                                            icon: <Users className="size-4" />,         color: "var(--toss-blue)" },
                        { label: "사용 완료", value: items.filter((i) => i.isUsed).length,             icon: <CheckCircle2 className="size-4" />,   color: "#00A878" },
                        { label: "미사용",    value: items.filter((i) => !i.isUsed).length,            icon: <Clock className="size-4" />,          color: "#F59E0B" },
                    ].map((stat) => (
                        <div key={stat.label} className="rounded-xl p-3 text-center"
                            style={{ backgroundColor: "var(--toss-page-bg)", border: "1px solid var(--toss-border)" }}>
                            <div className="flex justify-center mb-1" style={{ color: stat.color }}>{stat.icon}</div>
                            <p className="text-lg font-black" style={{ color: stat.color }}>{stat.value}</p>
                            <p className="text-[10px]" style={{ color: "var(--toss-text-tertiary)" }}>{stat.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* 발급 회원 목록 */}
            <div className="flex-1 flex flex-col gap-3 min-h-0">
                <p className="text-sm font-bold" style={{ color: "var(--toss-text-primary)" }}>
                    발급 회원 목록 <span className="font-normal text-xs" style={{ color: "var(--toss-text-tertiary)" }}>총 {total}명</span>
                </p>

                <div className="flex-1 overflow-hidden rounded-2xl" style={{ border: "1px solid var(--toss-border)" }}>
                    {loading ? (
                        <div className="flex justify-center py-12 bg-white">
                            <Loader2 className="size-5 animate-spin" style={{ color: "var(--toss-text-tertiary)" }} />
                        </div>
                    ) : items.length === 0 ? (
                        <div className="flex flex-col items-center py-12 gap-2 bg-white">
                            <TicketX className="size-8 opacity-20" style={{ color: "var(--toss-text-tertiary)" }} />
                            <p className="text-sm" style={{ color: "var(--toss-text-tertiary)" }}>아직 발급된 회원이 없습니다.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto bg-white h-full">
                            <table className="w-full text-sm">
                                <thead style={{ borderBottom: "1px solid var(--toss-border)" }}>
                                    <tr>
                                        {["회원", "연락처", "발급일", "사용 여부"].map((h) => (
                                            <th key={h} className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap"
                                                style={{ color: "var(--toss-text-tertiary)" }}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, i) => (
                                        <tr key={item.id} className="hover:bg-gray-50 transition-colors"
                                            style={{ borderBottom: i < items.length - 1 ? "1px solid var(--toss-border)" : undefined }}>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                                                        style={{ backgroundColor: "var(--toss-blue)" }}>
                                                        {(item.userName ?? item.email)[0].toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-semibold truncate" style={{ color: "var(--toss-text-primary)" }}>
                                                            {item.userName ?? "(이름 없음)"}
                                                        </p>
                                                        <p className="text-[10px] truncate" style={{ color: "var(--toss-text-tertiary)" }}>
                                                            {item.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-xs" style={{ color: "var(--toss-text-secondary)" }}>
                                                {item.phone ?? "-"}
                                            </td>
                                            <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "var(--toss-text-secondary)" }}>
                                                {new Date(item.issuedAt).toLocaleDateString("ko-KR")}
                                                <p className="text-[10px]" style={{ color: "var(--toss-text-tertiary)" }}>
                                                    {new Date(item.issuedAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3">
                                                {item.isUsed ? (
                                                    <div>
                                                        <Badge color="green">사용 완료</Badge>
                                                        {item.usedAt && (
                                                            <p className="text-[10px] mt-0.5" style={{ color: "var(--toss-text-tertiary)" }}>
                                                                {new Date(item.usedAt).toLocaleDateString("ko-KR")}
                                                            </p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <Badge color="gray">미사용</Badge>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <AdminPagination
                    page={page} pageSize={pageSize} total={total}
                    pageSizeId="select-coupon-issuance-detail-pagesize"
                    onPageChange={(p) => setPage(p)}
                    onSizeChange={(s) => { setPageSize(s); setPage(1) }}
                />
            </div>
        </div>
    )
}

// ── 메인 컴포넌트 ──────────────────────────────────────────────
export default function CouponIssuanceClient() {
    const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null)
    const [issueModalOpen, setIssueModalOpen] = useState(false)
    const [refreshKey, setRefreshKey]         = useState(0)

    const handleIssued = () => setRefreshKey((k) => k + 1)

    return (
        <div data-ui-id="page-admin-coupon-issuance" className="flex gap-6 h-[calc(100vh-2rem)] p-7">
            {/* 좌: 쿠폰 목록 */}
            <div className="w-80 flex-shrink-0 flex flex-col gap-4">
                <div>
                    <h1 className="text-xl font-black" style={{ color: "var(--toss-text-primary)", letterSpacing: "-0.03em" }}>
                        쿠폰 발급
                    </h1>
                    <p className="text-sm mt-0.5" style={{ color: "var(--toss-text-secondary)" }}>
                        쿠폰을 선택하면 발급 내역을 확인할 수 있습니다.
                    </p>
                </div>
                <CouponList selected={selectedCoupon} onSelect={setSelectedCoupon} />
            </div>

            {/* 우: 발급 내역 */}
            <div className="flex-1 min-w-0">
                {selectedCoupon ? (
                    <IssuancePanel
                        coupon={selectedCoupon}
                        refreshKey={refreshKey}
                        onIssue={() => setIssueModalOpen(true)}
                    />
                ) : (
                    <div className="h-full flex flex-col items-center justify-center gap-3 rounded-2xl"
                        style={{ border: "2px dashed var(--toss-border)" }}>
                        <Tag className="size-10 opacity-20" style={{ color: "var(--toss-text-tertiary)" }} />
                        <p className="text-sm font-semibold" style={{ color: "var(--toss-text-tertiary)" }}>
                            좌측에서 쿠폰을 선택해주세요.
                        </p>
                    </div>
                )}
            </div>

            {/* 발급 모달 */}
            {issueModalOpen && selectedCoupon && (
                <IssueModal
                    coupon={selectedCoupon}
                    onClose={() => setIssueModalOpen(false)}
                    onIssued={handleIssued}
                />
            )}
        </div>
    )
}
