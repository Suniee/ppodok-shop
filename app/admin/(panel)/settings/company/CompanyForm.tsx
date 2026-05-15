"use client"

import { useState, useTransition } from "react"
import { Loader2, CheckCircle2 } from "lucide-react"
import { saveCompanyInfoAction } from "./actions"
import type { CompanyInfo } from "@/lib/supabase/company"

const inputCls = "rounded-xl px-3 py-2.5 text-sm outline-none transition-all w-full"
const inputStyle = {
    backgroundColor: "var(--toss-page-bg)",
    color: "var(--toss-text-primary)",
    border: "1px solid var(--toss-border)",
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold" style={{ color: "var(--toss-text-secondary)" }}>
                {label}
            </span>
            {children}
        </label>
    )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <h2 className="text-sm font-bold pt-2 pb-1" style={{ color: "var(--toss-text-secondary)", borderBottom: "1px solid var(--toss-border)" }}>
            {children}
        </h2>
    )
}

export default function CompanyForm({ initial }: { initial: Omit<CompanyInfo, "id" | "updated_at"> }) {
    const [form, setForm] = useState(initial)
    const [saved, setSaved] = useState(false)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((f) => ({ ...f, [key]: e.target.value }))

    const handleSave = () => {
        setSaved(false)
        setErrorMsg(null)
        startTransition(async () => {
            const result = await saveCompanyInfoAction(form)
            if ("error" in result) {
                setErrorMsg(result.error)
            } else {
                setSaved(true)
                setTimeout(() => setSaved(false), 3000)
            }
        })
    }

    return (
        <div data-ui-id="page-admin-company" className="space-y-6">

            {/* 기본 사업자 정보 */}
            <section className="space-y-4">
                <SectionTitle>사업자 정보</SectionTitle>
                <div className="grid grid-cols-2 gap-4">
                    <Field label="상호명">
                        <input data-ui-id="input-company-name" className={inputCls} style={inputStyle}
                            value={form.company_name} onChange={set("company_name")} placeholder="뽀득삽" />
                    </Field>
                    <Field label="대표자">
                        <input data-ui-id="input-company-representative" className={inputCls} style={inputStyle}
                            value={form.representative} onChange={set("representative")} placeholder="홍길동" />
                    </Field>
                    <Field label="사업자등록번호">
                        <input data-ui-id="input-company-business-number" className={inputCls} style={inputStyle}
                            value={form.business_number} onChange={set("business_number")} placeholder="000-00-00000" />
                    </Field>
                    <Field label="통신판매신고번호">
                        <input data-ui-id="input-company-mail-order-number" className={inputCls} style={inputStyle}
                            value={form.mail_order_number} onChange={set("mail_order_number")} placeholder="제0000-서울강서-0000호" />
                    </Field>
                </div>
                <Field label="주소">
                    <input data-ui-id="input-company-address" className={inputCls} style={inputStyle}
                        value={form.address} onChange={set("address")} placeholder="서울특별시 강서구 마곡동 000-00" />
                </Field>
            </section>

            {/* 고객센터 */}
            <section className="space-y-4">
                <SectionTitle>고객센터</SectionTitle>
                <div className="grid grid-cols-2 gap-4">
                    <Field label="전화번호">
                        <input data-ui-id="input-company-phone" className={inputCls} style={inputStyle}
                            value={form.phone} onChange={set("phone")} placeholder="02-0000-0000" />
                    </Field>
                    <Field label="운영시간">
                        <input data-ui-id="input-company-support-hours" className={inputCls} style={inputStyle}
                            value={form.support_hours} onChange={set("support_hours")} placeholder="평일 10:00~18:00, 주말·공휴일 휴무" />
                    </Field>
                </div>
            </section>

            {/* SNS */}
            <section className="space-y-4">
                <SectionTitle>SNS 링크</SectionTitle>
                <div className="grid grid-cols-2 gap-4">
                    <Field label="Facebook URL">
                        <input data-ui-id="input-company-sns-facebook" className={inputCls} style={inputStyle}
                            value={form.sns_facebook} onChange={set("sns_facebook")} placeholder="https://facebook.com/..." />
                    </Field>
                    <Field label="Instagram URL">
                        <input data-ui-id="input-company-sns-instagram" className={inputCls} style={inputStyle}
                            value={form.sns_instagram} onChange={set("sns_instagram")} placeholder="https://instagram.com/..." />
                    </Field>
                    <Field label="네이버 블로그/스토어 URL">
                        <input data-ui-id="input-company-sns-naver" className={inputCls} style={inputStyle}
                            value={form.sns_naver} onChange={set("sns_naver")} placeholder="https://smartstore.naver.com/..." />
                    </Field>
                    <Field label="카카오 채널 URL">
                        <input data-ui-id="input-company-sns-kakao" className={inputCls} style={inputStyle}
                            value={form.sns_kakao} onChange={set("sns_kakao")} placeholder="https://pf.kakao.com/..." />
                    </Field>
                </div>
            </section>

            {/* 기타 */}
            <section className="space-y-4">
                <SectionTitle>기타</SectionTitle>
                <Field label="저작권 문구">
                    <input data-ui-id="input-company-copyright" className={inputCls} style={inputStyle}
                        value={form.copyright} onChange={set("copyright")} placeholder="© 2025 뽀득삽. All Rights Reserved." />
                </Field>
            </section>

            {/* 저장 버튼 */}
            <div className="flex items-center gap-3 pt-2">
                <button
                    data-ui-id="btn-company-save"
                    onClick={handleSave}
                    disabled={isPending}
                    className="px-6 py-3 rounded-2xl text-sm font-semibold text-white transition-opacity hover:opacity-85 disabled:opacity-50 flex items-center gap-2"
                    style={{ backgroundColor: "var(--toss-blue)" }}
                >
                    {isPending ? <><Loader2 className="size-4 animate-spin" />저장 중...</> : "저장"}
                </button>
                {saved && (
                    <span className="flex items-center gap-1.5 text-sm font-medium" style={{ color: "#00A878" }}>
                        <CheckCircle2 className="size-4" />저장됐습니다.
                    </span>
                )}
                {errorMsg && (
                    <span className="text-sm" style={{ color: "var(--toss-red)" }}>{errorMsg}</span>
                )}
            </div>
        </div>
    )
}
