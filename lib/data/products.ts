export type Product = {
  id: string
  name: string
  price: number
  originalPrice?: number
  category: string
  categorySlug: string
  emoji: string
  bgColor: string
  isNew?: boolean
  isBest?: boolean
  badge?: string
}

export const products: Product[] = [
  {
    id: "1",
    name: "자연 문디어덱스청크(뷰티) 250ml",
    price: 4500,
    originalPrice: 6000,
    category: "뷰티/화장품",
    categorySlug: "beauty",
    emoji: "🧴",
    bgColor: "bg-pink-50",
    isNew: true,
  },
  {
    id: "2",
    name: "자연 디즈펙트소금 500g",
    price: 3000,
    category: "주방용품",
    categorySlug: "kitchen",
    emoji: "🧂",
    bgColor: "bg-blue-50",
    isNew: true,
  },
  {
    id: "3",
    name: "자연 트래빈 스무디 750ml",
    price: 2500,
    category: "식품류",
    categorySlug: "food",
    emoji: "🥤",
    bgColor: "bg-green-50",
    isNew: true,
  },
  {
    id: "4",
    name: "자연 쉐이크 엘레비안 800ml",
    price: 1800,
    category: "식품류",
    categorySlug: "food",
    emoji: "🫙",
    bgColor: "bg-yellow-50",
    isNew: true,
  },
  {
    id: "5",
    name: "자연 코라탑세트",
    price: 6000,
    originalPrice: 8000,
    category: "기타용품",
    categorySlug: "etc",
    emoji: "🎁",
    bgColor: "bg-purple-50",
    isNew: true,
  },
  {
    id: "6",
    name: "자연 두정소금 2개 세트",
    price: 7000,
    category: "주방용품",
    categorySlug: "kitchen",
    emoji: "🧂",
    bgColor: "bg-orange-50",
    isNew: true,
  },
  {
    id: "7",
    name: "2080크림칫솔 90g",
    price: 1200,
    category: "생활용품",
    categorySlug: "life",
    emoji: "🪥",
    bgColor: "bg-cyan-50",
    isNew: true,
  },
  {
    id: "8",
    name: "2080스크럽치약 팩트",
    price: 2200,
    originalPrice: 3000,
    category: "생활용품",
    categorySlug: "life",
    emoji: "🦷",
    bgColor: "bg-teal-50",
    isNew: true,
  },
  {
    id: "9",
    name: "프리미엄 향수 50ml",
    price: 16000,
    category: "뷰티/화장품",
    categorySlug: "beauty",
    emoji: "🌸",
    bgColor: "bg-rose-50",
    isBest: true,
    badge: "BEST",
  },
  {
    id: "10",
    name: "천연 세탁세제 1.5L",
    price: 8500,
    originalPrice: 12000,
    category: "세제/세탁용품",
    categorySlug: "detergent",
    emoji: "🫧",
    bgColor: "bg-blue-50",
    isBest: true,
    badge: "BEST",
  },
  {
    id: "11",
    name: "바이오 주방세제 500ml",
    price: 3500,
    category: "세제류",
    categorySlug: "cleaner",
    emoji: "🧽",
    bgColor: "bg-lime-50",
    isBest: true,
    badge: "BEST",
  },
  {
    id: "12",
    name: "스포츠 물병 700ml",
    price: 5500,
    originalPrice: 7000,
    category: "스포츠/레저용품",
    categorySlug: "sports",
    emoji: "🍶",
    bgColor: "bg-indigo-50",
    isBest: true,
    badge: "SALE",
  },
]

export const newArrivals = products.filter((p) => p.isNew)
export const bestItems = products.filter((p) => p.isBest)
