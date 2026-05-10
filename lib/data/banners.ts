export type Banner = {
  id: string
  title: string
  subtitle: string
  tag: string
  cta: string
  link: string
  emoji: string
  bgColor: string
  textColor: string
  active: boolean
  order: number
  createdAt: string
}

export const initialBanners: Banner[] = [
  {
    id: "B001",
    title: "봄맞이 특가전",
    subtitle: "생활용품 최대 40% 할인",
    tag: "봄 특가전",
    cta: "지금 쇼핑하기",
    link: "/products",
    emoji: "🌸",
    bgColor: "#EBF3FF",
    textColor: "#0064FF",
    active: true,
    order: 1,
    createdAt: "2026-04-01",
  },
  {
    id: "B002",
    title: "주방용품 기획전",
    subtitle: "스마트한 주방을 위한 선택",
    tag: "신상품 입고",
    cta: "신상품 보기",
    link: "/category/kitchen",
    emoji: "🍳",
    bgColor: "#F0FFF4",
    textColor: "#00A878",
    active: true,
    order: 2,
    createdAt: "2026-04-05",
  },
  {
    id: "B003",
    title: "K-뷰티 기획전",
    subtitle: "피부 고민 이제 해결해요",
    tag: "K-뷰티 기획전",
    cta: "할인 상품 보기",
    link: "/category/beauty",
    emoji: "💄",
    bgColor: "#FFF0F6",
    textColor: "#C9006B",
    active: false,
    order: 3,
    createdAt: "2026-04-10",
  },
]
