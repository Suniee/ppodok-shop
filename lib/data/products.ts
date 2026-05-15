import { type Category } from "./categories"

export type ProductCategory = Pick<Category, "id" | "name" | "slug" | "icon">

export type Product = {
  id: string
  name: string
  price: number
  originalPrice?: number
  emoji: string
  bgColor: string
  isNew?: boolean
  isBest?: boolean
  badge?: string
  isVisible?: boolean
  images?: string[]
  detailImages?: string[]
  categories: ProductCategory[]
  description?: string
}
