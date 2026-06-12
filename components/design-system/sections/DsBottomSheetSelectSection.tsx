"use client"

import { useState } from "react"
import { DsBottomSheetSelect } from "@/components/ui/ds-bottom-sheet-select"

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
    { value: "skt",      label: "SKT" },
    { value: "kt",       label: "KT" },
    { value: "lgu",      label: "LG U+" },
    { value: "skt-mvno", label: "SKT 알뜰폰",  description: "SKT망 사용" },
    { value: "kt-mvno",  label: "KT 알뜰폰",   description: "KT망 사용" },
    { value: "lgu-mvno", label: "LG U+ 알뜰폰", description: "LG U+망 사용" },
]

const BANKS = [
    { value: "kb",      label: "KB국민은행" },
    { value: "shinhan", label: "신한은행" },
    { value: "woori",   label: "우리은행" },
    { value: "hana",    label: "하나은행" },
    { value: "nh",      label: "NH농협은행" },
    { value: "ibk",     label: "IBK기업은행" },
    { value: "kakao",   label: "카카오뱅크" },
    { value: "toss",    label: "토스뱅크" },
]

export function DsBottomSheetSelectSection() {
    const [carrier, setCarrier] = useState("")
    const [bank, setBank]       = useState("")

    return (
        <Section title="📋 Bottom Sheet Select">
            <div className="space-y-10">

                {/* 기본 — 통신사 */}
                <Demo label="기본 — 통신사 선택">
                    <div className="max-w-sm space-y-3">
                        <p className="text-base font-bold" style={{ color: "var(--toss-text-primary)", letterSpacing: "-0.02em" }}>
                            통신사를 선택해주세요.
                        </p>
                        <DsBottomSheetSelect
                            options={CARRIERS}
                            placeholder="통신사"
                            title="통신사 선택"
                            value={carrier}
                            onChange={setCarrier}
                        />
                        {carrier && (
                            <p className="text-xs" style={{ color: "var(--toss-text-tertiary)" }}>
                                선택된 통신사:{" "}
                                <span className="font-bold" style={{ color: "var(--toss-blue)" }}>
                                    {CARRIERS.find((c) => c.value === carrier)?.label}
                                </span>
                            </p>
                        )}
                    </div>
                </Demo>

                {/* description 포함 — 은행 */}
                <Demo label="항목 부연 설명 포함 — 은행 선택">
                    <div className="max-w-sm">
                        <DsBottomSheetSelect
                            options={BANKS}
                            placeholder="은행 선택"
                            title="은행 선택"
                            value={bank}
                            onChange={setBank}
                        />
                    </div>
                </Demo>

                {/* 비활성화 */}
                <Demo label="Disabled">
                    <div className="max-w-sm">
                        <DsBottomSheetSelect
                            options={CARRIERS}
                            placeholder="통신사"
                            title="통신사 선택"
                            value="skt"
                            disabled
                        />
                    </div>
                </Demo>

                {/* Props 테이블 */}
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--toss-text-tertiary)" }}>Props</p>
                    <div className="rounded-2xl overflow-hidden text-xs" style={{ border: "1px solid var(--toss-border)" }}>
                        {[
                            { prop: "options",     type: "BottomSheetOption[]", desc: "선택지 목록 (value, label, description?)" },
                            { prop: "value",       type: "string",              desc: "선택된 값" },
                            { prop: "onChange",    type: "(value) => void",     desc: "선택 변경 콜백" },
                            { prop: "placeholder", type: "string",              desc: "미선택 상태 표시 텍스트 (기본: '선택')" },
                            { prop: "title",       type: "string",              desc: "바텀시트 헤더 타이틀 (기본: '선택')" },
                            { prop: "disabled",    type: "boolean",             desc: "비활성화 (기본: false)" },
                        ].map((row, i, arr) => (
                            <div key={row.prop}
                                className="grid grid-cols-[120px_160px_1fr] gap-3 px-4 py-3"
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
