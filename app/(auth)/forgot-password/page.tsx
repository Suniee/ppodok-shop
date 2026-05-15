"use client"

import { useState } from "react"
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser"

export default function ForgotPasswordPage() {
    const [email, setEmail]   = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError]   = useState<string | null>(null)
    const [sent, setSent]     = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email.trim()) return

        setLoading(true)
        setError(null)

        const supabase = createSupabaseBrowserClient()
        const { error: authError } = await supabase.auth.resetPasswordForEmail(
            email.trim(),
            {
                // 메일 링크 클릭 후 리다이렉트될 페이지
                redirectTo: `${window.location.origin}/reset-password`,
            }
        )

        // Supabase는 이메일 존재 여부와 무관하게 항상 성공 응답 (보안상)
        if (authError) {
            setError(
                authError.message.toLowerCase().includes("rate limit")
                    ? "이메일 발송 한도를 초과했습니다. 잠시 후 다시 시도해 주세요."
                    : authError.message.includes("security purposes")
                    ? "잠시 후 다시 시도해 주세요. (보안을 위해 재전송 대기 시간이 있습니다)"
                    : "오류가 발생했습니다. 잠시 후 다시 시도해 주세요."
            )
            setLoading(false)
            return
        }

        setSent(true)
        setLoading(false)
    }

    const inputBase = "w-full rounded-2xl px-4 py-3.5 text-sm outline-none transition-all"
    const inputStyle: React.CSSProperties = {
        backgroundColor: "var(--toss-page-bg)",
        color: "var(--toss-text-primary)",
        border: "1.5px solid var(--toss-border)",
    }

    // 메일 발송 완료 화면
    if (sent) {
        return (
            <div data-ui-id="page-forgot-password-done" className="w-full max-w-[400px]">
                <div className="bg-white rounded-3xl p-8 shadow-sm text-center" style={{ border: "1px solid var(--toss-border)" }}>
                    <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                        style={{ backgroundColor: "var(--toss-blue-light)" }}
                    >
                        <Mail className="size-7" style={{ color: "var(--toss-blue)" }} />
                    </div>
                    <h2 className="text-lg font-black mb-2" style={{ color: "var(--toss-text-primary)" }}>
                        메일을 확인해 주세요
                    </h2>
                    <p className="text-sm leading-relaxed mb-2" style={{ color: "var(--toss-text-secondary)" }}>
                        <span className="font-semibold" style={{ color: "var(--toss-text-primary)" }}>{email}</span>
                        으로 비밀번호 재설정 링크를 보냈습니다.
                    </p>
                    <p className="text-xs mb-6" style={{ color: "var(--toss-text-tertiary)" }}>
                        메일이 오지 않으면 스팸함을 확인하거나 다시 시도해 주세요.
                    </p>
                    <div className="space-y-2">
                        <a href="/login"
                            className="block w-full py-3.5 rounded-2xl text-sm font-bold text-white text-center hover:opacity-85 transition-opacity"
                            style={{ backgroundColor: "var(--toss-blue)" }}>
                            로그인 화면으로
                        </a>
                        <button onClick={() => { setSent(false); setEmail("") }}
                            className="block w-full py-3 rounded-2xl text-sm font-semibold text-center hover:bg-gray-50 transition-colors"
                            style={{ color: "var(--toss-text-secondary)", border: "1px solid var(--toss-border)" }}>
                            다른 이메일로 재시도
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div data-ui-id="page-forgot-password" className="w-full max-w-[400px]">

            {/* 브랜드 */}
            <div className="text-center mb-8">
                <a href="/" className="inline-block">
                    <span className="font-black text-3xl tracking-tight" style={{ color: "var(--toss-blue)" }}>뽀득삽</span>
                </a>
            </div>

            <div className="bg-white rounded-3xl p-7 shadow-sm" style={{ border: "1px solid var(--toss-border)" }}>
                <a href="/login" className="inline-flex items-center gap-1.5 text-xs font-medium mb-5 hover:opacity-70 transition-opacity"
                    style={{ color: "var(--toss-text-tertiary)" }}>
                    <ArrowLeft className="size-3.5" />
                    로그인으로 돌아가기
                </a>

                <h1 className="text-xl font-black mb-1" style={{ color: "var(--toss-text-primary)", letterSpacing: "-0.03em" }}>
                    비밀번호 재설정
                </h1>
                <p className="text-sm mb-6" style={{ color: "var(--toss-text-secondary)" }}>
                    가입한 이메일을 입력하면 재설정 링크를 보내드립니다.
                </p>

                <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold" style={{ color: "var(--toss-text-secondary)" }}>이메일</label>
                        <input
                            type="email"
                            autoComplete="email"
                            autoFocus
                            placeholder="가입 시 사용한 이메일"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className={inputBase}
                            style={inputStyle}
                            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--toss-blue)")}
                            onBlur={(e)  => (e.currentTarget.style.borderColor = "var(--toss-border)")}
                        />
                    </div>

                    {error && (
                        <div className="rounded-2xl px-4 py-3 text-xs font-medium"
                            style={{ backgroundColor: "#FFF0F0", color: "var(--toss-red)" }}>
                            {error}
                        </div>
                    )}

                    <button
                        data-ui-id="btn-forgot-password-submit"
                        type="submit"
                        disabled={loading || !email.trim()}
                        className="w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-opacity hover:opacity-85 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                        style={{ backgroundColor: "var(--toss-blue)" }}
                    >
                        {loading
                            ? <><Loader2 className="size-4 animate-spin" />전송 중...</>
                            : "재설정 메일 보내기"}
                    </button>
                </form>
            </div>
        </div>
    )
}
