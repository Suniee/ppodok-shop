import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import OrderForm from "./OrderForm"

export default async function OrderPage() {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    // 비로그인 시 로그인 페이지로 이동 (장바구니는 localStorage에 유지됨)
    if (!user) redirect("/login?next=/order")

    const admin = createAdminClient()
    const { data: profile } = await admin
        .from("profiles")
        .select("name, phone, postal_code, address, address_detail")
        .eq("id", user.id)
        .single()

    return (
        <div data-ui-id="page-order" className="max-w-5xl mx-auto px-5 py-6 pb-16">
            <div className="mb-6">
                <h1
                    className="text-2xl font-black"
                    style={{ color: "var(--toss-text-primary)", letterSpacing: "-0.03em" }}
                >
                    주문서
                </h1>
                <p className="text-sm mt-0.5" style={{ color: "var(--toss-text-secondary)" }}>
                    배송 정보와 결제 수단을 확인해주세요
                </p>
            </div>

            <OrderForm
                profile={{
                    name:          profile?.name          ?? null,
                    phone:         profile?.phone         ?? null,
                    postalCode:    profile?.postal_code   ?? null,
                    address:       profile?.address       ?? null,
                    addressDetail: profile?.address_detail ?? null,
                }}
            />
        </div>
    )
}
