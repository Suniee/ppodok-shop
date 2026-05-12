"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser"

export default function ResetPasswordForm() {
    const searchParams = useSearchParams()
    const router       = useRouter()

    const [status, setStatus]     = useState<"loading" | "ready" | "error">("loading")
    const [password, setPassword] = useState("")
    const [confirm, setConfirm]   = useState("")
    const [showPw, setShowPw]     = useState(false)
    const [showCf, setShowCf]     = useState(false)
    const [saving, setSaving]     = useState(false)
    const [done, setDone]         = useState(false)
    const [error, setError]       = useState<string | null>(null)

    // PASSWORD_RECOVERY 이벤트 기반 처리 (PKCE / Implicit / React Strict Mode 대응)
    useEffect(() => {
        const supabase = createSupabaseBrowserClient()
        const code = searchParams.get("code")
        let settled = false

        const settle = (ok: boolean) => {
            if (settled) return
            settled = true
            setStatus(ok ? "ready" : "error")
        }

        // PASSWORD_RECOVERY: 비밀번호 재설정 링크 진입 시 Supabase가 발생시킴
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === "PASSWORD_RECOVERY") settle(true)
        })

        if (code) {
            supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
                if (error) {
                    // React Strict Mode에서 두 번째 실행 시 code가 이미 사용됐을 수 있음
                    // 이 경우 세션이 이미 존재하면 성공으로 처리
                    supabase.auth.getSession().then(({ data: { session } }) => {
                        if (session?.user) settle(true)
                        else settle(false)
                    })
                }
                // 성공 케이스는 PASSWORD_RECOVERY 이벤트가 처리
            })
        } else {
            // Implicit 흐름: 해시 토큰에서 세션이 이미 설정됐는지 확인
            supabase.auth.getSession().then(({ data: { session } }) => {
                if (session?.user) settle(true)
            })
        }

        // 8초 내 응답 없으면 오류 처리
        const timeout = setTimeout(() => settle(false), 8000)

        return () => {
            subscription.unsubscribe()
            clearTimeout(timeout)
        }
    }, [searchParams])

    const pwMatch  = confirm === "" || password === confirm
    const canSave  = password.length >= 6 && password === confirm

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!canSave) return

        setSaving(true)
        setError(null)

        const supabase = createSupabaseBrowserClient()
        const { error: updateError } = await supabase.auth.updateUser({ password })

        if (updateError) {
            setError(
                updateError.message.includes("same password")
                    ? "현재 비밀번호와 동일합니다. 다른 비밀번호를 입력해 주세요."
                    : "비밀번호 변경에 실패했습니다. 다시 시도해 주세요."
            )
            setSaving(false)
            return
        }

        setDone(true)
        // 3초 후 자동으로 홈으로 이동
        setTimeout(() => { router.push("/"); router.refresh() }, 3000)
    }

    const inputBase = "w-full rounded-2xl px-4 py-3.5 text-sm outline-none transition-all"
    const inputStyle: React.CSSProperties = {
        backgroundColor: "var(--toss-page-bg)",
        color: "var(--toss-text-primary)",
        border: "1.5px solid var(--toss-border)",
    }

    // 링크 오류 화면
    if (status === "error") {
        return (
            <div data-ui-id="page-reset-password-error" className="w-full max-w-[400px]">
                <div className="bg-white rounded-3xl p-8 shadow-sm text-center" style={{ border: "1px solid var(--toss-border)" }}>
                    <AlertCircle className="size-12 mx-auto mb-4" style={{ color: "var(--toss-red)" }} />
                    <h2 className="text-lg font-black mb-2" style={{ color: "var(--toss-text-primary)" }}>
                        링크가 유효하지 않아요
                    </h2>
                    <p className="text-sm mb-6" style={{ color: "var(--toss-text-secondary)" }}>
                        링크가 만료되었거나 이미 사용된 링크입니다.
                        <br />비밀번호 재설정을 다시 시도해 주세요.
                    </p>
                    <a href="/forgot-password"
                        className="block w-full py-3.5 rounded-2xl text-sm font-bold text-white text-center hover:opacity-85 transition-opacity"
                        style={{ backgroundColor: "var(--toss-blue)" }}>
                        재설정 메일 다시 받기
                    </a>
                </div>
            </div>
        )
    }

    // 로딩 중
    if (status === "loading") {
        return (
            <div data-ui-id="page-reset-password-loading" className="w-full max-w-[400px]">
                <div className="bg-white rounded-3xl p-7 shadow-sm flex flex-col items-center justify-center h-48 gap-3"
                    style={{ border: "1px solid var(--toss-border)" }}>
                    <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
                        style={{ borderColor: "var(--toss-blue)", borderTopColor: "transparent" }} />
                    <p className="text-sm" style={{ color: "var(--toss-text-tertiary)" }}>인증 확인 중...</p>
                </div>
            </div>
        )
    }

    // 변경 완료 화면
    if (done) {
        return (
            <div data-ui-id="page-reset-password-done" className="w-full max-w-[400px]">
                <div className="bg-white rounded-3xl p-8 shadow-sm text-center" style={{ border: "1px solid var(--toss-border)" }}>
                    <CheckCircle2 className="size-12 mx-auto mb-4" style={{ color: "#00C471" }} />
                    <h2 className="text-lg font-black mb-2" style={{ color: "var(--toss-text-primary)" }}>
                        비밀번호가 변경되었습니다
                    </h2>
                    <p className="text-sm" style={{ color: "var(--toss-text-secondary)" }}>
                        잠시 후 홈 화면으로 이동합니다.
                    </p>
                </div>
            </div>
        )
    }

    // 비밀번호 입력 폼
    return (
        <div data-ui-id="page-reset-password" className="w-full max-w-[400px]">
            <div className="text-center mb-8">
                <a href="/" className="inline-block">
                    <span className="font-black text-3xl tracking-tight" style={{ color: "var(--toss-blue)" }}>뽀독샵</span>
                </a>
            </div>

            <div className="bg-white rounded-3xl p-7 shadow-sm" style={{ border: "1px solid var(--toss-border)" }}>
                <h1 className="text-xl font-black mb-1" style={{ color: "var(--toss-text-primary)", letterSpacing: "-0.03em" }}>
                    새 비밀번호 설정
                </h1>
                <p className="text-sm mb-6" style={{ color: "var(--toss-text-secondary)" }}>
                    새로 사용할 비밀번호를 입력해 주세요.
                </p>

                <form onSubmit={handleSubmit} className="space-y-3">
                    {/* 새 비밀번호 */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold" style={{ color: "var(--toss-text-secondary)" }}>
                            새 비밀번호
                            <span className="font-normal ml-1" style={{ color: "var(--toss-text-tertiary)" }}>(6자 이상)</span>
                        </label>
                        <div className="relative">
                            <input
                                type={showPw ? "text" : "password"}
                                autoComplete="new-password"
                                autoFocus
                                placeholder="새 비밀번호"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className={`${inputBase} pr-12`}
                                style={inputStyle}
                                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--toss-blue)")}
                                onBlur={(e)  => (e.currentTarget.style.borderColor = "var(--toss-border)")}
                            />
                            <button type="button" onClick={() => setShowPw(!showPw)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-gray-100"
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
                                placeholder="비밀번호를 한 번 더 입력"
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
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-gray-100"
                                style={{ color: "var(--toss-text-tertiary)" }}>
                                {showCf ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </button>
                        </div>
                        {!pwMatch && (
                            <p className="text-xs" style={{ color: "var(--toss-red)" }}>비밀번호가 일치하지 않습니다.</p>
                        )}
                    </div>

                    {error && (
                        <div className="rounded-2xl px-4 py-3 text-xs font-medium"
                            style={{ backgroundColor: "#FFF0F0", color: "var(--toss-red)" }}>
                            {error}
                        </div>
                    )}

                    <button
                        data-ui-id="btn-reset-password-submit"
                        type="submit"
                        disabled={saving || !canSave}
                        className="w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-opacity hover:opacity-85 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                        style={{ backgroundColor: "var(--toss-blue)" }}
                    >
                        {saving
                            ? <><Loader2 className="size-4 animate-spin" />변경 중...</>
                            : "비밀번호 변경하기"}
                    </button>
                </form>
            </div>
        </div>
    )
}
