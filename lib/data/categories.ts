export type Category = {
  id: string
  name: string
  slug: string
  icon: string
  active: boolean
  order: number
}

export const defaultCategories: Category[] = [
  { id: "1", name: "생활용품",      slug: "life",      icon: "🏠", active: true, order: 1 },
  { id: "2", name: "주방용품",      slug: "kitchen",   icon: "🍳", active: true, order: 2 },
  { id: "3", name: "세제/세탁용품", slug: "detergent", icon: "🧺", active: true, order: 3 },
  { id: "4", name: "세제류",        slug: "cleaner",   icon: "🧹", active: true, order: 4 },
  { id: "5", name: "식품류",        slug: "food",      icon: "🥗", active: true, order: 5 },
  { id: "6", name: "뷰티/화장품",   slug: "beauty",    icon: "💄", active: true, order: 6 },
  { id: "7", name: "스포츠/레저용품", slug: "sports",  icon: "⚽", active: true, order: 7 },
  { id: "8", name: "기타용품",      slug: "etc",       icon: "📦", active: true, order: 8 },
]

// 기존 코드와의 호환성 유지
export const categories = defaultCategories
