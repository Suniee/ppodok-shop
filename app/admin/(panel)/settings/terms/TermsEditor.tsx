"use client"

import { useState, useTransition } from "react"
import ReactMarkdown from "react-markdown"
import type { Components } from "react-markdown"
import { ChevronDown, ChevronUp, Loader2, CheckCircle2 } from "lucide-react"
import { updateTermAction } from "./actions"
import type { Term } from "@/lib/supabase/terms"

const inputCls  = "rounded-xl px-3 py-2.5 text-sm outline-none transition-all w-full"
const inputStyle = {
    backgroundColor: "var(--toss-page-bg)",
    color:           "var(--toss-text-primary)",
    border:          "1px solid var(--toss-border)",
}

// 미리보기 렌더링 컴포넌트 매핑
const previewComponents: Components = {
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
        <p className="text-xs leading-relaxed mb-2" style={{ color: "var(--toss-text-secondary)" }}>
            {children}
        </p>
    ),
    ul: ({ children }) => (
        <ul className="list-disc pl-4 mb-2 space-y-0.5" style={{ color: "var(--toss-text-secondary)" }}>
            {children}
        </ul>
    ),
    li: ({ children }) => (
        <li className="text-xs leading-relaxed">{children}</li>
    ),
    strong: ({ children }) => (
        <strong className="font-semibold" style={{ color: "var(--toss-text-primary)" }}>
            {children}
        </strong>
    ),
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

// 약관 1건 편집 패널
function TermItem({ term }: { term: Term }) {
    const [open,        setOpen]        = useState(false)
    const [contentTab,  setContentTab]  = useState<"edit" | "preview">("edit")
    const [title,       setTitle]       = useState(term.title)
    const [version,     setVersion]     = useState(term.version)
    const [effectiveAt, setEffectiveAt] = useState(term.effectiveAt.slice(0, 10))
    const [content,     setContent]     = useState(term.content)
    const [saved,       setSaved]       = useState(false)
    const [errorMsg,    setErrorMsg]    = useState<string | null>(null)
    const [isPending,   startTransition] = useTransition()

    const handleSave = () => {
        setSaved(false)
        setErrorMsg(null)
        startTransition(async () => {
            const result = await updateTermAction(term.id, { title, version, effectiveAt, content })
            if ("error" in result) {
                setErrorMsg(result.error)
            } else {
                setSaved(true)
                setTimeout(() => setSaved(false), 3000)
            }
        })
    }

    return (
        <div
            data-ui-id={`card-terms-${term.consentKey}`}
            className="rounded-2xl overflow-hidden"
            style={{ border: "1px solid var(--toss-border)", backgroundColor: "white" }}
        >
            {/* 아코디언 헤더 */}
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors hover:bg-gray-50"
            >
                <div className="flex items-center gap-3">
                    <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{
                            backgroundColor: term.isRequired ? "var(--toss-blue-light)" : "var(--toss-page-bg)",
                            color:           term.isRequired ? "var(--toss-blue)"        : "var(--toss-text-secondary)",
                        }}
                    >
                        {term.isRequired ? "필수" : "선택"}
                    </span>
                    <span className="text-sm font-semibold" style={{ color: "var(--toss-text-primary)" }}>
                        {title}
                    </span>
                    <span className="text-xs" style={{ color: "var(--toss-text-secondary)" }}>
                        v{version}
                    </span>
                </div>
                {open
                    ? <ChevronUp   className="size-4 shrink-0" style={{ color: "var(--toss-text-secondary)" }} />
                    : <ChevronDown className="size-4 shrink-0" style={{ color: "var(--toss-text-secondary)" }} />
                }
            </button>

            {/* 편집 폼 */}
            {open && (
                <div className="px-5 pb-5 space-y-4" style={{ borderTop: "1px solid var(--toss-border)" }}>

                    {/* 제목·버전·시행일 */}
                    <div className="grid grid-cols-2 gap-4 pt-4">
                        <Field label="약관 제목">
                            <input
                                data-ui-id={`input-terms-title-${term.consentKey}`}
                                className={inputCls}
                                style={inputStyle}
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </Field>
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="버전">
                                <input
                                    data-ui-id={`input-terms-version-${term.consentKey}`}
                                    className={inputCls}
                                    style={inputStyle}
                                    value={version}
                                    onChange={(e) => setVersion(e.target.value)}
                                    placeholder="1.0"
                                />
                            </Field>
                            <Field label="시행일">
                                <input
                                    data-ui-id={`input-terms-effectiveAt-${term.consentKey}`}
                                    type="date"
                                    className={inputCls}
                                    style={inputStyle}
                                    value={effectiveAt}
                                    onChange={(e) => setEffectiveAt(e.target.value)}
                                />
                            </Field>
                        </div>
                    </div>

                    {/* 편집 / 미리보기 탭 */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold" style={{ color: "var(--toss-text-secondary)" }}>
                                약관 내용
                            </span>
                            <div
                                className="flex rounded-xl overflow-hidden text-xs font-semibold"
                                style={{ border: "1px solid var(--toss-border)" }}
                            >
                                {(["edit", "preview"] as const).map((tab) => (
                                    <button
                                        key={tab}
                                        type="button"
                                        onClick={() => setContentTab(tab)}
                                        className="px-4 py-1.5 transition-colors"
                                        style={{
                                            backgroundColor: contentTab === tab ? "var(--toss-blue)" : "white",
                                            color:           contentTab === tab ? "white"            : "var(--toss-text-secondary)",
                                        }}
                                    >
                                        {tab === "edit" ? "편집" : "미리보기"}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {contentTab === "edit" ? (
                            <textarea
                                data-ui-id={`textarea-terms-content-${term.consentKey}`}
                                className={inputCls}
                                style={{
                                    ...inputStyle,
                                    resize:     "vertical",
                                    minHeight:  "300px",
                                    lineHeight: "1.7",
                                    fontFamily: "ui-monospace, 'Courier New', monospace",
                                    fontSize:   "0.78rem",
                                }}
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                            />
                        ) : (
                            <div
                                data-ui-id={`preview-terms-${term.consentKey}`}
                                className="rounded-xl px-4 py-4 overflow-y-auto"
                                style={{
                                    minHeight:       "300px",
                                    maxHeight:       "520px",
                                    border:          "1px solid var(--toss-border)",
                                    backgroundColor: "var(--toss-page-bg)",
                                }}
                            >
                                <ReactMarkdown components={previewComponents}>
                                    {content}
                                </ReactMarkdown>
                            </div>
                        )}
                    </div>

                    {/* 저장 버튼 */}
                    <div className="flex items-center gap-3 pt-1">
                        <button
                            data-ui-id={`btn-terms-save-${term.consentKey}`}
                            type="button"
                            onClick={handleSave}
                            disabled={isPending}
                            className="px-5 py-2.5 rounded-2xl text-sm font-semibold text-white transition-opacity hover:opacity-85 disabled:opacity-50 flex items-center gap-2"
                            style={{ backgroundColor: "var(--toss-blue)" }}
                        >
                            {isPending
                                ? <><Loader2 className="size-4 animate-spin" />저장 중...</>
                                : "저장"
                            }
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
            )}
        </div>
    )
}

export default function TermsEditor({ terms }: { terms: Term[] }) {
    return (
        <div data-ui-id="page-admin-terms" className="space-y-3">
            {terms.map((t) => (
                <TermItem key={t.id} term={t} />
            ))}
        </div>
    )
}
