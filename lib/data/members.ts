export type Member = {
  id: string
  name: string
  email: string
  phone: string
  joinedAt: string
  lastLogin: string
  orderCount: number
  totalSpent: number
  status: "active" | "inactive" | "suspended"
  grade: "일반" | "실버" | "골드" | "VIP"
}

export const members: Member[] = [
  { id: "M001", name: "김민지", email: "minji.kim@email.com", phone: "010-1234-5678", joinedAt: "2024-01-05", lastLogin: "2026-05-05", orderCount: 24, totalSpent: 387000, status: "active", grade: "골드" },
  { id: "M002", name: "이서준", email: "seojun.lee@email.com", phone: "010-2345-6789", joinedAt: "2024-02-14", lastLogin: "2026-05-04", orderCount: 8, totalSpent: 124000, status: "active", grade: "실버" },
  { id: "M003", name: "박지현", email: "jihyun.park@email.com", phone: "010-3456-7890", joinedAt: "2024-03-22", lastLogin: "2026-04-28", orderCount: 52, totalSpent: 912000, status: "active", grade: "VIP" },
  { id: "M004", name: "최예린", email: "yerin.choi@email.com", phone: "010-4567-8901", joinedAt: "2024-04-10", lastLogin: "2026-05-01", orderCount: 3, totalSpent: 42000, status: "active", grade: "일반" },
  { id: "M005", name: "정우진", email: "woojin.jung@email.com", phone: "010-5678-9012", joinedAt: "2024-05-17", lastLogin: "2026-03-15", orderCount: 11, totalSpent: 198000, status: "inactive", grade: "실버" },
  { id: "M006", name: "강수연", email: "suyeon.kang@email.com", phone: "010-6789-0123", joinedAt: "2024-06-03", lastLogin: "2026-05-05", orderCount: 19, totalSpent: 334000, status: "active", grade: "골드" },
  { id: "M007", name: "윤하은", email: "haeun.yoon@email.com", phone: "010-7890-1234", joinedAt: "2024-07-20", lastLogin: "2026-04-30", orderCount: 7, totalSpent: 87000, status: "active", grade: "일반" },
  { id: "M008", name: "임도현", email: "dohyun.lim@email.com", phone: "010-8901-2345", joinedAt: "2024-08-08", lastLogin: "2026-02-20", orderCount: 2, totalSpent: 25000, status: "suspended", grade: "일반" },
  { id: "M009", name: "조아라", email: "ara.jo@email.com", phone: "010-9012-3456", joinedAt: "2024-09-15", lastLogin: "2026-05-03", orderCount: 31, totalSpent: 562000, status: "active", grade: "골드" },
  { id: "M010", name: "한지우", email: "jiwoo.han@email.com", phone: "010-0123-4567", joinedAt: "2024-10-25", lastLogin: "2026-05-04", orderCount: 6, totalSpent: 78000, status: "active", grade: "일반" },
  { id: "M011", name: "오승민", email: "seungmin.oh@email.com", phone: "010-1357-2468", joinedAt: "2024-11-12", lastLogin: "2026-04-10", orderCount: 14, totalSpent: 241000, status: "active", grade: "실버" },
  { id: "M012", name: "신채원", email: "chaewon.shin@email.com", phone: "010-2468-1357", joinedAt: "2024-12-01", lastLogin: "2026-05-02", orderCount: 9, totalSpent: 156000, status: "active", grade: "실버" },
  { id: "M013", name: "배준혁", email: "junhyuk.bae@email.com", phone: "010-3579-1357", joinedAt: "2025-01-18", lastLogin: "2026-01-05", orderCount: 1, totalSpent: 12000, status: "inactive", grade: "일반" },
  { id: "M014", name: "류소희", email: "sohee.ryu@email.com", phone: "010-4680-2468", joinedAt: "2025-02-27", lastLogin: "2026-05-05", orderCount: 43, totalSpent: 824000, status: "active", grade: "VIP" },
  { id: "M015", name: "문태양", email: "taeyang.moon@email.com", phone: "010-5791-3579", joinedAt: "2025-03-09", lastLogin: "2026-05-01", orderCount: 5, totalSpent: 63000, status: "active", grade: "일반" },
]
