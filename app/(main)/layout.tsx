import { Suspense } from "react"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import SlideToast from "@/components/ui/SlideToast"
import CartDrawer from "@/components/cart/CartDrawer"
import { CartProvider } from "@/lib/store/CartContext"

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer />
      <Suspense>
        <SlideToast />
      </Suspense>
    </CartProvider>
  )
}
