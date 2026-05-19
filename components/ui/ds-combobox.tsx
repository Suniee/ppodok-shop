"use client"

// Toss 스타일 옵션 피커 — 드롭다운 없이 선택지를 카드 그리드로 노출
// 통신사 선택, 성별 선택 등 고정된 소수 옵션에 사용

export type ComboboxOption = {
    value:       string
    label:       string
    description?: string  // 옵션 아래 부연 설명
    icon?:       React.ReactNode
}

type SingleProps = {
    multiple?:  false
    value?:     string
    onChange?:  (value: string) => void
}

type MultiProps = {
    multiple:   true
    value?:     string[]
    onChange?:  (value: string[]) => void
}

type BaseProps = {
    options:   ComboboxOption[]
    columns?:  2 | 3 | 4
    size?:     "sm" | "md"
    disabled?: boolean
}

export type DsComboboxProps = BaseProps & (SingleProps | MultiProps)

const colClass: Record<number, string> = {
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
}

export function DsCombobox(props: DsComboboxProps) {
    const { options, columns = 3, size = "md", disabled = false } = props

    const isSelected = (val: string): boolean => {
        if (props.multiple) return (props.value ?? []).includes(val)
        return props.value === val
    }

    const handleClick = (val: string) => {
        if (disabled) return
        if (props.multiple) {
            const prev   = props.value ?? []
            const next   = prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
            props.onChange?.(next)
        } else {
            props.onChange?.(val)
        }
    }

    const pad     = size === "sm" ? "px-3 py-2" : "px-4 py-3"
    const textSz  = size === "sm" ? "text-xs"   : "text-sm"
    const descSz  = "text-[10px]"

    return (
        <div className={`grid ${colClass[columns]} gap-2`}>
            {options.map((opt) => {
                const selected = isSelected(opt.value)
                return (
                    <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleClick(opt.value)}
                        disabled={disabled}
                        className={`
                            ${pad} rounded-2xl flex flex-col items-center justify-center gap-0.5
                            text-center transition-all duration-150 select-none
                            disabled:opacity-40 disabled:cursor-not-allowed
                        `}
                        style={{
                            border:          selected
                                ? "1.5px solid var(--toss-blue)"
                                : "1.5px solid var(--toss-border)",
                            backgroundColor: selected
                                ? "var(--toss-blue-light)"
                                : "#fff",
                            color:           selected
                                ? "var(--toss-blue)"
                                : "var(--toss-text-primary)",
                            boxShadow:       selected
                                ? "0 0 0 3px rgba(0,100,255,0.08)"
                                : "none",
                        }}
                    >
                        {opt.icon && (
                            <span className="mb-0.5" style={{ color: selected ? "var(--toss-blue)" : "var(--toss-text-secondary)" }}>
                                {opt.icon}
                            </span>
                        )}
                        <span className={`${textSz} font-bold leading-snug`}>{opt.label}</span>
                        {opt.description && (
                            <span className={`${descSz} font-normal leading-snug`}
                                style={{ color: selected ? "var(--toss-blue)" : "var(--toss-text-tertiary)" }}>
                                {opt.description}
                            </span>
                        )}
                    </button>
                )
            })}
        </div>
    )
}
