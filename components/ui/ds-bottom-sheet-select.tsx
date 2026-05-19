"use client"

// 토스 스타일 바텀시트 셀렉트 — 인풋 클릭 시 하단에서 드로어가 올라오는 선택 UI
// 모바일 친화적이며 네이티브 select 대비 디자인 일관성이 높음

import { useState, useEffect } from "react"
import { ChevronDown, X } from "lucide-react"

export type BottomSheetOption = {
    value:        string
    label:        string
    description?: string
}

export type DsBottomSheetSelectProps = {
    options:      BottomSheetOption[]
    value?:       string
    onChange?:    (value: string) => void
    placeholder?: string
    title?:       string
    disabled?:    boolean
}

export function DsBottomSheetSelect({
    options,
    value,
    onChange,
    placeholder = "선택",
    title       = "선택",
    disabled    = false,
}: DsBottomSheetSelectProps) {
    const [open, setOpen]       = useState(false)
    const [visible, setVisible] = useState(false)

    const selectedLabel = options.find((o) => o.value === value)?.label

    const openSheet = () => {
        if (disabled) return
        setOpen(true)
    }

    const closeSheet = () => {
        setVisible(false)
        // 슬라이드 다운 애니메이션(300ms) 후 DOM에서 제거
        setTimeout(() => setOpen(false), 300)
    }

    const handleSelect = (val: string) => {
        onChange?.(val)
        closeSheet()
    }

    // open 상태가 되면 다음 프레임에서 visible을 true로 — CSS transition 발동용
    useEffect(() => {
        if (!open) return
        const t = setTimeout(() => setVisible(true), 16)
        return () => clearTimeout(t)
    }, [open])

    // ESC 키로 닫기
    useEffect(() => {
        if (!open) return
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") closeSheet() }
        window.addEventListener("keydown", handler)
        return () => window.removeEventListener("keydown", handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open])

    return (
        <>
            {/* 트리거 인풋 */}
            <button
                type="button"
                onClick={openSheet}
                disabled={disabled}
                className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                    border:          "1px solid var(--toss-border)",
                    backgroundColor: "#fff",
                    color:           selectedLabel ? "var(--toss-text-primary)" : "var(--toss-text-tertiary)",
                }}>
                <span className="text-sm font-medium">
                    {selectedLabel ?? placeholder}
                </span>
                <ChevronDown
                    className="size-4 flex-shrink-0 transition-transform duration-300"
                    style={{
                        color:     "var(--toss-text-tertiary)",
                        transform: open ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                />
            </button>

            {/* 바텀시트 — 오버레이와 시트를 각각 fixed로 분리해 bottom:0 직접 고정 */}
            {open && (
                <>
                    {/* 어두운 오버레이 */}
                    <div
                        className="transition-opacity duration-300"
                        style={{
                            position:        "fixed",
                            inset:           0,
                            zIndex:          50,
                            backgroundColor: "rgba(0,0,0,0.45)",
                            opacity:         visible ? 1 : 0,
                        }}
                        onClick={closeSheet}
                    />

                    {/* 시트 본체 — bottom:0 직접 고정으로 화면 최하단 밀착 */}
                    <div
                        className="bg-white rounded-t-3xl transition-transform duration-300"
                        style={{
                            position:   "fixed",
                            left:       0,
                            right:      0,
                            bottom:     0,
                            zIndex:     51,
                            maxHeight:  "60vh",
                            overflow:   "hidden",
                            boxShadow:  "0 -4px 24px rgba(0,0,0,0.12)",
                            transform:  visible ? "translateY(0)" : "translateY(100%)",
                        }}>

                        {/* 핸들 바 */}
                        <div className="flex justify-center pt-3 pb-1">
                            <div className="w-10 h-1 rounded-full" style={{ backgroundColor: "var(--toss-border)" }} />
                        </div>

                        {/* 헤더 */}
                        <div className="flex items-center justify-between px-5 py-4"
                            style={{ borderBottom: "1px solid var(--toss-border)" }}>
                            <span className="text-base font-bold" style={{ color: "var(--toss-text-primary)", letterSpacing: "-0.02em" }}>
                                {title}
                            </span>
                            <button
                                type="button"
                                onClick={closeSheet}
                                className="p-1.5 rounded-xl hover:bg-gray-100 transition-colors">
                                <X className="size-5" style={{ color: "var(--toss-text-secondary)" }} />
                            </button>
                        </div>

                        {/* 옵션 목록 */}
                        <div className="overflow-y-auto" style={{ maxHeight: "calc(60vh - 90px)" }}>
                            {options.map((opt, i) => {
                                const isSelected = value === opt.value
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => handleSelect(opt.value)}
                                        className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors hover:bg-gray-50 active:bg-gray-100"
                                        style={{
                                            borderBottom: i < options.length - 1
                                                ? "1px solid var(--toss-border)"
                                                : undefined,
                                        }}>
                                        <div>
                                            <p className="text-sm font-medium"
                                                style={{ color: isSelected ? "var(--toss-blue)" : "var(--toss-text-primary)", fontWeight: isSelected ? 700 : 500 }}>
                                                {opt.label}
                                            </p>
                                            {opt.description && (
                                                <p className="text-xs mt-0.5"
                                                    style={{ color: isSelected ? "var(--toss-blue)" : "var(--toss-text-tertiary)" }}>
                                                    {opt.description}
                                                </p>
                                            )}
                                        </div>
                                        {isSelected && (
                                            <span className="text-sm font-bold flex-shrink-0" style={{ color: "var(--toss-blue)" }}>✓</span>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </>
            )}
        </>
    )
}
