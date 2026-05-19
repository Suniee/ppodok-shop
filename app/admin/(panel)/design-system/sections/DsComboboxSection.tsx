"use client"

import { useState } from "react"
import { DsCombobox } from "@/components/ui/ds-combobox"
import { Wifi, Phone, Signal } from "lucide-react"

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="bg-white rounded-3xl p-8" style={{ border: "1px solid var(--toss-border)" }}>
            <h2
                className="text-lg font-bold mb-6 pb-4"
                style={{ color: "var(--toss-text-primary)", borderBottom: "1px solid var(--toss-border)", letterSpacing: "-0.02em" }}
            >
                {title}
            </h2>
            {children}
        </section>
    )
}

function Demo({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--toss-text-tertiary)" }}>
                {label}
            </p>
            {children}
        </div>
    )
}

const CARRIERS = [
    { value: "skt",     label: "SKT" },
    { value: "kt",      label: "KT" },
    { value: "lgu",     label: "LG U+" },
    { value: "mvno",    label: "알뜰폰" },
]

const CARRIERS_FULL = [
    { value: "skt",      label: "SKT" },
    { value: "kt",       label: "KT" },
    { value: "lgu",      label: "LG U+" },
    { value: "skt-mvno", label: "SKT 알뜰폰", description: "SKT망 사용" },
    { value: "kt-mvno",  label: "KT 알뜰폰",  description: "KT망 사용" },
    { value: "lgu-mvno", label: "LG 알뜰폰",  description: "LG U+망 사용" },
]

const PAYMENT = [
    { value: "card",     label: "신용카드" },
    { value: "transfer", label: "계좌이체" },
    { value: "phone",    label: "휴대폰 결제" },
    { value: "point",    label: "포인트" },
]

const GENDER = [
    { value: "m", label: "남성" },
    { value: "f", label: "여성" },
]

const INTEREST = [
    { value: "food",     label: "푸드",     icon: <span className="text-xl">🍱</span> },
    { value: "fashion",  label: "패션",     icon: <span className="text-xl">👗</span> },
    { value: "beauty",   label: "뷰티",     icon: <span className="text-xl">💄</span> },
    { value: "tech",     label: "테크",     icon: <span className="text-xl">💻</span> },
    { value: "travel",   label: "여행",     icon: <span className="text-xl">✈️</span> },
    { value: "fitness",  label: "피트니스", icon: <span className="text-xl">🏋️</span> },
]

export function DsComboboxSection() {
    const [carrier, setCarrier]           = useState("")
    const [carrierFull, setCarrierFull]   = useState("")
    const [payment, setPayment]           = useState("")
    const [gender, setGender]             = useState("")
    const [interests, setInterests]       = useState<string[]>([])

    return (
        <Section title="🗂️ Combobox (Option Picker)">
            <div className="space-y-10">

                {/* 통신사 선택 — 핵심 예시 */}
                <Demo label="통신사 선택 — 3열 (Toss 스타일)">
                    <div className="max-w-sm space-y-3">
                        <p className="text-base font-bold" style={{ color: "var(--toss-text-primary)", letterSpacing: "-0.02em" }}>
                            통신사를 선택해 주세요
                        </p>
                        <DsCombobox
                            options={CARRIERS}
                            columns={3}
                            value={carrier}
                            onChange={setCarrier}
                        />
                        {carrier && (
                            <p className="text-xs" style={{ color: "var(--toss-text-tertiary)" }}>
                                선택된 통신사: <span className="font-bold" style={{ color: "var(--toss-blue)" }}>{CARRIERS.find(c => c.value === carrier)?.label}</span>
                            </p>
                        )}
                    </div>
                </Demo>

                {/* 통신사 전체 — 부연 설명 포함, 3열 */}
                <Demo label="통신사 선택 — 부연 설명 포함 (3열)">
                    <div className="max-w-sm space-y-3">
                        <p className="text-base font-bold" style={{ color: "var(--toss-text-primary)", letterSpacing: "-0.02em" }}>
                            통신사를 선택해 주세요
                        </p>
                        <DsCombobox
                            options={CARRIERS_FULL}
                            columns={3}
                            value={carrierFull}
                            onChange={setCarrierFull}
                        />
                    </div>
                </Demo>

                {/* 결제 수단 — 2열 */}
                <Demo label="결제 수단 — 2열">
                    <div className="max-w-xs">
                        <DsCombobox
                            options={PAYMENT}
                            columns={2}
                            value={payment}
                            onChange={setPayment}
                        />
                    </div>
                </Demo>

                {/* 성별 — 2열, sm 사이즈 */}
                <Demo label="성별 선택 — 2열 · SM">
                    <div className="max-w-xs">
                        <DsCombobox
                            options={GENDER}
                            columns={2}
                            size="sm"
                            value={gender}
                            onChange={setGender}
                        />
                    </div>
                </Demo>

                {/* 다중 선택 — 아이콘 포함 */}
                <Demo label="관심사 다중 선택 — 아이콘 · 3열 · Multiple">
                    <div className="max-w-sm space-y-3">
                        <DsCombobox
                            options={INTEREST}
                            columns={3}
                            multiple
                            value={interests}
                            onChange={setInterests}
                        />
                        {interests.length > 0 && (
                            <p className="text-xs" style={{ color: "var(--toss-text-tertiary)" }}>
                                선택: <span className="font-bold" style={{ color: "var(--toss-blue)" }}>
                                    {interests.map(v => INTEREST.find(i => i.value === v)?.label).join(", ")}
                                </span>
                            </p>
                        )}
                    </div>
                </Demo>

                {/* 비활성화 */}
                <Demo label="Disabled">
                    <div className="max-w-sm">
                        <DsCombobox
                            options={CARRIERS}
                            columns={3}
                            value="kt"
                            disabled
                            onChange={() => {}}
                        />
                    </div>
                </Demo>

                {/* Props 테이블 */}
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--toss-text-tertiary)" }}>Props</p>
                    <div className="rounded-2xl overflow-hidden text-xs" style={{ border: "1px solid var(--toss-border)" }}>
                        {[
                            { prop: "options",   type: "ComboboxOption[]",         desc: "선택지 목록 (value, label, description?, icon?)" },
                            { prop: "value",     type: "string | string[]",         desc: "선택된 값. multiple=true이면 string[]" },
                            { prop: "onChange",  type: "(value) => void",            desc: "선택 변경 콜백" },
                            { prop: "multiple",  type: "boolean",                   desc: "다중 선택 여부 (기본: false)" },
                            { prop: "columns",   type: "2 | 3 | 4",                 desc: "그리드 열 수 (기본: 3)" },
                            { prop: "size",      type: '"sm" | "md"',               desc: "카드 크기 (기본: md)" },
                            { prop: "disabled",  type: "boolean",                   desc: "비활성화 (기본: false)" },
                        ].map((row, i, arr) => (
                            <div key={row.prop}
                                className="grid grid-cols-[100px_140px_1fr] gap-3 px-4 py-3"
                                style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--toss-border)" : undefined }}>
                                <span className="font-mono font-bold" style={{ color: "var(--toss-blue)" }}>{row.prop}</span>
                                <span className="font-mono" style={{ color: "var(--toss-text-secondary)" }}>{row.type}</span>
                                <span style={{ color: "var(--toss-text-tertiary)" }}>{row.desc}</span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </Section>
    )
}
