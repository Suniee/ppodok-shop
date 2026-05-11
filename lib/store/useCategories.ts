"use client"

import { useState, useEffect } from "react"
import { type Category } from "@/lib/data/categories"
import { fetchCategories } from "@/lib/supabase/categories"

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    fetchCategories().then((cats) => {
      setCategories(cats)
      setMounted(true)
    })
  }, [])

  return { categories, setCategories, mounted }
}
