"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2, ArrowLeft, Mail, CheckCircle2, MailCheck } from "lucide-react"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser"

// 카드 안에서 전환되는 뷰
type View = "login" | "forgot" | "sent" | "verify"

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
    const [emailConfirmedToast, setEmailConfirmedToast] = useState(false)

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        if (params.get("toast") === "email_confirmed") {
            setEmailConfirmedToast(true)
        }
    }, [])

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

    // 이메일 인증 재발송 상태
    const [resendLoading, setResendLoading] = useState(false)
    const [resendSent, setResendSent]       = useState(false)
    const [resendError, setResendError]     = useState<string | null>(null)

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
            if (error.message === "Email not confirmed") {
                // 이메일 미인증 → 인증 유도 화면으로 전환 (에러 메시지 대신)
                setResendSent(false)
                setResendError(null)
                setView("verify")
            } else {
                setLoginError(
                    error.message === "Invalid login credentials"
                        ? "이메일 또는 비밀번호가 올바르지 않습니다."
                        : "로그인 중 오류가 발생했습니다. 다시 시도해 주세요."
                )
            }
            setLoginLoading(false)
            return
        }

        // 정지 계정 체크 — 인증 성공 후 프로필 상태 확인
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            const { data: profile } = await supabase
                .from("customer_profiles")
                .select("status")
                .eq("id", user.id)
                .single()
            if (profile?.status === "suspended") {
                await supabase.auth.signOut()
                setLoginError("계정이 정지된 상태입니다. 자세한 내용은 고객센터에 문의해 주세요.")
                setLoginLoading(false)
                return
            }
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
        setResendSent(false)
        setResendError(null)
        setView("login")
    }

    /* ── 인증 메일 재발송 ── */
    const handleResend = async () => {
        if (resendLoading || !email.trim()) return
        setResendLoading(true)
        setResendError(null)

        const supabase = createSupabaseBrowserClient()
        const { error } = await supabase.auth.resend({
            type:  "signup",
            email: email.trim(),
        })

        if (error) {
            setResendError(
                error.message.toLowerCase().includes("rate limit") ||
                error.message.includes("security purposes")
                    ? "잠시 후 다시 시도해 주세요. (재전송 대기 시간이 있습니다)"
                    : "메일 발송 중 오류가 발생했습니다. 다시 시도해 주세요."
            )
        } else {
            setResendSent(true)
        }
        setResendLoading(false)
    }

    return (
        <div data-ui-id="page-login" className="w-full max-w-[400px]">

            {/* 브랜드 */}
            <div className="text-center mb-8">
                <a href="/" className="inline-block">
                    <span className="font-black text-3xl tracking-tight" style={{ color: "var(--toss-blue)" }}>
                        뽀득삽
                    </span>
                </a>
                <p className="mt-2 text-sm" style={{ color: "var(--toss-text-secondary)" }}>
                    {view === "login"  ? "로그인하고 쇼핑을 시작하세요"
                    : view === "verify" ? "이메일 인증 후 서비스를 이용하실 수 있어요"
                    : "비밀번호를 재설정하세요"}
                </p>
            </div>

            {/* 이메일 인증 완료 안내 배너 */}
            {emailConfirmedToast && (
                <div className="rounded-2xl px-4 py-3 mb-4 flex items-center gap-2.5 text-xs font-medium"
                    style={{ backgroundColor: "#F0FFF4", border: "1px solid #86EFAC", color: "#16A34A" }}>
                    <CheckCircle2 className="size-4 flex-shrink-0" />
                    이메일 인증이 완료되었습니다. 아래에서 로그인해 주세요.
                </div>
            )}

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

                {/* ── 뷰 3: 이메일 인증 유도 ── */}
                {view === "verify" && (
                    <div data-ui-id="page-login-verify">
                        <button type="button" onClick={backToLogin}
                            className="inline-flex items-center gap-1.5 text-xs font-medium mb-5 hover:opacity-70 transition-opacity"
                            style={{ color: "var(--toss-text-tertiary)" }}>
                            <ArrowLeft className="size-3.5" />
                            로그인으로 돌아가기
                        </button>

                        {/* 아이콘 */}
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                                style={{ backgroundColor: "#FFF8E7" }}>
                                <Mail className="size-8" style={{ color: "#FFB800" }} />
                            </div>
                            <h1 className="text-xl font-black mb-2"
                                style={{ color: "var(--toss-text-primary)", letterSpacing: "-0.03em" }}>
                                이메일 인증이 필요해요
                            </h1>
                            <p className="text-sm leading-relaxed" style={{ color: "var(--toss-text-secondary)" }}>
                                <span className="font-semibold" style={{ color: "var(--toss-text-primary)" }}>
                                    {email}
                                </span>
                                으로 보낸<br />
                                인증 메일의 링크를 클릭해 주세요.
                            </p>
                        </div>

                        {/* 안내 박스 */}
                        <div className="rounded-2xl px-4 py-3.5 mb-4 text-xs leading-relaxed space-y-1"
                            style={{ backgroundColor: "var(--toss-page-bg)", border: "1px solid var(--toss-border)" }}>
                            <p style={{ color: "var(--toss-text-secondary)" }}>
                                📬 메일이 오지 않으면 <span className="font-semibold">스팸함</span>을 확인해 주세요.
                            </p>
                            <p style={{ color: "var(--toss-text-tertiary)" }}>
                                인증 메일은 발송 후 24시간 동안 유효합니다.
                            </p>
                        </div>

                        {/* 재발송 성공 */}
                        {resendSent && (
                            <div className="rounded-2xl px-4 py-3 mb-3 flex items-center gap-2.5 text-xs font-medium"
                                style={{ backgroundColor: "#F0FFF4", border: "1px solid #86EFAC", color: "#16A34A" }}>
                                <MailCheck className="size-4 flex-shrink-0" />
                                인증 메일을 다시 발송했습니다. 받은편지함을 확인해 주세요.
                            </div>
                        )}

                        {/* 재발송 에러 */}
                        {resendError && (
                            <div className="rounded-2xl px-4 py-3 mb-3 text-xs font-medium"
                                style={{ backgroundColor: "#FFF0F0", color: "var(--toss-red)" }}>
                                {resendError}
                            </div>
                        )}

                        {/* 재발송 버튼 */}
                        <button
                            data-ui-id="btn-verify-resend"
                            type="button"
                            onClick={handleResend}
                            disabled={resendLoading || resendSent}
                            className="w-full py-3.5 rounded-2xl text-sm font-bold transition-opacity hover:opacity-85 disabled:opacity-50 flex items-center justify-center gap-2"
                            style={{
                                backgroundColor: resendSent ? "var(--toss-page-bg)" : "var(--toss-blue)",
                                color:           resendSent ? "var(--toss-text-tertiary)" : "#fff",
                                border:          resendSent ? "1px solid var(--toss-border)" : "none",
                            }}>
                            {resendLoading
                                ? <><Loader2 className="size-4 animate-spin" />발송 중...</>
                                : resendSent
                                ? <><CheckCircle2 className="size-4" />메일을 다시 발송했어요</>
                                : "인증 메일 다시 받기"}
                        </button>

                        <p className="text-center mt-4 text-xs" style={{ color: "var(--toss-text-tertiary)" }}>
                            이메일이 다른가요?{" "}
                            <button type="button" onClick={backToLogin}
                                className="font-semibold hover:opacity-70 transition-opacity"
                                style={{ color: "var(--toss-blue)" }}>
                                다시 로그인
                            </button>
                        </p>
                    </div>
                )}

                {/* ── 뷰 4: 메일 발송 완료 ── */}
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
