"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2, ShieldCheck, ArrowLeft, Mail, CheckCircle2 } from "lucide-react"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser"
import { ADMIN_STORAGE_KEY } from "@/lib/supabase/keys"
import { adminLoginAction } from "./actions"

type View = "login" | "signup" | "signup-done" | "forgot" | "sent"

// ── 다크 테마 인풋 스타일 헬퍼 ────────────────────────────────────────────
const darkInput =
    "w-full px-4 py-3 rounded-xl text-sm outline-none transition-all disabled:opacity-50"
const darkInputStyle: React.CSSProperties = {
    backgroundColor: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "#fff",
}
function onFocusBlue(e: React.FocusEvent<HTMLInputElement>) {
    e.currentTarget.style.borderColor = "var(--toss-blue)"
}
function onBlurDim(e: React.FocusEvent<HTMLInputElement>) {
    e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"
}

// ── 오류 박스 ───────────────────────────────────────────────────────────────
function ErrBox({ msg }: { msg: string }) {
    return (
        <div
            className="px-4 py-3 rounded-xl text-xs font-medium"
            style={{
                backgroundColor: "rgba(239,68,68,0.15)",
                color: "#fca5a5",
                border: "1px solid rgba(239,68,68,0.25)",
            }}
        >
            {msg}
        </div>
    )
}

export default function AdminLoginForm() {
    const router = useRouter()
    const [view, setView] = useState<View>("login")

    // 로그인
    const [loginEmail, setLoginEmail]   = useState("")
    const [loginPw, setLoginPw]         = useState("")
    const [showLoginPw, setShowLoginPw] = useState(false)
    const [loginError, setLoginError]   = useState<string | null>(null)
    const [loginPending, startLogin]    = useTransition()

    // 회원가입
    const [signName, setSignName]       = useState("")
    const [signEmail, setSignEmail]     = useState("")
    const [signPw, setSignPw]           = useState("")
    const [signCf, setSignCf]           = useState("")
    const [showSignPw, setShowSignPw]   = useState(false)
    const [showSignCf, setShowSignCf]   = useState(false)
    const [signLoading, setSignLoading] = useState(false)
    const [signError, setSignError]     = useState<string | null>(null)

    // 비밀번호 찾기
    const [forgotEmail, setForgotEmail]     = useState("")
    const [forgotLoading, setForgotLoading] = useState(false)
    const [forgotError, setForgotError]     = useState<string | null>(null)

    const pwMatch  = signCf === "" || signPw === signCf
    const canSignup = signName.trim() && signEmail.trim() && signPw.length >= 6 && signPw === signCf

    // ── 로그인 ──────────────────────────────────────────────────────────────
    const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoginError(null)
        const fd = new FormData(e.currentTarget)
        startLogin(async () => {
            const result = await adminLoginAction(fd)
            if ("error" in result) {
                setLoginError(result.error)
            } else {
                router.push("/admin/dashboard")
            }
        })
    }

    // ── 회원가입 ────────────────────────────────────────────────────────────
    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!canSignup) return
        setSignLoading(true)
        setSignError(null)

        const supabase = createSupabaseBrowserClient(ADMIN_STORAGE_KEY)
        const { data, error } = await supabase.auth.signUp({
            email: signEmail.trim(),
            password: signPw,
            options: {
                data: { name: signName.trim() },
                // 이메일 인증 후 어드민 로그인 페이지로 복귀
                emailRedirectTo: `${window.location.origin}/auth/callback?next=/admin/login`,
            },
        })

        if (error) {
            setSignError(
                error.message.includes("already registered") || error.message.includes("already exists")
                    ? "이미 사용 중인 이메일입니다."
                    : error.message.includes("Password should be")
                    ? "비밀번호는 6자 이상이어야 합니다."
                    : `오류: ${error.message}`
            )
            setSignLoading(false)
            return
        }

        // 이메일 인증이 꺼진 경우 바로 세션 생성 → 가입 완료 안내만 표시
        // (status='pending'이므로 대시보드 진입 불가)
        setView("signup-done")
        setSignLoading(false)
    }

    // ── 비밀번호 찾기 ────────────────────────────────────────────────────────
    const handleForgot = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!forgotEmail.trim()) return
        setForgotLoading(true)
        setForgotError(null)

        const supabase = createSupabaseBrowserClient(ADMIN_STORAGE_KEY)
        const { error } = await supabase.auth.resetPasswordForEmail(
            forgotEmail.trim(),
            { redirectTo: `${window.location.origin}/reset-password` }
        )

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

    // ── 뷰 전환 헬퍼 ────────────────────────────────────────────────────────
    const goToForgot = () => {
        setForgotEmail(loginEmail)
        setForgotError(null)
        setView("forgot")
    }
    const goToSignup = () => {
        setSignError(null)
        setView("signup")
    }
    const backToLogin = () => {
        setLoginError(null)
        setForgotError(null)
        setView("login")
    }

    return (
        <div
            data-ui-id="page-admin-login"
            className="min-h-screen flex items-center justify-center px-4 py-10"
            style={{ backgroundColor: "var(--toss-text-primary)" }}
        >
            <div className="w-full max-w-[380px]">

                {/* 로고 */}
                <div className="flex flex-col items-center mb-8">
                    <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black mb-3"
                        style={{ backgroundColor: "var(--toss-blue)" }}
                    >
                        뽀
                    </div>
                    <h1 className="text-xl font-black text-white tracking-tight">뽀득삽 관리자</h1>
                    <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                        {view === "login"      && "관리자 계정으로 로그인하세요"}
                        {view === "signup"     && "관리자 계정을 신청하세요"}
                        {view === "signup-done"&& "가입 신청이 완료되었습니다"}
                        {view === "forgot"     && "비밀번호를 재설정하세요"}
                        {view === "sent"       && "메일을 확인해 주세요"}
                    </p>
                </div>

                {/* 카드 */}
                <div
                    className="rounded-2xl p-7"
                    style={{
                        backgroundColor: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                    }}
                >

                    {/* ── 뷰 1: 로그인 ── */}
                    {view === "login" && (
                        <>
                            <h2 className="text-base font-bold mb-5 text-white">로그인</h2>
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>이메일</label>
                                    <input
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        autoFocus
                                        placeholder="admin@example.com"
                                        value={loginEmail}
                                        onChange={(e) => setLoginEmail(e.target.value)}
                                        required
                                        disabled={loginPending}
                                        className={darkInput}
                                        style={darkInputStyle}
                                        onFocus={onFocusBlue}
                                        onBlur={onBlurDim}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>비밀번호</label>
                                    <div className="relative">
                                        <input
                                            name="password"
                                            type={showLoginPw ? "text" : "password"}
                                            autoComplete="current-password"
                                            placeholder="비밀번호 입력"
                                            value={loginPw}
                                            onChange={(e) => setLoginPw(e.target.value)}
                                            required
                                            disabled={loginPending}
                                            className={`${darkInput} pr-12`}
                                            style={darkInputStyle}
                                            onFocus={onFocusBlue}
                                            onBlur={onBlurDim}
                                        />
                                        <button
                                            type="button"
                                            tabIndex={-1}
                                            onClick={() => setShowLoginPw(!showLoginPw)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-lg"
                                            style={{ color: "rgba(255,255,255,0.35)" }}
                                        >
                                            {showLoginPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                        </button>
                                    </div>
                                </div>

                                {loginError && <ErrBox msg={loginError} />}

                                <button
                                    type="submit"
                                    disabled={loginPending}
                                    className="w-full py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-85 disabled:opacity-50 mt-2"
                                    style={{ backgroundColor: "var(--toss-blue)" }}
                                >
                                    {loginPending
                                        ? <><Loader2 className="size-4 animate-spin" />로그인 중...</>
                                        : <><ShieldCheck className="size-4" />관리자 로그인</>}
                                </button>
                            </form>

                            {/* 구분선 */}
                            <div className="flex items-center gap-3 my-5">
                                <div className="flex-1 h-px" style={{ backgroundColor: "rgba(255,255,255,0.1)" }} />
                                <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>또는</span>
                                <div className="flex-1 h-px" style={{ backgroundColor: "rgba(255,255,255,0.1)" }} />
                            </div>

                            <button
                                type="button"
                                onClick={goToSignup}
                                className="w-full py-3 rounded-xl text-sm font-semibold border transition-colors hover:bg-white/5"
                                style={{ borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.6)" }}
                            >
                                관리자 계정 신청
                            </button>

                            <div className="flex items-center gap-3 mt-4">
                                <div className="flex-1 h-px" style={{ backgroundColor: "rgba(255,255,255,0.08)" }} />
                                <button
                                    type="button"
                                    onClick={goToForgot}
                                    className="text-xs whitespace-nowrap hover:opacity-70 transition-opacity"
                                    style={{ color: "rgba(255,255,255,0.3)" }}
                                >
                                    비밀번호를 잊으셨나요?
                                </button>
                                <div className="flex-1 h-px" style={{ backgroundColor: "rgba(255,255,255,0.08)" }} />
                            </div>
                        </>
                    )}

                    {/* ── 뷰 2: 회원가입 ── */}
                    {view === "signup" && (
                        <>
                            <button
                                type="button"
                                onClick={backToLogin}
                                className="inline-flex items-center gap-1.5 text-xs font-medium mb-5 hover:opacity-70 transition-opacity"
                                style={{ color: "rgba(255,255,255,0.4)" }}
                            >
                                <ArrowLeft className="size-3.5" /> 로그인으로 돌아가기
                            </button>
                            <h2 className="text-base font-bold mb-1 text-white">관리자 계정 신청</h2>
                            <p className="text-xs mb-5" style={{ color: "rgba(255,255,255,0.35)" }}>
                                가입 후 수퍼관리자의 승인이 필요합니다.
                            </p>

                            <form onSubmit={handleSignup} className="space-y-3">
                                {/* 이름 */}
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>이름</label>
                                    <input
                                        type="text"
                                        autoComplete="name"
                                        autoFocus
                                        placeholder="홍길동"
                                        value={signName}
                                        onChange={(e) => setSignName(e.target.value)}
                                        required
                                        disabled={signLoading}
                                        className={darkInput}
                                        style={darkInputStyle}
                                        onFocus={onFocusBlue}
                                        onBlur={onBlurDim}
                                    />
                                </div>
                                {/* 이메일 */}
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>이메일</label>
                                    <input
                                        type="email"
                                        autoComplete="email"
                                        placeholder="example@email.com"
                                        value={signEmail}
                                        onChange={(e) => setSignEmail(e.target.value)}
                                        required
                                        disabled={signLoading}
                                        className={darkInput}
                                        style={darkInputStyle}
                                        onFocus={onFocusBlue}
                                        onBlur={onBlurDim}
                                    />
                                </div>
                                {/* 비밀번호 */}
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>
                                        비밀번호 <span style={{ color: "rgba(255,255,255,0.25)", fontWeight: 400 }}>(6자 이상)</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showSignPw ? "text" : "password"}
                                            autoComplete="new-password"
                                            placeholder="비밀번호를 입력하세요"
                                            value={signPw}
                                            onChange={(e) => setSignPw(e.target.value)}
                                            required
                                            disabled={signLoading}
                                            className={`${darkInput} pr-12`}
                                            style={darkInputStyle}
                                            onFocus={onFocusBlue}
                                            onBlur={onBlurDim}
                                        />
                                        <button type="button" tabIndex={-1} onClick={() => setShowSignPw(!showSignPw)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-lg"
                                            style={{ color: "rgba(255,255,255,0.35)" }}>
                                            {showSignPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                        </button>
                                    </div>
                                </div>
                                {/* 비밀번호 확인 */}
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>비밀번호 확인</label>
                                    <div className="relative">
                                        <input
                                            type={showSignCf ? "text" : "password"}
                                            autoComplete="new-password"
                                            placeholder="비밀번호를 한 번 더 입력하세요"
                                            value={signCf}
                                            onChange={(e) => setSignCf(e.target.value)}
                                            required
                                            disabled={signLoading}
                                            className={`${darkInput} pr-12`}
                                            style={{
                                                ...darkInputStyle,
                                                borderColor: !pwMatch ? "#f87171" : "rgba(255,255,255,0.12)",
                                            }}
                                            onFocus={(e) => (e.currentTarget.style.borderColor = pwMatch ? "var(--toss-blue)" : "#f87171")}
                                            onBlur={(e)  => (e.currentTarget.style.borderColor = pwMatch ? "rgba(255,255,255,0.12)" : "#f87171")}
                                        />
                                        <button type="button" tabIndex={-1} onClick={() => setShowSignCf(!showSignCf)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-lg"
                                            style={{ color: "rgba(255,255,255,0.35)" }}>
                                            {showSignCf ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                        </button>
                                    </div>
                                    {!pwMatch && (
                                        <p className="text-xs" style={{ color: "#f87171" }}>비밀번호가 일치하지 않습니다.</p>
                                    )}
                                </div>

                                {signError && <ErrBox msg={signError} />}

                                <button
                                    type="submit"
                                    disabled={signLoading || !canSignup}
                                    className="w-full py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-85 disabled:opacity-50 mt-2"
                                    style={{ backgroundColor: "var(--toss-blue)" }}
                                >
                                    {signLoading
                                        ? <><Loader2 className="size-4 animate-spin" />신청 중...</>
                                        : "가입 신청하기"}
                                </button>
                            </form>
                        </>
                    )}

                    {/* ── 뷰 3: 가입 신청 완료 ── */}
                    {view === "signup-done" && (
                        <div className="text-center py-2">
                            <div
                                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                                style={{ backgroundColor: "rgba(0,102,255,0.2)" }}
                            >
                                <CheckCircle2 className="size-7" style={{ color: "var(--toss-blue)" }} />
                            </div>
                            <h2 className="text-base font-bold mb-2 text-white">가입 신청 완료</h2>
                            <p className="text-sm leading-relaxed mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>
                                <span className="font-semibold" style={{ color: "rgba(255,255,255,0.8)" }}>
                                    {signEmail}
                                </span>
                                으로 인증 메일을 보냈습니다.
                            </p>
                            <p className="text-xs mb-6" style={{ color: "rgba(255,255,255,0.3)" }}>
                                이메일 인증 후, 수퍼관리자 승인이 완료되면 로그인할 수 있습니다.
                            </p>
                            <button
                                type="button"
                                onClick={backToLogin}
                                className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-85"
                                style={{ backgroundColor: "var(--toss-blue)" }}
                            >
                                로그인 화면으로
                            </button>
                        </div>
                    )}

                    {/* ── 뷰 4: 비밀번호 찾기 ── */}
                    {view === "forgot" && (
                        <>
                            <button
                                type="button"
                                onClick={backToLogin}
                                className="inline-flex items-center gap-1.5 text-xs font-medium mb-5 hover:opacity-70 transition-opacity"
                                style={{ color: "rgba(255,255,255,0.4)" }}
                            >
                                <ArrowLeft className="size-3.5" /> 로그인으로 돌아가기
                            </button>
                            <h2 className="text-base font-bold mb-1 text-white">비밀번호 재설정</h2>
                            <p className="text-sm mb-5" style={{ color: "rgba(255,255,255,0.35)" }}>
                                가입한 이메일로 재설정 링크를 보내드립니다.
                            </p>

                            <form onSubmit={handleForgot} className="space-y-3">
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>이메일</label>
                                    <input
                                        type="email"
                                        autoComplete="email"
                                        autoFocus
                                        placeholder="가입 시 사용한 이메일"
                                        value={forgotEmail}
                                        onChange={(e) => setForgotEmail(e.target.value)}
                                        required
                                        disabled={forgotLoading}
                                        className={darkInput}
                                        style={darkInputStyle}
                                        onFocus={onFocusBlue}
                                        onBlur={onBlurDim}
                                    />
                                </div>

                                {forgotError && <ErrBox msg={forgotError} />}

                                <button
                                    type="submit"
                                    disabled={forgotLoading || !forgotEmail.trim()}
                                    className="w-full py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-85 disabled:opacity-50 mt-2"
                                    style={{ backgroundColor: "var(--toss-blue)" }}
                                >
                                    {forgotLoading
                                        ? <><Loader2 className="size-4 animate-spin" />전송 중...</>
                                        : "재설정 메일 보내기"}
                                </button>
                            </form>
                        </>
                    )}

                    {/* ── 뷰 5: 메일 발송 완료 ── */}
                    {view === "sent" && (
                        <div className="text-center py-2">
                            <div
                                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                                style={{ backgroundColor: "rgba(0,102,255,0.2)" }}
                            >
                                <Mail className="size-7" style={{ color: "var(--toss-blue)" }} />
                            </div>
                            <h2 className="text-base font-bold mb-2 text-white">메일을 확인해 주세요</h2>
                            <p className="text-sm leading-relaxed mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>
                                <span className="font-semibold" style={{ color: "rgba(255,255,255,0.8)" }}>
                                    {forgotEmail}
                                </span>
                                으로{" "}
                                <br />비밀번호 재설정 링크를 보냈습니다.
                            </p>
                            <p className="text-xs mb-6" style={{ color: "rgba(255,255,255,0.3)" }}>
                                메일이 오지 않으면 스팸함을 확인해 주세요.
                            </p>
                            <div className="space-y-2">
                                <button
                                    type="button"
                                    onClick={backToLogin}
                                    className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-85"
                                    style={{ backgroundColor: "var(--toss-blue)" }}
                                >
                                    로그인 화면으로
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setView("forgot"); setForgotEmail("") }}
                                    className="w-full py-3 rounded-xl text-sm font-semibold border transition-colors hover:bg-white/5"
                                    style={{ borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.5)" }}
                                >
                                    다른 이메일로 재시도
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* 하단 링크 */}
                <p className="text-center mt-5 text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
                    일반 회원이신가요?{" "}
                    <a
                        href="/login"
                        className="underline underline-offset-2 hover:opacity-70 transition-opacity"
                        style={{ color: "rgba(255,255,255,0.35)" }}
                    >
                        쇼핑몰 로그인
                    </a>
                </p>
            </div>
        </div>
    )
}
