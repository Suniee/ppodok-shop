"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser"

export default function SignupPage() {
    const router = useRouter()
    const [name, setName]           = useState("")
    const [email, setEmail]         = useState("")
    const [password, setPassword]   = useState("")
    const [confirm, setConfirm]     = useState("")
    const [showPw, setShowPw]       = useState(false)
    const [showCf, setShowCf]       = useState(false)
    const [loading, setLoading]     = useState(false)
    const [error, setError]         = useState<string | null>(null)
    const [done, setDone]           = useState(false)   // 가입 완료 상태

    const pwMatch = confirm === "" || password === confirm
    const canSubmit = name.trim() && email.trim() && password.length >= 6 && password === confirm

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!canSubmit) return

        setLoading(true)
        setError(null)

        const supabase = createSupabaseBrowserClient()
        const { data, error: authError } = await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
                data: { name: name.trim() },   // auth.users.raw_user_meta_data에 저장
            },
        })

        if (authError) {
            setError(
                authError.message.includes("already registered")
                    ? "이미 사용 중인 이메일입니다."
                    : authError.message.includes("Password should be")
                    ? "비밀번호는 6자 이상이어야 합니다."
                    : "가입 중 오류가 발생했습니다. 다시 시도해 주세요."
            )
            setLoading(false)
            return
        }

        // 이메일 인증이 꺼진 경우 session이 바로 생성됨 → 홈으로 이동
        if (data.session) {
            router.push("/")
            router.refresh()
            return
        }

        // 이메일 인증이 켜진 경우 → 안내 화면 표시
        setDone(true)
        setLoading(false)
    }

    const inputBase = "w-full rounded-2xl px-4 py-3.5 text-sm outline-none transition-all"
    const inputStyle: React.CSSProperties = {
        backgroundColor: "var(--toss-page-bg)",
        color: "var(--toss-text-primary)",
        border: "1.5px solid var(--toss-border)",
    }

    // 이메일 인증 안내 화면
    if (done) {
        return (
            <div data-ui-id="page-signup-done" className="w-full max-w-[400px] text-center">
                <div
                    className="bg-white rounded-3xl p-8 shadow-sm"
                    style={{ border: "1px solid var(--toss-border)" }}
                >
                    <CheckCircle2 className="size-12 mx-auto mb-4" style={{ color: "#00C471" }} />
                    <h2 className="text-lg font-black mb-2" style={{ color: "var(--toss-text-primary)" }}>
                        거의 다 됐어요!
                    </h2>
                    <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--toss-text-secondary)" }}>
                        <span className="font-semibold" style={{ color: "var(--toss-text-primary)" }}>{email}</span>
                        로 인증 메일을 보냈습니다.
                        <br />메일함을 확인하고 링크를 클릭하면 가입이 완료됩니다.
                    </p>
                    <a
                        href="/login"
                        className="block w-full py-3.5 rounded-2xl text-sm font-bold text-white text-center transition-opacity hover:opacity-85"
                        style={{ backgroundColor: "var(--toss-blue)" }}
                    >
                        로그인 화면으로
                    </a>
                </div>
            </div>
        )
    }

    return (
        <div data-ui-id="page-signup" className="w-full max-w-[400px]">

            {/* 브랜드 */}
            <div className="text-center mb-8">
                <a href="/" className="inline-block">
                    <span className="font-black text-3xl tracking-tight" style={{ color: "var(--toss-blue)" }}>
                        뽀독샵
                    </span>
                </a>
                <p className="mt-2 text-sm" style={{ color: "var(--toss-text-secondary)" }}>
                    가입하고 첫 쇼핑을 시작하세요
                </p>
            </div>

            {/* 카드 */}
            <div className="bg-white rounded-3xl p-7 shadow-sm" style={{ border: "1px solid var(--toss-border)" }}>
                <h1
                    className="text-xl font-black mb-6"
                    style={{ color: "var(--toss-text-primary)", letterSpacing: "-0.03em" }}
                >
                    회원가입
                </h1>

                <form onSubmit={handleSubmit} className="space-y-3">
                    {/* 이름 */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold" style={{ color: "var(--toss-text-secondary)" }}>이름</label>
                        <input
                            type="text"
                            autoComplete="name"
                            placeholder="홍길동"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className={inputBase}
                            style={inputStyle}
                            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--toss-blue)")}
                            onBlur={(e)  => (e.currentTarget.style.borderColor = "var(--toss-border)")}
                        />
                    </div>

                    {/* 이메일 */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold" style={{ color: "var(--toss-text-secondary)" }}>이메일</label>
                        <input
                            type="email"
                            autoComplete="email"
                            placeholder="example@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className={inputBase}
                            style={inputStyle}
                            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--toss-blue)")}
                            onBlur={(e)  => (e.currentTarget.style.borderColor = "var(--toss-border)")}
                        />
                    </div>

                    {/* 비밀번호 */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold" style={{ color: "var(--toss-text-secondary)" }}>
                            비밀번호
                            <span className="font-normal ml-1" style={{ color: "var(--toss-text-tertiary)" }}>(6자 이상)</span>
                        </label>
                        <div className="relative">
                            <input
                                type={showPw ? "text" : "password"}
                                autoComplete="new-password"
                                placeholder="비밀번호를 입력하세요"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className={`${inputBase} pr-12`}
                                style={inputStyle}
                                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--toss-blue)")}
                                onBlur={(e)  => (e.currentTarget.style.borderColor = "var(--toss-border)")}
                            />
                            <button type="button" onClick={() => setShowPw(!showPw)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                                style={{ color: "var(--toss-text-tertiary)" }}>
                                {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </button>
                        </div>
                    </div>

                    {/* 비밀번호 확인 */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold" style={{ color: "var(--toss-text-secondary)" }}>비밀번호 확인</label>
                        <div className="relative">
                            <input
                                type={showCf ? "text" : "password"}
                                autoComplete="new-password"
                                placeholder="비밀번호를 한 번 더 입력하세요"
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                required
                                className={`${inputBase} pr-12`}
                                style={{
                                    ...inputStyle,
                                    borderColor: !pwMatch ? "var(--toss-red)" : "var(--toss-border)",
                                }}
                                onFocus={(e) => (e.currentTarget.style.borderColor = pwMatch ? "var(--toss-blue)" : "var(--toss-red)")}
                                onBlur={(e)  => (e.currentTarget.style.borderColor = pwMatch ? "var(--toss-border)" : "var(--toss-red)")}
                            />
                            <button type="button" onClick={() => setShowCf(!showCf)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                                style={{ color: "var(--toss-text-tertiary)" }}>
                                {showCf ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </button>
                        </div>
                        {!pwMatch && (
                            <p className="text-xs" style={{ color: "var(--toss-red)" }}>비밀번호가 일치하지 않습니다.</p>
                        )}
                    </div>

                    {/* 에러 */}
                    {error && (
                        <div className="rounded-2xl px-4 py-3 text-xs font-medium"
                            style={{ backgroundColor: "#FFF0F0", color: "var(--toss-red)" }}>
                            {error}
                        </div>
                    )}

                    {/* 가입 버튼 */}
                    <button
                        data-ui-id="btn-signup-submit"
                        type="submit"
                        disabled={loading || !canSubmit}
                        className="w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-opacity hover:opacity-85 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                        style={{ backgroundColor: "var(--toss-blue)" }}
                    >
                        {loading ? <><Loader2 className="size-4 animate-spin" />가입 중...</> : "가입하기"}
                    </button>
                </form>

                {/* 구분선 */}
                <div className="flex items-center gap-3 my-5">
                    <div className="flex-1 h-px" style={{ backgroundColor: "var(--toss-border)" }} />
                    <span className="text-xs" style={{ color: "var(--toss-text-tertiary)" }}>이미 계정이 있으신가요?</span>
                    <div className="flex-1 h-px" style={{ backgroundColor: "var(--toss-border)" }} />
                </div>

                <a
                    data-ui-id="link-signup-login"
                    href="/login"
                    className="block w-full py-3 rounded-2xl text-sm font-semibold text-center transition-colors hover:bg-gray-50"
                    style={{ color: "var(--toss-text-primary)", border: "1.5px solid var(--toss-border)" }}
                >
                    로그인
                </a>
            </div>

            <p className="text-center mt-5 text-xs" style={{ color: "var(--toss-text-tertiary)" }}>
                <a href="/" className="hover:underline">홈으로 돌아가기</a>
            </p>
        </div>
    )
}
