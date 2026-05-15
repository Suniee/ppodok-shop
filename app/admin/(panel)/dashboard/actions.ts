"use server"

import { createAdminClient } from "@/lib/supabase/admin"

function kstMonthRange(year: number, month: number) {
    const pad  = (n: number) => String(n).padStart(2, "0")
    const last = new Date(year, month, 0).getDate()
    return {
        start: `${year}-${pad(month)}-01T00:00:00+09:00`,
        end:   `${year}-${pad(month)}-${pad(last)}T23:59:59+09:00`,
    }
}

function growthRate(cur: number, prev: number) {
    if (prev === 0) return cur > 0 ? 100 : 0
    return Math.round(((cur - prev) / prev) * 1000) / 10
}

export type DashboardKpi = {
    monthlyRevenue: number
    monthlyOrders:  number
    newMembers:     number
    avgOrderAmount: number
    revenueGrowth:  number
    ordersGrowth:   number
    membersGrowth:  number
    avgGrowth:      number
}

export type MonthlyBar = {
    month:   string
    revenue: number
    orders:  number
}

export type RecentOrder = {
    id:           string
    recipientName: string
    itemsSummary:  string
    totalPrice:    number
    status:        string
    createdAt:     string
}

export type DashboardData = {
    kpis:           DashboardKpi
    monthlyRevenue: MonthlyBar[]
    recentOrders:   RecentOrder[]
}

export async function fetchDashboardData(): Promise<DashboardData> {
    const admin = createAdminClient()
    const now   = new Date()

    // KST 기준 현재 연/월
    const kstNow   = new Date(now.getTime() + 9 * 60 * 60 * 1000)
    const year     = kstNow.getUTCFullYear()
    const month    = kstNow.getUTCMonth() + 1

    const prevMonth = month === 1 ? 12 : month - 1
    const prevYear  = month === 1 ? year - 1 : year

    const thisRange = kstMonthRange(year, month)
    const prevRange = kstMonthRange(prevYear, prevMonth)

    // 6개월 전 시작일 (이번달 포함)
    let sixM = month - 5, sixY = year
    if (sixM <= 0) { sixM += 12; sixY -= 1 }
    const sixMonthStart = kstMonthRange(sixY, sixM).start

    const [
        thisDelivered, prevDelivered,
        thisMem, prevMem,
        allDelivered,
        recentRows,
    ] = await Promise.all([
        // 이번달 배송완료 주문 (매출 + 건수 동시 집계)
        admin.from("orders").select("total_price")
            .eq("status", "delivered").gte("created_at", thisRange.start).lte("created_at", thisRange.end),
        // 전달 배송완료 주문
        admin.from("orders").select("total_price")
            .eq("status", "delivered").gte("created_at", prevRange.start).lte("created_at", prevRange.end),
        // 이번달 신규 회원
        admin.from("profiles").select("id", { count: "exact", head: true })
            .eq("role", "customer").gte("created_at", thisRange.start).lte("created_at", thisRange.end),
        // 전달 신규 회원
        admin.from("profiles").select("id", { count: "exact", head: true })
            .eq("role", "customer").gte("created_at", prevRange.start).lte("created_at", prevRange.end),
        // 6개월치 배송완료 주문 (월별 차트용)
        admin.from("orders").select("total_price, created_at")
            .eq("status", "delivered").gte("created_at", sixMonthStart),
        // 최근 주문 10건 (상태 무관)
        admin.from("orders")
            .select("id, recipient_name, total_price, status, created_at, order_items(product_name)")
            .order("created_at", { ascending: false })
            .limit(10),
    ])

    const thisRows    = thisDelivered.data ?? []
    const prevRows    = prevDelivered.data ?? []
    const thisRevenue = thisRows.reduce((s, o) => s + o.total_price, 0)
    const prevRevenue = prevRows.reduce((s, o) => s + o.total_price, 0)
    const thisOrders  = thisRows.length
    const prevOrders  = prevRows.length
    const thisMembers = thisMem.count ?? 0
    const prevMembers = prevMem.count ?? 0
    const thisAvg     = thisOrders > 0 ? Math.round(thisRevenue / thisOrders) : 0
    const prevAvg     = prevOrders > 0 ? Math.round(prevRevenue / prevOrders) : 0

    // 월별 집계 (UTC→KST 변환 후 연-월 키로 집계)
    const revMap = new Map<string, number>()
    const ordMap = new Map<string, number>()

    for (const o of allDelivered.data ?? []) {
        if (!o.created_at) continue
        const kst = new Date(new Date(o.created_at).getTime() + 9 * 60 * 60 * 1000)
        const key = `${kst.getUTCFullYear()}-${kst.getUTCMonth() + 1}`
        revMap.set(key, (revMap.get(key) ?? 0) + o.total_price)
        ordMap.set(key, (ordMap.get(key) ?? 0) + 1)
    }

    const monthlyRevenue: MonthlyBar[] = []
    for (let i = 5; i >= 0; i--) {
        let m = month - i, y = year
        if (m <= 0) { m += 12; y -= 1 }
        const key = `${y}-${m}`
        monthlyRevenue.push({ month: `${m}월`, revenue: revMap.get(key) ?? 0, orders: ordMap.get(key) ?? 0 })
    }

    // 최근 주문
    const recentOrders: RecentOrder[] = ((recentRows.data ?? []) as Record<string, unknown>[]).map((o) => {
        const items   = (o.order_items as { product_name: string }[]) ?? []
        const first   = items[0]?.product_name ?? "상품"
        return {
            id:            o.id as string,
            recipientName: (o.recipient_name as string) ?? "-",
            itemsSummary:  items.length > 1 ? `${first} 외 ${items.length - 1}건` : first,
            totalPrice:    (o.total_price as number) ?? 0,
            status:        o.status as string,
            createdAt:     o.created_at as string,
        }
    })

    return {
        kpis: {
            monthlyRevenue: thisRevenue,
            monthlyOrders:  thisOrders,
            newMembers:     thisMembers,
            avgOrderAmount: thisAvg,
            revenueGrowth:  growthRate(thisRevenue, prevRevenue),
            ordersGrowth:   growthRate(thisOrders, prevOrders),
            membersGrowth:  growthRate(thisMembers, prevMembers),
            avgGrowth:      growthRate(thisAvg, prevAvg),
        },
        monthlyRevenue,
        recentOrders,
    }
}
