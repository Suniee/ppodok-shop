"use client"

import { motion, AnimatePresence } from "framer-motion"
import { X, Trash2, ShoppingBag, Plus, Minus } from "lucide-react"
import { useCart } from "@/lib/store/CartContext"

export default function CartDrawer() {
    const { items, isOpen, totalCount, totalPrice, removeItem, updateQuantity, clearCart, closeCart } = useCart()

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* 딤 배경 */}
                    <motion.div
                        key="cart-dim"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
                        onClick={closeCart}
                    />

                    {/* 드로어 */}
                    <motion.div
                        key="cart-drawer"
                        data-ui-id="drawer-cart"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 350, damping: 35 }}
                        className="fixed right-0 top-0 h-full z-50 flex flex-col bg-white shadow-2xl"
                        style={{ width: "min(420px, 100vw)" }}
                    >
                        {/* 헤더 */}
                        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid var(--toss-border)" }}>
                            <div className="flex items-center gap-2">
                                <p className="text-base font-bold" style={{ color: "var(--toss-text-primary)" }}>
                                    장바구니
                                </p>
                                {totalCount > 0 && (
                                    <span
                                        className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
                                        style={{ backgroundColor: "var(--toss-blue)" }}
                                    >
                                        {totalCount}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                {items.length > 0 && (
                                    <button
                                        onClick={clearCart}
                                        className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors hover:bg-red-50"
                                        style={{ color: "var(--toss-red)" }}
                                    >
                                        전체삭제
                                    </button>
                                )}
                                <button
                                    onClick={closeCart}
                                    className="p-1.5 rounded-xl transition-colors hover:bg-gray-100"
                                >
                                    <X className="size-4" style={{ color: "var(--toss-text-secondary)" }} />
                                </button>
                            </div>
                        </div>

                        {/* 상품 목록 */}
                        <div className="flex-1 overflow-y-auto">
                            {items.length === 0 ? (
                                <div
                                    className="flex flex-col items-center justify-center h-full gap-3 pb-16"
                                    style={{ color: "var(--toss-text-tertiary)" }}
                                >
                                    <ShoppingBag className="size-12 opacity-30" />
                                    <p className="text-sm font-medium">장바구니가 비어있어요</p>
                                </div>
                            ) : (
                                <ul className="px-6 py-4 space-y-4">
                                    <AnimatePresence initial={false}>
                                        {items.map((item) => {
                                            const discount = item.product.originalPrice
                                                ? Math.round(((item.product.originalPrice - item.product.price) / item.product.originalPrice) * 100)
                                                : null

                                            return (
                                                <motion.li
                                                    key={item.product.id}
                                                    layout
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: "auto" }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="flex gap-3 py-1"
                                                >
                                                    {/* 상품 이미지/이모지 */}
                                                    <div
                                                        className="w-16 h-16 rounded-2xl flex-shrink-0 flex items-center justify-center overflow-hidden text-2xl"
                                                        style={{ backgroundColor: "var(--toss-page-bg)" }}
                                                    >
                                                        {item.product.images && item.product.images.length > 0 ? (
                                                            <img
                                                                src={item.product.images[0]}
                                                                alt={item.product.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            item.product.emoji
                                                        )}
                                                    </div>

                                                    {/* 상품 정보 */}
                                                    <div className="flex-1 min-w-0">
                                                        <p
                                                            className="text-sm font-semibold line-clamp-1 mb-0.5"
                                                            style={{ color: "var(--toss-text-primary)" }}
                                                        >
                                                            {item.product.name}
                                                        </p>
                                                        <div className="flex items-baseline gap-1.5 mb-2">
                                                            {discount && (
                                                                <span className="text-xs font-bold" style={{ color: "var(--toss-red)" }}>
                                                                    {discount}%
                                                                </span>
                                                            )}
                                                            <span className="text-sm font-black" style={{ color: "var(--toss-text-primary)" }}>
                                                                {(item.product.price * item.quantity).toLocaleString()}원
                                                            </span>
                                                            {item.quantity > 1 && (
                                                                <span className="text-xs" style={{ color: "var(--toss-text-tertiary)" }}>
                                                                    ({item.product.price.toLocaleString()}원 × {item.quantity})
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* 수량 조절 */}
                                                        <div className="flex items-center gap-2">
                                                            <div
                                                                className="flex items-center rounded-xl overflow-hidden"
                                                                style={{ border: "1px solid var(--toss-border)" }}
                                                            >
                                                                <button
                                                                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                                                    className="w-7 h-7 flex items-center justify-center transition-colors hover:bg-gray-50"
                                                                    style={{ color: "var(--toss-text-secondary)" }}
                                                                >
                                                                    <Minus className="size-3" />
                                                                </button>
                                                                <span
                                                                    className="w-7 text-center text-sm font-semibold"
                                                                    style={{ color: "var(--toss-text-primary)" }}
                                                                >
                                                                    {item.quantity}
                                                                </span>
                                                                <button
                                                                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                                                    className="w-7 h-7 flex items-center justify-center transition-colors hover:bg-gray-50"
                                                                    style={{ color: "var(--toss-text-secondary)" }}
                                                                >
                                                                    <Plus className="size-3" />
                                                                </button>
                                                            </div>
                                                            <button
                                                                onClick={() => removeItem(item.product.id)}
                                                                className="p-1.5 rounded-xl transition-colors hover:bg-red-50"
                                                                style={{ color: "var(--toss-text-tertiary)" }}
                                                            >
                                                                <Trash2 className="size-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </motion.li>
                                            )
                                        })}
                                    </AnimatePresence>
                                </ul>
                            )}
                        </div>

                        {/* 하단 결제 영역 */}
                        {items.length > 0 && (
                            <div className="px-6 py-5 space-y-3" style={{ borderTop: "1px solid var(--toss-border)" }}>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm" style={{ color: "var(--toss-text-secondary)" }}>
                                        총 {totalCount}개 상품
                                    </span>
                                    <span className="text-lg font-black" style={{ color: "var(--toss-text-primary)" }}>
                                        {totalPrice.toLocaleString()}원
                                    </span>
                                </div>
                                <a
                                    href="/order"
                                    data-ui-id="btn-cart-checkout"
                                    onClick={closeCart}
                                    className="w-full py-4 rounded-2xl text-sm font-bold text-white transition-opacity hover:opacity-85 flex items-center justify-center"
                                    style={{ backgroundColor: "var(--toss-blue)" }}
                                >
                                    주문하기
                                </a>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
