"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser"
import { autoActivateCustomerAction } from "@/app/(auth)/signup/actions"
import { Suspense } from "react"

function ConfirmEmailHandler() {
    const searchParams = useSearchParams()

    useEffect(() => {
        const supabase = createSupabaseBrowserClient()
        const code = searchParams.get("code")

        const confirm = async () => {
            const tokenHash = searchParams.get("token_hash")
            // URL에서 type을 읽되, 없으면 회원가입 이메일 인증 기본값 'signup' 사용
            const otpType = (searchParams.get("type") ?? "signup") as
                "signup" | "email" | "recovery" | "magiclink" | "invite"

            if (tokenHash) {
                // 이메일 템플릿에서 token_hash 직접 전달 — 브라우저 무관하게 세션 생성 가능
                // Supabase는 회원가입 인증 토큰을 'signup' 타입으로 저장하므로 type 일치 필요
                const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: otpType })
                if (error) console.error("[confirm-email] verifyOtp 실패:", error.message)
            } else if (code) {
                // PKCE 흐름 폴백 — 가입한 브라우저에서만 code_verifier가 존재해 성공 가능
                const { error } = await supabase.auth.exchangeCodeForSession(code)
                if (error) console.error("[confirm-email] exchangeCodeForSession 실패:", error.message)
            } else {
                // Implicit 흐름: 해시에서 자동 처리, 세션 확인 대기
                await new Promise((r) => setTimeout(r, 300))
            }

            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                // 세션 생성 성공 — 상태 활성화 후 홈으로
                await autoActivateCustomerAction(user.id)
                window.location.replace("/?toast=signup_confirmed")
            } else {
                // 세션 생성 실패(다른 브라우저 + PKCE 교환 불가) — 로그인 유도
                window.location.replace("/login?toast=email_confirmed")
            }
        }

        confirm()
    }, [searchParams])

    return (
        <div className="w-full max-w-[400px]">
            <div
                className="bg-white rounded-3xl p-7 shadow-sm flex flex-col items-center justify-center h-48 gap-3"
                style={{ border: "1px solid var(--toss-border)" }}
            >
                <div
                    className="w-5 h-5 border-2 rounded-full animate-spin"
                    style={{ borderColor: "var(--toss-blue)", borderTopColor: "transparent" }}
                />
                <p className="text-sm" style={{ color: "var(--toss-text-tertiary)" }}>
                    인증 확인 중...
                </p>
            </div>
        </div>
    )
}

export default function ConfirmEmailPage() {
    return (
        <Suspense fallback={
            <div className="w-full max-w-[400px]">
                <div
                    className="bg-white rounded-3xl p-7 shadow-sm flex items-center justify-center h-48"
                    style={{ border: "1px solid var(--toss-border)" }}
                >
                    <div
                        className="w-5 h-5 border-2 rounded-full animate-spin"
                        style={{ borderColor: "var(--toss-blue)", borderTopColor: "transparent" }}
                    />
                </div>
            </div>
        }>
            <ConfirmEmailHandler />
        </Suspense>
    )
}
