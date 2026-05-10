"use client"

import { useState, useEffect, useCallback } from "react"
import { defaultCategories, type Category } from "@/lib/data/categories"

const STORAGE_KEY = "ppodok_categories"

function loadFromStorage(): Category[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultCategories
    const parsed: Category[] = JSON.parse(raw)
    // 새로 추가된 기본 카테고리가 있으면 병합
    const ids = new Set(parsed.map((c) => c.id))
    const merged = [
      ...parsed,
      ...defaultCategories.filter((c) => !ids.has(c.id)),
    ]
    return merged.sort((a, b) => a.order - b.order)
  } catch {
    return defaultCategories
  }
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>(defaultCategories)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setCategories(loadFromStorage())
    setMounted(true)
  }, [])

  const save = useCallback((next: Category[]) => {
    const sorted = [...next].sort((a, b) => a.order - b.order)
    setCategories(sorted)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted))
      // 다른 탭/창에 변경 알림
      window.dispatchEvent(new Event("ppodok_categories_updated"))
    } catch {}
  }, [])

  // 다른 탭에서 변경 시 동기화
  useEffect(() => {
    const onUpdate = () => setCategories(loadFromStorage())
    window.addEventListener("ppodok_categories_updated", onUpdate)
    window.addEventListener("storage", onUpdate)
    return () => {
      window.removeEventListener("ppodok_categories_updated", onUpdate)
      window.removeEventListener("storage", onUpdate)
    }
  }, [])

  return { categories, save, mounted }
}
