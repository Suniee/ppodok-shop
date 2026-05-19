"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import ReactMarkdown from "react-markdown"
import type { Components } from "react-markdown"
import { Eye, EyeOff, Loader2, CheckCircle2, Check, X } from "lucide-react"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser"
import { checkWithdrawnEmailAction, autoActivateCustomerAction, saveConsentAction } from "./actions"
import type { Term } from "@/lib/supabase/terms"

// 약관 바텀시트 내 마크다운 렌더링 스타일
const termsComponents: Components = {
    h2: ({ children }) => (
        <h2 className="text-sm font-bold mt-5 mb-1.5" style={{ color: "var(--toss-text-primary)" }}>
            {children}
        </h2>
    ),
    h3: ({ children }) => (
        <h3 className="text-xs font-semibold mt-3 mb-1" style={{ color: "var(--toss-text-primary)" }}>
            {children}
        </h3>
    ),
    p: ({ children }) => (
        <p className="text-sm leading-relaxed mb-2" style={{ color: "var(--toss-text-secondary)" }}>
            {children}
        </p>
    ),
    ul: ({ children }) => (
        <ul className="list-disc pl-4 mb-2 space-y-1" style={{ color: "var(--toss-text-secondary)" }}>
            {children}
        </ul>
    ),
    li: ({ children }) => (
        <li className="text-sm leading-relaxed">{children}</li>
    ),
    strong: ({ children }) => (
        <strong className="font-semibold" style={{ color: "var(--toss-text-primary)" }}>
            {children}
        </strong>
    ),
}

// ── 약관 바텀시트 ──────────────────────────────────────────────
function TermsSheet({ term, onClose }: { term: Term | null; onClose: () => void }) {
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        if (term) setTimeout(() => setVisible(true), 16)
        else setVisible(false)
    }, [term])

    useEffect(() => {
        if (!term) return
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose() }
        window.addEventListener("keydown", handler)
        return () => window.removeEventListener("keydown", handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [term])

    const handleClose = () => {
        setVisible(false)
        setTimeout(() => onClose(), 300)
    }

    if (!term) return null

    return (
        <>
            <div
                className="transition-opacity duration-300"
                style={{
                    position:        "fixed",
                    inset:           0,
                    zIndex:          50,
                    backgroundColor: "rgba(0,0,0,0.5)",
                    opacity:         visible ? 1 : 0,
                }}
                onClick={handleClose}
            />
            <div
                className="bg-white rounded-t-3xl transition-transform duration-300 flex flex-col"
                style={{
                    position:  "fixed",
                    left:      0,
                    right:     0,
                    bottom:    0,
                    zIndex:    51,
                    maxHeight: "85vh",
                    boxShadow: "0 -4px 24px rgba(0,0,0,0.12)",
                    transform: visible ? "translateY(0)" : "translateY(100%)",
                }}
            >
                {/* 핸들 */}
                <div className="flex justify-center pt-3 flex-shrink-0">
                    <div className="w-10 h-1 rounded-full" style={{ backgroundColor: "var(--toss-border)" }} />
                </div>

                {/* 헤더 */}
                <div className="flex items-start justify-between px-5 py-4 flex-shrink-0"
                    style={{ borderBottom: "1px solid var(--toss-border)" }}>
                    <div>
                        <p className="text-base font-bold" style={{ color: "var(--toss-text-primary)", letterSpacing: "-0.02em" }}>
                            {term.title}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--toss-text-tertiary)" }}>
                            버전 {term.version} · 시행일: {new Date(term.effectiveAt).toLocaleDateString("ko-KR")}
                        </p>
                    </div>
                    <button type="button" onClick={handleClose}
                        className="p-1.5 rounded-xl hover:bg-gray-100 transition-colors flex-shrink-0 ml-3">
                        <X className="size-5" style={{ color: "var(--toss-text-secondary)" }} />
                    </button>
                </div>

                {/* 본문 */}
                <div className="overflow-y-auto px-5 py-5 flex-1">
                    <ReactMarkdown components={termsComponents}>
                        {term.content}
                    </ReactMarkdown>
                    <div className="h-4" />
                </div>

                {/* 확인 버튼 */}
                <div className="px-5 pb-8 pt-3 flex-shrink-0" style={{ borderTop: "1px solid var(--toss-border)" }}>
                    <button type="button" onClick={handleClose}
                        className="w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-opacity hover:opacity-85"
                        style={{ backgroundColor: "var(--toss-blue)" }}>
                        확인
                    </button>
                </div>
            </div>
        </>
    )
}

// ── 동의 체크박스 아이템 ───────────────────────────────────────
function ConsentItem({
    checked, onChange, required, label, onView,
}: {
    checked:  boolean
    onChange: (v: boolean) => void
    required: boolean
    label:    string
    onView:   () => void
}) {
    return (
        <div className="flex items-center gap-3 py-3"
            style={{ borderBottom: "1px solid var(--toss-border)" }}>
            <button
                type="button"
                onClick={() => onChange(!checked)}
                className="flex-shrink-0 size-5 rounded-md flex items-center justify-center transition-all"
                style={{
                    border:          `2px solid ${checked ? "var(--toss-blue)" : "var(--toss-border)"}`,
                    backgroundColor: checked ? "var(--toss-blue)" : "#fff",
                }}
            >
                {checked && <Check className="size-3 text-white" strokeWidth={3} />}
            </button>
            <button type="button" onClick={() => onChange(!checked)}
                className="flex-1 text-left flex items-center gap-1.5 min-w-0">
                <span
                    className="text-[10px] font-bold flex-shrink-0 px-1.5 py-0.5 rounded"
                    style={{
                        backgroundColor: required ? "#FFF0F0" : "#F2F4F6",
                        color:           required ? "var(--toss-red)" : "var(--toss-text-tertiary)",
                    }}
                >
                    {required ? "필수" : "선택"}
                </span>
                <span className="text-sm truncate" style={{ color: "var(--toss-text-primary)" }}>
                    {label}
                </span>
            </button>
            <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onView() }}
                className="flex-shrink-0 text-xs underline underline-offset-2 hover:opacity-60 transition-opacity"
                style={{ color: "var(--toss-text-tertiary)" }}
            >
                보기
            </button>
        </div>
    )
}

// ── 서브 채널 체크박스 (이메일 / SMS) ─────────────────────────
function ChannelCheckbox({ label, checked, onChange }: {
    label:    string
    checked:  boolean
    onChange: (v: boolean) => void
}) {
    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className="flex items-center gap-1.5 transition-opacity hover:opacity-70"
        >
            <span
                className="size-4 rounded flex items-center justify-center transition-all flex-shrink-0"
                style={{
                    border:          `2px solid ${checked ? "var(--toss-blue)" : "var(--toss-border)"}`,
                    backgroundColor: checked ? "var(--toss-blue)" : "#fff",
                }}
            >
                {checked && <Check className="size-2.5 text-white" strokeWidth={3.5} />}
            </span>
            <span className="text-xs" style={{ color: "var(--toss-text-secondary)" }}>{label}</span>
        </button>
    )
}

// ── 광고성 정보 수신 동의 (이메일 · SMS 서브 체크박스) ──────────
function MarketingConsentItem({
    term, emailChecked, smsChecked, onEmailChange, onSmsChange, onView,
}: {
    term:           Term
    emailChecked:   boolean
    smsChecked:     boolean
    onEmailChange:  (v: boolean) => void
    onSmsChange:    (v: boolean) => void
    onView:         () => void
}) {
    // 둘 다 체크 → 전체 해제, 그 외 → 전체 체크
    const bothChecked = emailChecked && smsChecked
    const handleParent = () => {
        const next = !bothChecked
        onEmailChange(next)
        onSmsChange(next)
    }

    return (
        <div>
            {/* 부모 행 */}
            <div className="flex items-center gap-3 pt-3 pb-2">
                <button
                    type="button"
                    onClick={handleParent}
                    className="flex-shrink-0 size-5 rounded-md flex items-center justify-center transition-all"
                    style={{
                        border:          `2px solid ${(emailChecked || smsChecked) ? "var(--toss-blue)" : "var(--toss-border)"}`,
                        backgroundColor: (emailChecked || smsChecked) ? "var(--toss-blue)" : "#fff",
                    }}
                >
                    {(emailChecked || smsChecked) && <Check className="size-3 text-white" strokeWidth={3} />}
                </button>
                <button type="button" onClick={handleParent}
                    className="flex-1 text-left flex items-center gap-1.5 min-w-0">
                    <span
                        className="text-[10px] font-bold flex-shrink-0 px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: "#F2F4F6", color: "var(--toss-text-tertiary)" }}
                    >
                        선택
                    </span>
                    <span className="text-sm truncate" style={{ color: "var(--toss-text-primary)" }}>
                        {term.title}
                    </span>
                </button>
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onView() }}
                    className="flex-shrink-0 text-xs underline underline-offset-2 hover:opacity-60 transition-opacity"
                    style={{ color: "var(--toss-text-tertiary)" }}
                >
                    보기
                </button>
            </div>

            {/* 채널 서브 체크박스 */}
            <div
                className="flex gap-8 pl-8 pt-2 pb-5"
                style={{ borderBottom: "1px solid var(--toss-border)" }}
            >
                <ChannelCheckbox label="이메일" checked={emailChecked} onChange={onEmailChange} />
                <ChannelCheckbox label="SMS"   checked={smsChecked}   onChange={onSmsChange}   />
            </div>
        </div>
    )
}

// ── 메인 컴포넌트 ──────────────────────────────────────────────
export default function SignupForm({ terms }: { terms: Term[] }) {
    const router = useRouter()

    // 기본 정보
    const [name, setName]         = useState("")
    const [email, setEmail]       = useState("")
    const [password, setPassword] = useState("")
    const [confirm, setConfirm]   = useState("")
    const [showPw, setShowPw]     = useState(false)
    const [showCf, setShowCf]     = useState(false)

    // 약관 동의 상태 (consent_key 기준 Map, marketing 제외)
    const [agreed, setAgreed] = useState<Record<string, boolean>>({})

    // 광고성 정보 수신 채널 동의 (marketing 항목의 서브 옵션)
    const [marketingEmail, setMarketingEmail] = useState(false)
    const [marketingSms,   setMarketingSms]   = useState(false)

    // 약관 바텀시트
    const [openTerm, setOpenTerm] = useState<Term | null>(null)

    // 제출 상태
    const [loading, setLoading] = useState(false)
    const [error, setError]     = useState<string | null>(null)
    const [done, setDone]       = useState(false)

    // marketing 항목은 서브 체크박스로 분리 처리
    const normalTerms    = terms.filter((t) => t.consentKey !== "marketing")
    const marketingTerm  = terms.find((t) => t.consentKey === "marketing") ?? null

    const pwMatch      = confirm === "" || password === confirm
    const requiredKeys = normalTerms.filter((t) => t.isRequired).map((t) => t.consentKey)
    const allRequired  = requiredKeys.every((k) => agreed[k])
    const allChecked   = normalTerms.every((t) => agreed[t.consentKey]) && marketingEmail && marketingSms

    const canSubmit = name.trim() && email.trim() && password.length >= 6
        && password === confirm && allRequired

    const handleAllToggle = () => {
        const next = !allChecked
        setAgreed(Object.fromEntries(normalTerms.map((t) => [t.consentKey, next])))
        setMarketingEmail(next)
        setMarketingSms(next)
    }

    const toggle = (key: string) =>
        setAgreed((prev) => ({ ...prev, [key]: !prev[key] }))

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!canSubmit) return

        setLoading(true)
        setError(null)

        try {
            const isWithdrawn = await checkWithdrawnEmailAction(email)
            if (isWithdrawn) {
                setError("이 이메일은 탈퇴 처리된 계정입니다. 다른 이메일을 사용해 주세요.")
                setLoading(false)
                return
            }
        } catch { /* 차단하지 않고 진행 */ }

        const supabase = createSupabaseBrowserClient()
        const { data, error: authError } = await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
                data: { name: name.trim() },
                emailRedirectTo: `${window.location.origin}/confirm-email`,
            },
        })

        if (authError) {
            setError(
                authError.message.includes("already registered") || authError.message.includes("already exists")
                    ? "이미 사용 중인 이메일입니다."
                    : authError.message.includes("Password should be")
                    ? "비밀번호는 6자 이상이어야 합니다."
                    : `오류: ${authError.message}`
            )
            setLoading(false)
            return
        }

        // 약관 동의 내역 저장 (실패해도 가입 흐름 계속)
        if (data.user) {
            try {
                await saveConsentAction(data.user.id, marketingEmail, marketingSms)
            } catch { /* silent */ }
        }

        // 이메일 인증 없이 즉시 세션 생성 → 활성화 후 홈으로
        if (data.session && data.user) {
            await autoActivateCustomerAction(data.user.id)
            router.push("/")
            router.refresh()
            return
        }

        setDone(true)
        setLoading(false)
    }

    const inputBase = "w-full rounded-2xl px-4 py-3.5 text-sm outline-none transition-all"
    const inputStyle: React.CSSProperties = {
        backgroundColor: "var(--toss-page-bg)",
        color:           "var(--toss-text-primary)",
        border:          "1.5px solid var(--toss-border)",
    }

    if (done) {
        return (
            <div data-ui-id="page-signup-done" className="w-full max-w-[400px] text-center">
                <div className="bg-white rounded-3xl p-8 shadow-sm"
                    style={{ border: "1px solid var(--toss-border)" }}>
                    <CheckCircle2 className="size-12 mx-auto mb-4" style={{ color: "#00C471" }} />
                    <h2 className="text-lg font-black mb-2" style={{ color: "var(--toss-text-primary)" }}>
                        거의 다 됐어요!
                    </h2>
                    <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--toss-text-secondary)" }}>
                        <span className="font-semibold" style={{ color: "var(--toss-text-primary)" }}>{email}</span>
                        로 인증 메일을 보냈습니다.
                        <br />메일함을 확인하고 링크를 클릭하면 가입이 완료됩니다.
                    </p>
                    <a href="/login"
                        className="block w-full py-3.5 rounded-2xl text-sm font-bold text-white text-center transition-opacity hover:opacity-85"
                        style={{ backgroundColor: "var(--toss-blue)" }}>
                        로그인 화면으로
                    </a>
                </div>
            </div>
        )
    }

    return (
        <>
            <div data-ui-id="page-signup" className="w-full max-w-[400px]">

                {/* 브랜드 */}
                <div className="text-center mb-8">
                    <a href="/" className="inline-block">
                        <span className="font-black text-3xl tracking-tight" style={{ color: "var(--toss-blue)" }}>
                            뽀득삽
                        </span>
                    </a>
                    <p className="mt-2 text-sm" style={{ color: "var(--toss-text-secondary)" }}>
                        가입하고 첫 쇼핑을 시작하세요
                    </p>
                </div>

                <div className="bg-white rounded-3xl p-7 shadow-sm" style={{ border: "1px solid var(--toss-border)" }}>
                    <h1 className="text-xl font-black mb-6"
                        style={{ color: "var(--toss-text-primary)", letterSpacing: "-0.03em" }}>
                        회원가입
                    </h1>

                    <form onSubmit={handleSubmit} className="space-y-3">
                        {/* 이름 */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold" style={{ color: "var(--toss-text-secondary)" }}>이름</label>
                            <input type="text" autoComplete="name" placeholder="홍길동"
                                value={name} onChange={(e) => setName(e.target.value)} required
                                className={inputBase} style={inputStyle}
                                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--toss-blue)")}
                                onBlur={(e)  => (e.currentTarget.style.borderColor = "var(--toss-border)")} />
                        </div>

                        {/* 이메일 */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold" style={{ color: "var(--toss-text-secondary)" }}>이메일</label>
                            <input type="email" autoComplete="email" placeholder="example@email.com"
                                value={email} onChange={(e) => setEmail(e.target.value)} required
                                className={inputBase} style={inputStyle}
                                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--toss-blue)")}
                                onBlur={(e)  => (e.currentTarget.style.borderColor = "var(--toss-border)")} />
                        </div>

                        {/* 비밀번호 */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold" style={{ color: "var(--toss-text-secondary)" }}>
                                비밀번호
                                <span className="font-normal ml-1" style={{ color: "var(--toss-text-tertiary)" }}>(6자 이상)</span>
                            </label>
                            <div className="relative">
                                <input type={showPw ? "text" : "password"} autoComplete="new-password"
                                    placeholder="비밀번호를 입력하세요"
                                    value={password} onChange={(e) => setPassword(e.target.value)} required
                                    className={`${inputBase} pr-12`} style={inputStyle}
                                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--toss-blue)")}
                                    onBlur={(e)  => (e.currentTarget.style.borderColor = "var(--toss-border)")} />
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
                                <input type={showCf ? "text" : "password"} autoComplete="new-password"
                                    placeholder="비밀번호를 한 번 더 입력하세요"
                                    value={confirm} onChange={(e) => setConfirm(e.target.value)} required
                                    className={`${inputBase} pr-12`}
                                    style={{ ...inputStyle, borderColor: !pwMatch ? "var(--toss-red)" : "var(--toss-border)" }}
                                    onFocus={(e) => (e.currentTarget.style.borderColor = pwMatch ? "var(--toss-blue)" : "var(--toss-red)")}
                                    onBlur={(e)  => (e.currentTarget.style.borderColor = pwMatch ? "var(--toss-border)" : "var(--toss-red)")} />
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

                        {/* ── 약관 동의 ── */}
                        {terms.length > 0 && (
                            <div className="rounded-2xl overflow-hidden mt-1"
                                style={{ border: "1.5px solid var(--toss-border)" }}>

                                {/* 전체 동의 */}
                                <button
                                    type="button"
                                    onClick={handleAllToggle}
                                    data-ui-id="btn-signup-agree-all"
                                    className="w-full flex items-center gap-3 px-4 py-3.5 transition-colors"
                                    style={{ backgroundColor: allChecked ? "var(--toss-blue-light)" : "#F8F9FA" }}
                                >
                                    <span
                                        className="flex-shrink-0 size-5 rounded-md flex items-center justify-center transition-all"
                                        style={{
                                            border:          `2px solid ${allChecked ? "var(--toss-blue)" : "var(--toss-border)"}`,
                                            backgroundColor: allChecked ? "var(--toss-blue)" : "#fff",
                                        }}
                                    >
                                        {allChecked && <Check className="size-3 text-white" strokeWidth={3} />}
                                    </span>
                                    <span className="text-sm font-bold"
                                        style={{ color: allChecked ? "var(--toss-blue)" : "var(--toss-text-primary)" }}>
                                        아래 약관에 모두 동의합니다
                                    </span>
                                </button>

                                {/* 개별 항목 */}
                                <div className="px-4" style={{ borderTop: "1px solid var(--toss-border)" }}>
                                    {normalTerms.map((term) => (
                                        <ConsentItem
                                            key={term.consentKey}
                                            checked={!!agreed[term.consentKey]}
                                            onChange={() => toggle(term.consentKey)}
                                            required={term.isRequired}
                                            label={term.title}
                                            onView={() => setOpenTerm(term)}
                                        />
                                    ))}
                                    {marketingTerm && (
                                        <MarketingConsentItem
                                            term={marketingTerm}
                                            emailChecked={marketingEmail}
                                            smsChecked={marketingSms}
                                            onEmailChange={setMarketingEmail}
                                            onSmsChange={setMarketingSms}
                                            onView={() => setOpenTerm(marketingTerm)}
                                        />
                                    )}
                                </div>
                            </div>
                        )}

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

                    <div className="flex items-center gap-3 my-5">
                        <div className="flex-1 h-px" style={{ backgroundColor: "var(--toss-border)" }} />
                        <span className="text-xs" style={{ color: "var(--toss-text-tertiary)" }}>이미 계정이 있으신가요?</span>
                        <div className="flex-1 h-px" style={{ backgroundColor: "var(--toss-border)" }} />
                    </div>

                    <a data-ui-id="link-signup-login" href="/login"
                        className="block w-full py-3 rounded-2xl text-sm font-semibold text-center transition-colors hover:bg-gray-50"
                        style={{ color: "var(--toss-text-primary)", border: "1.5px solid var(--toss-border)" }}>
                        로그인
                    </a>
                </div>

                <p className="text-center mt-5 text-xs" style={{ color: "var(--toss-text-tertiary)" }}>
                    <a href="/" className="hover:underline">홈으로 돌아가기</a>
                </p>
            </div>

            <TermsSheet term={openTerm} onClose={() => setOpenTerm(null)} />
        </>
    )
}
