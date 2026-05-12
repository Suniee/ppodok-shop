"use client"

import { useState } from "react"
import { Loader2, Check, AlertTriangle } from "lucide-react"
import AddressInput, { type AddressValue } from "@/components/ui/AddressInput"
import { updateProfileAction, deleteAccountAction } from "./actions"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser"

interface Profile {
    email: string
    name: string | null
    phone: string | null
    postal_code: string | null
    address: string | null
    address_detail: string | null
}

// 숫자만 추출 후 한국 전화번호 형식으로 변환
// 02-XXXX-XXXX / 010-XXXX-XXXX / 0XX-XXXX-XXXX
function formatPhone(raw: string): string {
    const d = raw.replace(/\D/g, "").slice(0, 11)
    if (d.startsWith("02")) {
        if (d.length <= 2)  return d
        if (d.length <= 6)  return `${d.slice(0, 2)}-${d.slice(2)}`
        if (d.length <= 9)  return `${d.slice(0, 2)}-${d.slice(2, 5)}-${d.slice(5)}`
        return                     `${d.slice(0, 2)}-${d.slice(2, 6)}-${d.slice(6, 10)}`
    }
    if (d.length <= 3)  return d
    if (d.length <= 7)  return `${d.slice(0, 3)}-${d.slice(3)}`
    if (d.length <= 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`
    return                     `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7, 11)}`
}

const inputCls = "w-full rounded-2xl px-4 py-3 text-sm outline-none transition-all"
const inputStyle: React.CSSProperties = {
    backgroundColor: "#ffffff",
    border: "1.5px solid var(--toss-border)",
    color: "var(--toss-text-primary)",
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
                <span className="text-xs font-semibold" style={{ color: "var(--toss-text-secondary)" }}>{label}</span>
                {hint && <span className="text-[11px]" style={{ color: "var(--toss-text-tertiary)" }}>{hint}</span>}
            </div>
            {children}
        </div>
    )
}

export default function AccountForm({ profile }: { profile: Profile }) {
    const [name, setName]   = useState(profile.name ?? "")
    const [phone, setPhone] = useState(profile.phone ?? "")
    const [address, setAddress] = useState<AddressValue>({
        postalCode:    profile.postal_code    ?? "",
        address:       profile.address        ?? "",
        addressDetail: profile.address_detail ?? "",
    })
    const [saving, setSaving]     = useState(false)
    const [saved, setSaved]       = useState(false)
    const [error, setError]       = useState<string | null>(null)

    // 회원탈퇴 상태
    const [withdrawOpen, setWithdrawOpen]   = useState(false)
    const [withdrawInput, setWithdrawInput] = useState("")
    const [withdrawing, setWithdrawing]     = useState(false)
    const [withdrawError, setWithdrawError] = useState<string | null>(null)

    const handleWithdraw = async () => {
        setWithdrawing(true)
        setWithdrawError(null)
        try {
            await deleteAccountAction()
            // 서버에서 유저 삭제 후 클라이언트 세션도 정리하고 강제 이동
            await createSupabaseBrowserClient().auth.signOut()
            window.location.replace("/?toast=withdrawn")
        } catch (err) {
            setWithdrawError((err as Error).message ?? "탈퇴 처리 중 오류가 발생했습니다.")
            setWithdrawing(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setSaved(false)
        setError(null)

        try {
            await updateProfileAction({
                name,
                phone,
                postalCode:    address.postalCode,
                address:       address.address,
                addressDetail: address.addressDetail,
            })
            setSaved(true)
            setTimeout(() => { window.location.href = "/" }, 800)
        } catch (err) {
            setError((err as Error).message ?? "저장 중 오류가 발생했습니다.")
        } finally {
            setSaving(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* 이메일 (변경 불가) */}
            <Field label="이메일" hint="변경 불가">
                <input
                    type="email"
                    readOnly
                    value={profile.email}
                    className={inputCls}
                    style={{ ...inputStyle, backgroundColor: "#F9FAFB", cursor: "not-allowed" }}
                />
            </Field>

            {/* 이름 */}
            <Field label="이름">
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="이름을 입력하세요"
                    className={inputCls}
                    style={inputStyle}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--toss-blue)")}
                    onBlur={(e)  => (e.currentTarget.style.borderColor = "var(--toss-border)")}
                />
            </Field>

            {/* 연락처 */}
            <Field label="연락처">
                <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    placeholder="010-0000-0000"
                    maxLength={14}
                    className={inputCls}
                    style={inputStyle}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--toss-blue)")}
                    onBlur={(e)  => (e.currentTarget.style.borderColor = "var(--toss-border)")}
                />
            </Field>

            {/* 주소 */}
            <Field label="배송지 주소">
                <AddressInput value={address} onChange={setAddress} />
            </Field>

            {/* 에러 메시지 */}
            {error && (
                <div className="rounded-2xl px-4 py-3 text-xs font-medium"
                    style={{ backgroundColor: "#FFF0F0", color: "var(--toss-red)" }}>
                    {error}
                </div>
            )}

            {/* 저장 버튼 */}
            <button
                data-ui-id="btn-account-save"
                type="submit"
                disabled={saving}
                className="w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-85 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: saved ? "#00C471" : "var(--toss-blue)" }}
            >
                {saving ? (
                    <><Loader2 className="size-4 animate-spin" />저장 중...</>
                ) : saved ? (
                    <><Check className="size-4" />저장되었습니다</>
                ) : "저장하기"}
            </button>

            {/* 구분선 */}
            <div className="pt-2" style={{ borderTop: "1px solid var(--toss-border)" }} />

            {/* 회원탈퇴 섹션 */}
            {!withdrawOpen ? (
                <button
                    data-ui-id="btn-account-withdraw-open"
                    type="button"
                    onClick={() => setWithdrawOpen(true)}
                    className="w-full py-3 rounded-2xl text-sm font-semibold transition-colors hover:bg-red-50"
                    style={{ color: "var(--toss-red)", border: "1px solid #FFCDD2" }}
                >
                    회원탈퇴
                </button>
            ) : (
                <div
                    data-ui-id="section-account-withdraw"
                    className="rounded-2xl p-5 space-y-4"
                    style={{ backgroundColor: "#FFF5F5", border: "1px solid #FFCDD2" }}
                >
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="size-5 flex-shrink-0 mt-0.5" style={{ color: "var(--toss-red)" }} />
                        <div>
                            <p className="text-sm font-bold" style={{ color: "var(--toss-red)" }}>정말 탈퇴하시겠어요?</p>
                            <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--toss-text-secondary)" }}>
                                탈퇴 시 계정 정보가 모두 삭제되며 복구할 수 없습니다.<br />
                                동일한 이메일로 24시간 이내 재가입이 불가능합니다.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold" style={{ color: "var(--toss-text-secondary)" }}>
                            확인을 위해 <span style={{ color: "var(--toss-red)" }}>탈퇴합니다</span> 를 입력하세요
                        </label>
                        <input
                            type="text"
                            value={withdrawInput}
                            onChange={(e) => setWithdrawInput(e.target.value)}
                            placeholder="탈퇴합니다"
                            className={inputCls}
                            style={{ ...inputStyle, borderColor: "#FFCDD2", backgroundColor: "#fff" }}
                            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--toss-red)")}
                            onBlur={(e)  => (e.currentTarget.style.borderColor = "#FFCDD2")}
                        />
                    </div>

                    {withdrawError && (
                        <div className="rounded-2xl px-4 py-3 text-xs font-medium"
                            style={{ backgroundColor: "#FFF0F0", color: "var(--toss-red)" }}>
                            {withdrawError}
                        </div>
                    )}

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => { setWithdrawOpen(false); setWithdrawInput(""); setWithdrawError(null) }}
                            className="flex-1 py-3 rounded-2xl text-sm font-semibold transition-colors hover:bg-gray-50"
                            style={{ color: "var(--toss-text-secondary)", border: "1px solid var(--toss-border)" }}
                        >
                            취소
                        </button>
                        <button
                            data-ui-id="btn-account-withdraw-confirm"
                            type="button"
                            onClick={handleWithdraw}
                            disabled={withdrawing || withdrawInput !== "탈퇴합니다"}
                            className="flex-1 py-3 rounded-2xl text-sm font-bold text-white transition-opacity hover:opacity-85 disabled:opacity-40 flex items-center justify-center gap-2"
                            style={{ backgroundColor: "var(--toss-red)" }}
                        >
                            {withdrawing
                                ? <><Loader2 className="size-4 animate-spin" />처리 중...</>
                                : "탈퇴하기"}
                        </button>
                    </div>
                </div>
            )}
        </form>
    )
}
