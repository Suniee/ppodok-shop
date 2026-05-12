"use client"

import { useEffect } from "react"
import { useCart } from "@/lib/store/CartContext"

// 결제 완료 후 장바구니를 비우는 클라이언트 컴포넌트
export function CartClearer() {
    const { clearCart } = useCart()
    useEffect(() => { clearCart() }, []) // eslint-disable-line react-hooks/exhaustive-deps
    return null
}
