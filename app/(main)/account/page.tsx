import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import AccountForm from "./AccountForm"

export default async function AccountPage() {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    // 비로그인 상태면 로그인 페이지로 이동
    if (!user) redirect("/login")

    // 프로필 조회 (service_role 사용 — profiles RLS가 쿠키 세션 기반이라 서버에서 anon으로 읽으면 실패할 수 있음)
    const admin = createAdminClient()
    const { data: profile } = await admin
        .from("profiles")
        .select("email, name, phone, postal_code, address, address_detail")
        .eq("id", user.id)
        .single()

    // 프로필이 없으면(트리거 미실행 등) 기본값으로 생성
    const safeProfile = profile ?? {
        email: user.email ?? "",
        name: null,
        phone: null,
        postal_code: null,
        address: null,
        address_detail: null,
    }

    return (
        <div data-ui-id="page-account" className="max-w-xl mx-auto px-5 py-10">
            {/* 헤더 */}
            <div className="mb-8">
                <h1
                    className="text-2xl font-black"
                    style={{ color: "var(--toss-text-primary)", letterSpacing: "-0.03em" }}
                >
                    내 계정
                </h1>
                <p className="text-sm mt-1" style={{ color: "var(--toss-text-secondary)" }}>
                    프로필 정보와 배송지 주소를 관리하세요
                </p>
            </div>

            {/* 폼 카드 */}
            <div
                className="bg-white rounded-3xl p-7 shadow-sm"
                style={{ border: "1px solid var(--toss-border)" }}
            >
                <AccountForm profile={safeProfile} />
            </div>
        </div>
    )
}
