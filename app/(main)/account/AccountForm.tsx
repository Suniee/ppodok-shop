"use client"

import { useState } from "react"
import { Loader2, Check } from "lucide-react"
import AddressInput, { type AddressValue } from "@/components/ui/AddressInput"
import { updateProfileAction } from "./actions"

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
            setTimeout(() => setSaved(false), 3000)
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
        </form>
    )
}
