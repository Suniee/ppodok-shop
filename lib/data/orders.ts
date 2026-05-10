export type Order = {
  id: string
  memberId: string
  memberName: string
  product: string
  amount: number
  status: "결제완료" | "배송중" | "배송완료" | "취소"
  createdAt: string
}

export type MonthlyRevenue = {
  month: string
  revenue: number
  orders: number
}

export const recentOrders: Order[] = [
  { id: "ORD-2481", memberId: "M003", memberName: "박지현", product: "프리미엄 향수 50ml 외 2건", amount: 42000, status: "배송완료", createdAt: "2026-05-05" },
  { id: "ORD-2480", memberId: "M014", memberName: "류소희", product: "천연 세탁세제 1.5L", amount: 8500, status: "배송중", createdAt: "2026-05-05" },
  { id: "ORD-2479", memberId: "M001", memberName: "김민지", product: "2080크림칫솔 90g 외 1건", amount: 15700, status: "배송중", createdAt: "2026-05-04" },
  { id: "ORD-2478", memberId: "M006", memberName: "강수연", product: "자연 코라탑세트", amount: 6000, status: "결제완료", createdAt: "2026-05-04" },
  { id: "ORD-2477", memberId: "M009", memberName: "조아라", product: "스포츠 물병 700ml 외 3건", amount: 28900, status: "배송완료", createdAt: "2026-05-03" },
  { id: "ORD-2476", memberId: "M012", memberName: "신채원", product: "바이오 주방세제 500ml", amount: 3500, status: "배송완료", createdAt: "2026-05-03" },
  { id: "ORD-2475", memberId: "M004", memberName: "최예린", product: "자연 디즈펙트소금 500g", amount: 3000, status: "취소", createdAt: "2026-05-02" },
  { id: "ORD-2474", memberId: "M010", memberName: "한지우", product: "자연 트래빈 스무디 750ml 외 2건", amount: 11200, status: "배송완료", createdAt: "2026-05-02" },
]

export const monthlyRevenue: MonthlyRevenue[] = [
  { month: "11월", revenue: 18200000, orders: 892 },
  { month: "12월", revenue: 26500000, orders: 1204 },
  { month: "1월",  revenue: 15800000, orders: 743 },
  { month: "2월",  revenue: 19400000, orders: 968 },
  { month: "3월",  revenue: 21600000, orders: 1087 },
  { month: "4월",  revenue: 24850000, orders: 1284 },
]

export const kpis = {
  monthlyRevenue:  24850000,
  monthlyOrders:   1284,
  newMembers:      187,
  avgOrderAmount:  19354,
  revenueGrowth:   14.9,
  ordersGrowth:    18.1,
  membersGrowth:   8.3,
  avgGrowth:       -2.7,
}
