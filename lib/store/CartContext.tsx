"use client"

import { createContext, useContext, useReducer, useEffect, useState, useCallback, useRef } from "react"
import { type Product } from "@/lib/data/products"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser"
import {
    fetchCartAction,
    upsertCartItemAction,
    removeCartItemAction,
    clearCartAction,
    mergeLocalCartAction,
} from "@/lib/supabase/cart"

export type CartItem = {
    product:  Product
    quantity: number
}

type CartState = {
    items:  CartItem[]
    isOpen: boolean
}

type CartAction =
    | { type: "ADD";        product: Product }
    | { type: "REMOVE";     id: string }
    | { type: "UPDATE_QTY"; id: string; qty: number }
    | { type: "CLEAR" }
    | { type: "OPEN" }
    | { type: "CLOSE" }
    | { type: "HYDRATE";    items: CartItem[] }

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
    items:          CartItem[]
    isOpen:         boolean
    totalCount:     number
    totalPrice:     number
    addItem:        (product: Product) => void
    removeItem:     (id: string) => void
    updateQuantity: (id: string, qty: number) => void
    clearCart:      () => void
    openCart:       () => void
    closeCart:      () => void
}

const CartContext = createContext<CartContextValue | null>(null)

const STORAGE_KEY = "cart_items"

function getLocalCart(): CartItem[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        return raw ? (JSON.parse(raw) as CartItem[]) : []
    } catch {
        return []
    }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch]         = useReducer(reducer, { items: [], isOpen: false })
    const [hydrated, setHydrated]   = useState(false)
    const [isLoggedIn, setIsLoggedIn] = useState(false)

    // ref로 콜백 내 최신 값에 접근 (stale closure 방지)
    const isLoggedInRef = useRef(false)
    const stateRef      = useRef(state)
    useEffect(() => { stateRef.current = state }, [state])

    useEffect(() => {
        const supabase = createSupabaseBrowserClient()

        const initCart = async () => {
            const { data: { session } } = await supabase.auth.getSession()

            if (session) {
                isLoggedInRef.current = true
                setIsLoggedIn(true)

                // 로컬 카트가 있으면 DB에 병합 (로그인 후 리다이렉트된 첫 마운트)
                const localItems = getLocalCart()
                if (localItems.length > 0) {
                    await mergeLocalCartAction(
                        localItems.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
                    )
                    localStorage.removeItem(STORAGE_KEY)
                }

                const items = await fetchCartAction()
                dispatch({ type: "HYDRATE", items })
            } else {
                isLoggedInRef.current = false
                setIsLoggedIn(false)
                const localItems = getLocalCart()
                if (localItems.length > 0) dispatch({ type: "HYDRATE", items: localItems })
            }
            setHydrated(true)
        }

        initCart()

        // 로그인/로그아웃 이벤트 구독
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === "SIGNED_IN" && session) {
                isLoggedInRef.current = true
                setIsLoggedIn(true)

                // 로컬 카트 병합 (onAuthStateChange로 로그인을 감지한 경우)
                const localItems = getLocalCart()
                if (localItems.length > 0) {
                    await mergeLocalCartAction(
                        localItems.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
                    )
                    localStorage.removeItem(STORAGE_KEY)
                }

                const items = await fetchCartAction()
                dispatch({ type: "HYDRATE", items })
            } else if (event === "SIGNED_OUT") {
                isLoggedInRef.current = false
                setIsLoggedIn(false)
                dispatch({ type: "CLEAR" })
                localStorage.removeItem(STORAGE_KEY)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    // 비로그인 시에만 localStorage에 저장
    useEffect(() => {
        if (!hydrated || isLoggedIn) return
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items))
    }, [state.items, hydrated, isLoggedIn])

    // 장바구니 조작 — 로컬 상태 즉시 반영(optimistic) 후 DB 동기화
    const addItem = useCallback((product: Product) => {
        dispatch({ type: "ADD", product })
        if (isLoggedInRef.current) {
            const prevQty = stateRef.current.items.find((i) => i.product.id === product.id)?.quantity ?? 0
            upsertCartItemAction(product.id, prevQty + 1)
        }
    }, [])

    const removeItem = useCallback((id: string) => {
        dispatch({ type: "REMOVE", id })
        if (isLoggedInRef.current) removeCartItemAction(id)
    }, [])

    const updateQuantity = useCallback((id: string, qty: number) => {
        dispatch({ type: "UPDATE_QTY", id, qty })
        if (isLoggedInRef.current) upsertCartItemAction(id, qty)
    }, [])

    const clearCart = useCallback(() => {
        dispatch({ type: "CLEAR" })
        localStorage.removeItem(STORAGE_KEY)
        if (isLoggedInRef.current) clearCartAction()
    }, [])

    const openCart  = useCallback(() => dispatch({ type: "OPEN" }),  [])
    const closeCart = useCallback(() => dispatch({ type: "CLOSE" }), [])

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

const NO_OP = () => {}
const FALLBACK_CART: CartContextValue = {
    items: [], isOpen: false, totalCount: 0, totalPrice: 0,
    addItem: NO_OP, removeItem: NO_OP, updateQuantity: NO_OP,
    clearCart: NO_OP, openCart: NO_OP, closeCart: NO_OP,
}

export function useCart() {
    const ctx = useContext(CartContext)
    return ctx ?? FALLBACK_CART
}
