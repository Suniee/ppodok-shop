"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2, ArrowLeft, Mail, CheckCircle2 } from "lucide-react"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser"

// 카드 안에서 전환되는 세 가지 뷰
type View = "login" | "forgot" | "sent"

const inputBase = "w-full rounded-2xl px-4 py-3.5 text-sm outline-none transition-all"
const inputStyle: React.CSSProperties = {
    backgroundColor: "var(--toss-page-bg)",
    color: "var(--toss-text-primary)",
    border: "1.5px solid var(--toss-border)",
}

function focusBlue(e: React.FocusEvent<HTMLInputElement>) {
    e.currentTarget.style.borderColor = "var(--toss-blue)"
}
function blurGray(e: React.FocusEvent<HTMLInputElement>) {
    e.currentTarget.style.borderColor = "var(--toss-border)"
}

export default function LoginPage() {
    const router = useRouter()
    const [view, setView]           = useState<View>("login")

    // 로그인 폼 상태
    const [email, setEmail]         = useState("")
    const [password, setPassword]   = useState("")
    const [showPw, setShowPw]       = useState(false)
    const [loginLoading, setLoginLoading] = useState(false)
    const [loginError, setLoginError]     = useState<string | null>(null)

    // 비밀번호 찾기 폼 상태
    const [forgotEmail, setForgotEmail]     = useState("")
    const [forgotLoading, setForgotLoading] = useState(false)
    const [forgotError, setForgotError]     = useState<string | null>(null)

    /* ── 로그인 ── */
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email.trim() || !password) return
        setLoginLoading(true)
        setLoginError(null)

        const supabase = createSupabaseBrowserClient()
        const { error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
        })

        if (error) {
            setLoginError(
                error.message === "Invalid login credentials"
                    ? "이메일 또는 비밀번호가 올바르지 않습니다."
                    : error.message === "Email not confirmed"
                    ? "이메일 인증이 필요합니다. 가입 시 받은 메일을 확인해 주세요."
                    : "로그인 중 오류가 발생했습니다. 다시 시도해 주세요."
            )
            setLoginLoading(false)
            return
        }

        router.push("/")
        router.refresh()
    }

    /* ── 비밀번호 찾기 ── */
    const handleForgot = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!forgotEmail.trim()) return
        setForgotLoading(true)
        setForgotError(null)

        const supabase = createSupabaseBrowserClient()
        const { error } = await supabase.auth.resetPasswordForEmail(
            forgotEmail.trim(),
            { redirectTo: `${window.location.origin}/reset-password` }
        )

        // Supabase는 이메일 존재 여부와 무관하게 항상 성공 반환 (이메일 열거 공격 방지)
        if (error) {
            setForgotError(
                error.message.toLowerCase().includes("rate limit")
                    ? "이메일 발송 한도를 초과했습니다. 잠시 후 다시 시도해 주세요."
                    : error.message.includes("security purposes")
                    ? "잠시 후 다시 시도해 주세요. (보안을 위해 재전송 대기 시간이 있습니다)"
                    : "오류가 발생했습니다. 잠시 후 다시 시도해 주세요."
            )
            setForgotLoading(false)
            return
        }

        setView("sent")
        setForgotLoading(false)
    }

    /* ── 뷰 전환 헬퍼 ── */
    const goToForgot = () => {
        // 로그인 폼에 이메일이 입력돼 있으면 그대로 가져옴
        setForgotEmail(email)
        setForgotError(null)
        setView("forgot")
    }

    const backToLogin = () => {
        setForgotError(null)
        setView("login")
    }

    return (
        <div data-ui-id="page-login" className="w-full max-w-[400px]">

            {/* 브랜드 */}
            <div className="text-center mb-8">
                <a href="/" className="inline-block">
                    <span className="font-black text-3xl tracking-tight" style={{ color: "var(--toss-blue)" }}>
                        뽀독샵
                    </span>
                </a>
                <p className="mt-2 text-sm" style={{ color: "var(--toss-text-secondary)" }}>
                    {view === "login" ? "로그인하고 쇼핑을 시작하세요" : "비밀번호를 재설정하세요"}
                </p>
            </div>

            {/* 카드 */}
            <div className="bg-white rounded-3xl p-7 shadow-sm" style={{ border: "1px solid var(--toss-border)" }}>

                {/* ── 뷰 1: 로그인 ── */}
                {view === "login" && (
                    <>
                        <h1 className="text-xl font-black mb-6"
                            style={{ color: "var(--toss-text-primary)", letterSpacing: "-0.03em" }}>
                            로그인
                        </h1>

                        <form onSubmit={handleLogin} className="space-y-3">
                            <div data-ui-id="input-login-email" className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold" style={{ color: "var(--toss-text-secondary)" }}>이메일</label>
                                <input type="email" autoComplete="email" placeholder="example@email.com"
                                    value={email} onChange={(e) => setEmail(e.target.value)} required
                                    className={inputBase} style={inputStyle}
                                    onFocus={focusBlue} onBlur={blurGray} />
                            </div>

                            <div data-ui-id="input-login-password" className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold" style={{ color: "var(--toss-text-secondary)" }}>비밀번호</label>
                                <div className="relative">
                                    <input type={showPw ? "text" : "password"} autoComplete="current-password"
                                        placeholder="비밀번호를 입력하세요"
                                        value={password} onChange={(e) => setPassword(e.target.value)} required
                                        className={`${inputBase} pr-12`} style={inputStyle}
                                        onFocus={focusBlue} onBlur={blurGray} />
                                    <button type="button" onClick={() => setShowPw(!showPw)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                                        style={{ color: "var(--toss-text-tertiary)" }}>
                                        {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                    </button>
                                </div>
                            </div>

                            {loginError && (
                                <div className="rounded-2xl px-4 py-3 text-xs font-medium"
                                    style={{ backgroundColor: "#FFF0F0", color: "var(--toss-red)" }}>
                                    {loginError}
                                </div>
                            )}

                            <button data-ui-id="btn-login-submit" type="submit"
                                disabled={loginLoading || !email || !password}
                                className="w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-opacity hover:opacity-85 disabled:opacity-50 flex items-center justify-center gap-2 mt-1"
                                style={{ backgroundColor: "var(--toss-blue)" }}>
                                {loginLoading
                                    ? <><Loader2 className="size-4 animate-spin" />로그인 중...</>
                                    : "로그인"}
                            </button>
                        </form>

                        <div className="flex items-center gap-3 my-5">
                            <div className="flex-1 h-px" style={{ backgroundColor: "var(--toss-border)" }} />
                            <span className="text-xs" style={{ color: "var(--toss-text-tertiary)" }}>또는</span>
                            <div className="flex-1 h-px" style={{ backgroundColor: "var(--toss-border)" }} />
                        </div>

                        <p className="text-center text-sm" style={{ color: "var(--toss-text-secondary)" }}>
                            아직 계정이 없으신가요?{" "}
                            <a data-ui-id="link-login-signup" href="/signup"
                                className="font-bold hover:opacity-70 transition-opacity"
                                style={{ color: "var(--toss-blue)" }}>
                                회원가입
                            </a>
                        </p>

                        <div className="flex items-center gap-3 mt-4">
                            <div className="flex-1 h-px" style={{ backgroundColor: "var(--toss-border)" }} />
                            <button
                                data-ui-id="btn-login-forgot"
                                type="button"
                                onClick={goToForgot}
                                className="text-xs font-medium whitespace-nowrap hover:opacity-70 transition-opacity"
                                style={{ color: "var(--toss-text-tertiary)" }}
                            >
                                비밀번호를 잊으셨나요?
                            </button>
                            <div className="flex-1 h-px" style={{ backgroundColor: "var(--toss-border)" }} />
                        </div>
                    </>
                )}

                {/* ── 뷰 2: 비밀번호 찾기 ── */}
                {view === "forgot" && (
                    <>
                        <button type="button" onClick={backToLogin}
                            className="inline-flex items-center gap-1.5 text-xs font-medium mb-5 hover:opacity-70 transition-opacity"
                            style={{ color: "var(--toss-text-tertiary)" }}>
                            <ArrowLeft className="size-3.5" />
                            로그인으로 돌아가기
                        </button>

                        <h1 className="text-xl font-black mb-1"
                            style={{ color: "var(--toss-text-primary)", letterSpacing: "-0.03em" }}>
                            비밀번호 재설정
                        </h1>
                        <p className="text-sm mb-6" style={{ color: "var(--toss-text-secondary)" }}>
                            가입한 이메일로 재설정 링크를 보내드립니다.
                        </p>

                        <form onSubmit={handleForgot} className="space-y-3">
                            <div data-ui-id="input-forgot-email" className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold" style={{ color: "var(--toss-text-secondary)" }}>이메일</label>
                                <input type="email" autoComplete="email" autoFocus
                                    placeholder="가입 시 사용한 이메일"
                                    value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} required
                                    className={inputBase} style={inputStyle}
                                    onFocus={focusBlue} onBlur={blurGray} />
                            </div>

                            {forgotError && (
                                <div className="rounded-2xl px-4 py-3 text-xs font-medium"
                                    style={{ backgroundColor: "#FFF0F0", color: "var(--toss-red)" }}>
                                    {forgotError}
                                </div>
                            )}

                            <button data-ui-id="btn-forgot-submit" type="submit"
                                disabled={forgotLoading || !forgotEmail.trim()}
                                className="w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-opacity hover:opacity-85 disabled:opacity-50 flex items-center justify-center gap-2 mt-1"
                                style={{ backgroundColor: "var(--toss-blue)" }}>
                                {forgotLoading
                                    ? <><Loader2 className="size-4 animate-spin" />전송 중...</>
                                    : "재설정 메일 보내기"}
                            </button>
                        </form>
                    </>
                )}

                {/* ── 뷰 3: 메일 발송 완료 ── */}
                {view === "sent" && (
                    <div className="text-center py-2">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                            style={{ backgroundColor: "var(--toss-blue-light)" }}>
                            <Mail className="size-7" style={{ color: "var(--toss-blue)" }} />
                        </div>
                        <h2 className="text-lg font-black mb-2"
                            style={{ color: "var(--toss-text-primary)", letterSpacing: "-0.03em" }}>
                            메일을 확인해 주세요
                        </h2>
                        <p className="text-sm leading-relaxed mb-1" style={{ color: "var(--toss-text-secondary)" }}>
                            <span className="font-semibold" style={{ color: "var(--toss-text-primary)" }}>
                                {forgotEmail}
                            </span>
                            으로
                            <br />비밀번호 재설정 링크를 보냈습니다.
                        </p>
                        <p className="text-xs mb-6" style={{ color: "var(--toss-text-tertiary)" }}>
                            메일이 오지 않으면 스팸함을 확인해 주세요.
                        </p>
                        <div className="space-y-2">
                            <button type="button" onClick={backToLogin}
                                className="w-full py-3.5 rounded-2xl text-sm font-bold text-white hover:opacity-85 transition-opacity"
                                style={{ backgroundColor: "var(--toss-blue)" }}>
                                로그인 화면으로
                            </button>
                            <button type="button"
                                onClick={() => { setView("forgot"); setForgotEmail("") }}
                                className="w-full py-3 rounded-2xl text-sm font-semibold hover:bg-gray-50 transition-colors"
                                style={{ color: "var(--toss-text-secondary)", border: "1px solid var(--toss-border)" }}>
                                다른 이메일로 재시도
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <p className="text-center mt-5 text-xs" style={{ color: "var(--toss-text-tertiary)" }}>
                <a href="/" className="hover:underline">홈으로 돌아가기</a>
            </p>
        </div>
    )
}
