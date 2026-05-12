"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser"
import { Suspense } from "react"

function ConfirmEmailHandler() {
    const searchParams = useSearchParams()

    useEffect(() => {
        const supabase = createSupabaseBrowserClient()
        const code = searchParams.get("code")

        const confirm = async () => {
            if (code) {
                await supabase.auth.exchangeCodeForSession(code)
            } else {
                // Implicit 흐름: 해시에서 자동 처리, 세션 확인 대기
                await new Promise((r) => setTimeout(r, 300))
            }
            window.location.replace("/?toast=signup_confirmed")
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
