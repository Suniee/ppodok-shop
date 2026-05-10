"use client"

import { TrendingUp, TrendingDown, ShoppingCart, Users, CreditCard, BarChart3 } from "lucide-react"
import { kpis, monthlyRevenue, recentOrders } from "@/lib/data/orders"

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
function RevenueChart() {
  const max = Math.max(...monthlyRevenue.map((d) => d.revenue))
  const W = 480, H = 160, PAD = 20

  const pts = monthlyRevenue.map((d, i) => ({
    x: PAD + (i * (W - PAD * 2)) / (monthlyRevenue.length - 1),
    y: H - PAD - ((d.revenue / max) * (H - PAD * 2)),
    ...d,
  }))

  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ")
  const areaD = `${pathD} L${pts[pts.length - 1].x},${H} L${pts[0].x},${H} Z`

  return (
    <div className="bg-white rounded-2xl p-6" style={{ border: "1px solid var(--toss-border)" }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm font-medium mb-0.5" style={{ color: "var(--toss-text-secondary)" }}>월별 매출</p>
          <p className="text-xl font-black" style={{ color: "var(--toss-text-primary)", letterSpacing: "-0.03em" }}>
            {(kpis.monthlyRevenue / 10000).toLocaleString()}만원
            <span className="text-xs font-medium ml-1.5 text-emerald-500">+{kpis.revenueGrowth}%</span>
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
        {monthlyRevenue.map((d) => (
          <div key={d.month} className="text-center">
            <p className="text-[11px] font-medium" style={{ color: "var(--toss-text-tertiary)" }}>{d.month}</p>
            <p className="text-[10px] font-semibold mt-0.5" style={{ color: "var(--toss-text-secondary)" }}>
              {(d.revenue / 10000).toLocaleString()}만
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Recent Orders ────────────────────────────────────────── */
const statusStyle: Record<string, { bg: string; color: string }> = {
  결제완료: { bg: "#EBF3FF", color: "#0064FF" },
  배송중:   { bg: "#FFF8E1", color: "#FFB800" },
  배송완료: { bg: "#E8F8F5", color: "#00A878" },
  취소:     { bg: "#FFF0F0", color: "#FF4E4E" },
}

function RecentOrders() {
  return (
    <div className="bg-white rounded-2xl" style={{ border: "1px solid var(--toss-border)" }}>
      <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--toss-border)" }}>
        <p className="text-sm font-bold" style={{ color: "var(--toss-text-primary)" }}>최근 주문</p>
        <a href="#" className="text-xs font-medium" style={{ color: "var(--toss-blue)" }}>전체보기</a>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--toss-border)" }}>
              {["주문번호", "회원", "상품", "금액", "상태", "날짜"].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold whitespace-nowrap" style={{ color: "var(--toss-text-tertiary)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((o, i) => {
              const s = statusStyle[o.status]
              return (
                <tr
                  key={o.id}
                  style={{ borderBottom: i < recentOrders.length - 1 ? "1px solid var(--toss-border)" : undefined }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-5 py-3 font-mono text-xs" style={{ color: "var(--toss-text-secondary)" }}>{o.id}</td>
                  <td className="px-5 py-3 font-semibold text-xs" style={{ color: "var(--toss-text-primary)" }}>{o.memberName}</td>
                  <td className="px-5 py-3 text-xs max-w-[180px] truncate" style={{ color: "var(--toss-text-secondary)" }}>{o.product}</td>
                  <td className="px-5 py-3 font-bold text-xs" style={{ color: "var(--toss-text-primary)" }}>
                    {o.amount.toLocaleString()}원
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: s.bg, color: s.color }}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs" style={{ color: "var(--toss-text-tertiary)" }}>{o.createdAt}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ── Page ─────────────────────────────────────────────────── */
export default function DashboardPage() {
  return (
    <div className="p-7 space-y-5">
      <div>
        <h1 className="text-xl font-black" style={{ color: "var(--toss-text-primary)", letterSpacing: "-0.03em" }}>대시보드</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--toss-text-secondary)" }}>2026년 4월 기준 매출 현황입니다.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="이번달 매출" value={(kpis.monthlyRevenue / 10000).toLocaleString()} unit="만원" growth={kpis.revenueGrowth} icon={CreditCard} color="#0064FF" />
        <KpiCard label="총 주문수"   value={kpis.monthlyOrders.toLocaleString()}                   unit="건"   growth={kpis.ordersGrowth}  icon={ShoppingCart} color="#00A878" />
        <KpiCard label="신규 회원"   value={kpis.newMembers.toLocaleString()}                       unit="명"   growth={kpis.membersGrowth} icon={Users}        color="#FFB800" />
        <KpiCard label="평균 주문액" value={kpis.avgOrderAmount.toLocaleString()}                   unit="원"   growth={kpis.avgGrowth}     icon={BarChart3}    color="#C9006B" />
      </div>

      {/* Chart */}
      <RevenueChart />

      {/* Orders */}
      <RecentOrders />
    </div>
  )
}
