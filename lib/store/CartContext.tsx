"use client"

import { createContext, useContext, useReducer, useEffect, useState, useCallback } from "react"
import { type Product } from "@/lib/data/products"

export type CartItem = {
    product: Product
    quantity: number
}

type CartState = {
    items: CartItem[]
    isOpen: boolean
}

type CartAction =
    | { type: "ADD"; product: Product }
    | { type: "REMOVE"; id: string }
    | { type: "UPDATE_QTY"; id: string; qty: number }
    | { type: "CLEAR" }
    | { type: "OPEN" }
    | { type: "CLOSE" }
    | { type: "HYDRATE"; items: CartItem[] }

function reducer(state: CartState, action: CartAction): CartState {
    switch (action.type) {
        case "ADD": {
            const existing = state.items.find((i) => i.product.id === action.product.id)
            if (existing) {
                return {
                    ...state,
                    items: state.items.map((i) =>
                        i.product.id === action.product.id
                            ? { ...i, quantity: i.quantity + 1 }
                            : i
                    ),
                }
            }
            return { ...state, items: [...state.items, { product: action.product, quantity: 1 }] }
        }
        case "REMOVE":
            return { ...state, items: state.items.filter((i) => i.product.id !== action.id) }
        case "UPDATE_QTY":
            if (action.qty <= 0) {
                return { ...state, items: state.items.filter((i) => i.product.id !== action.id) }
            }
            return {
                ...state,
                items: state.items.map((i) =>
                    i.product.id === action.id ? { ...i, quantity: action.qty } : i
                ),
            }
        case "CLEAR":
            return { ...state, items: [] }
        case "OPEN":
            return { ...state, isOpen: true }
        case "CLOSE":
            return { ...state, isOpen: false }
        case "HYDRATE":
            return { ...state, items: action.items }
        default:
            return state
    }
}

type CartContextValue = {
    items: CartItem[]
    isOpen: boolean
    totalCount: number
    totalPrice: number
    addItem: (product: Product) => void
    removeItem: (id: string) => void
    updateQuantity: (id: string, qty: number) => void
    clearCart: () => void
    openCart: () => void
    closeCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

const STORAGE_KEY = "cart_items"

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(reducer, { items: [], isOpen: false })
    const [hydrated, setHydrated] = useState(false)

    // localStorage에서 복원
    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY)
            if (raw) dispatch({ type: "HYDRATE", items: JSON.parse(raw) })
        } catch { /* 손상된 데이터 무시 */ }
        setHydrated(true)
    }, [])

    // 변경 시 localStorage에 저장
    useEffect(() => {
        if (!hydrated) return
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items))
    }, [state.items, hydrated])

    const addItem    = useCallback((product: Product) => dispatch({ type: "ADD", product }), [])
    const removeItem = useCallback((id: string) => dispatch({ type: "REMOVE", id }), [])
    const updateQuantity = useCallback((id: string, qty: number) => dispatch({ type: "UPDATE_QTY", id, qty }), [])
    const clearCart  = useCallback(() => dispatch({ type: "CLEAR" }), [])
    const openCart   = useCallback(() => dispatch({ type: "OPEN" }), [])
    const closeCart  = useCallback(() => dispatch({ type: "CLOSE" }), [])

    const totalCount = state.items.reduce((s, i) => s + i.quantity, 0)
    const totalPrice = state.items.reduce((s, i) => s + i.product.price * i.quantity, 0)

    return (
        <CartContext.Provider value={{
            items: state.items, isOpen: state.isOpen,
            totalCount, totalPrice,
            addItem, removeItem, updateQuantity, clearCart,
            openCart, closeCart,
        }}>
            {children}
        </CartContext.Provider>
    )
}

export function useCart() {
    const ctx = useContext(CartContext)
    if (!ctx) throw new Error("useCart must be used inside CartProvider")
    return ctx
}
