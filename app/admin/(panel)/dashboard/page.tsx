import { Suspense } from "react"
import { TrendingUp, TrendingDown, ShoppingCart, Users, CreditCard, BarChart3 } from "lucide-react"
import { fetchDashboardData } from "./actions"
import type { DashboardKpi, MonthlyBar, RecentOrder } from "./actions"

/* ── KPI Card ─────────────────────────────────────────────── */
function KpiCard({
    label, value, unit, growth, icon: Icon, color,
}: {
    label: string; value: string; unit: string
    growth: number; icon: React.ElementType; color: string
}) {
    const up = growth >= 0
    return (
        <div className="bg-white rounded-2xl p-5" style={{ border: "1px solid var(--toss-border)" }}>
            <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium" style={{ color: "var(--toss-text-secondary)" }}>{label}</p>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + "18" }}>
                    <Icon className="size-4" style={{ color }} />
                </div>
            </div>
            <p className="text-2xl font-black mb-1" style={{ color: "var(--toss-text-primary)", letterSpacing: "-0.03em" }}>
                {value}<span className="text-sm font-medium ml-0.5" style={{ color: "var(--toss-text-tertiary)" }}>{unit}</span>
            </p>
            <div className={`flex items-center gap-1 text-xs font-semibold ${up ? "text-emerald-500" : "text-red-500"}`}>
                {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                {up ? "+" : ""}{growth}% 전월 대비
            </div>
        </div>
    )
}

/* ── Revenue Chart (SVG) ──────────────────────────────────── */
function RevenueChart({ kpis, data }: { kpis: DashboardKpi; data: MonthlyBar[] }) {
    const max = Math.max(...data.map((d) => d.revenue), 1)
    const W = 480, H = 160, PAD = 20

    const pts = data.map((d, i) => ({
        x: PAD + (i * (W - PAD * 2)) / Math.max(data.length - 1, 1),
        y: H - PAD - ((d.revenue / max) * (H - PAD * 2)),
        ...d,
    }))

    const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")
    const areaD = `${pathD} L${pts[pts.length - 1].x.toFixed(1)},${H} L${pts[0].x.toFixed(1)},${H} Z`

    const up = kpis.revenueGrowth >= 0
    return (
        <div className="bg-white rounded-2xl p-6" style={{ border: "1px solid var(--toss-border)" }}>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <p className="text-sm font-medium mb-0.5" style={{ color: "var(--toss-text-secondary)" }}>월별 매출</p>
                    <p className="text-xl font-black" style={{ color: "var(--toss-text-primary)", letterSpacing: "-0.03em" }}>
                        {(kpis.monthlyRevenue / 10000).toLocaleString()}만원
                        <span className={`text-xs font-medium ml-1.5 ${up ? "text-emerald-500" : "text-red-500"}`}>
                            {up ? "+" : ""}{kpis.revenueGrowth}%
                        </span>
                    </p>
                </div>
                <BarChart3 className="size-5" style={{ color: "var(--toss-text-tertiary)" }} />
            </div>

            <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: "160px" }}>
                <defs>
                    <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0064FF" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#0064FF" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <path d={areaD} fill="url(#blueGrad)" />
                <path d={pathD} fill="none" stroke="#0064FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                {pts.map((p) => (
                    <circle key={p.month} cx={p.x} cy={p.y} r="4" fill="#0064FF" stroke="white" strokeWidth="2" />
                ))}
            </svg>

            <div className="flex justify-between mt-3">
                {data.map((d) => (
                    <div key={d.month} className="text-center">
                        <p className="text-[11px] font-medium" style={{ color: "var(--toss-text-tertiary)" }}>{d.month}</p>
                        <p className="text-[10px] font-semibold mt-0.5" style={{ color: "var(--toss-text-secondary)" }}>
                            {d.revenue > 0 ? `${(d.revenue / 10000).toLocaleString()}만` : "-"}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    )
}

/* ── Recent Orders ────────────────────────────────────────── */
const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
    pending:            { label: "결제 대기", bg: "#F3E8FF", color: "#9333EA" },
    confirmed:          { label: "주문 확인", bg: "#EBF3FF", color: "#0064FF" },
    shipping:           { label: "배송 중",   bg: "#FFF8E1", color: "#FFB800" },
    delivered:          { label: "배송 완료", bg: "#E8F8F5", color: "#00A878" },
    purchase_confirmed: { label: "구매 확정", bg: "#E8F8F5", color: "#059669" },
    review_written:     { label: "리뷰 작성", bg: "#F0FDF4", color: "#16A34A" },
    cancelled:          { label: "취소됨",    bg: "#FFF0F0", color: "#FF4E4E" },
}

function RecentOrders({ orders }: { orders: RecentOrder[] }) {
    return (
        <div className="bg-white rounded-2xl" style={{ border: "1px solid var(--toss-border)" }}>
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--toss-border)" }}>
                <p className="text-sm font-bold" style={{ color: "var(--toss-text-primary)" }}>최근 주문</p>
                <a href="/admin/sales" className="text-xs font-medium" style={{ color: "var(--toss-blue)" }}>전체보기</a>
            </div>
            <div className="overflow-x-auto">
                {orders.length === 0 ? (
                    <p className="px-6 py-10 text-center text-sm" style={{ color: "var(--toss-text-tertiary)" }}>주문 내역이 없습니다</p>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr style={{ borderBottom: "1px solid var(--toss-border)" }}>
                                {["주문번호", "주문자", "상품", "금액", "상태", "날짜"].map((h) => (
                                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold whitespace-nowrap" style={{ color: "var(--toss-text-tertiary)" }}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((o, i) => {
                                const s = STATUS_META[o.status] ?? { label: o.status, bg: "#F2F4F6", color: "#8B95A1" }
                                return (
                                    <tr
                                        key={o.id}
                                        style={{ borderBottom: i < orders.length - 1 ? "1px solid var(--toss-border)" : undefined }}
                                        className="hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="px-5 py-3 font-mono text-xs" style={{ color: "var(--toss-text-secondary)" }}>
                                            {o.id.slice(0, 8).toUpperCase()}
                                        </td>
                                        <td className="px-5 py-3 font-semibold text-xs" style={{ color: "var(--toss-text-primary)" }}>
                                            {o.recipientName}
                                        </td>
                                        <td className="px-5 py-3 text-xs max-w-[180px] truncate" style={{ color: "var(--toss-text-secondary)" }}>
                                            {o.itemsSummary}
                                        </td>
                                        <td className="px-5 py-3 font-bold text-xs whitespace-nowrap" style={{ color: "var(--toss-text-primary)" }}>
                                            {o.totalPrice.toLocaleString()}원
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                                                style={{ backgroundColor: s.bg, color: s.color }}>
                                                {s.label}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-xs whitespace-nowrap" style={{ color: "var(--toss-text-tertiary)" }}>
                                            {new Date(o.createdAt).toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" })}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}

/* ── Page ─────────────────────────────────────────────────── */
async function DashboardContent() {
    const { kpis, monthlyRevenue, recentOrders } = await fetchDashboardData()

    const now    = new Date()
    const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000)
    const label  = `${kstNow.getUTCFullYear()}년 ${kstNow.getUTCMonth() + 1}월 기준`

    return (
        <div data-ui-id="page-admin-dashboard" className="p-7 space-y-5">
            <div>
                <h1 className="text-xl font-black" style={{ color: "var(--toss-text-primary)", letterSpacing: "-0.03em" }}>대시보드</h1>
                <p className="text-sm mt-0.5" style={{ color: "var(--toss-text-secondary)" }}>{label} 매출 현황입니다.</p>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                <KpiCard label="이번달 매출"  value={(kpis.monthlyRevenue / 10000).toLocaleString()} unit="만원" growth={kpis.revenueGrowth} icon={CreditCard}   color="#0064FF" />
                <KpiCard label="이번달 주문수" value={kpis.monthlyOrders.toLocaleString()}             unit="건"   growth={kpis.ordersGrowth}  icon={ShoppingCart} color="#00A878" />
                <KpiCard label="이번달 신규회원" value={kpis.newMembers.toLocaleString()}               unit="명"   growth={kpis.membersGrowth} icon={Users}        color="#FFB800" />
                <KpiCard label="평균 주문액"   value={kpis.avgOrderAmount.toLocaleString()}             unit="원"   growth={kpis.avgGrowth}     icon={BarChart3}    color="#C9006B" />
            </div>

            {/* Chart */}
            <RevenueChart kpis={kpis} data={monthlyRevenue} />

            {/* Orders */}
            <RecentOrders orders={recentOrders} />
        </div>
    )
}

export default function DashboardPage() {
    return (
        <Suspense fallback={
            <div className="p-7 flex items-center justify-center min-h-[400px]">
                <p className="text-sm" style={{ color: "var(--toss-text-tertiary)" }}>데이터를 불러오는 중...</p>
            </div>
        }>
            <DashboardContent />
        </Suspense>
    )
}
