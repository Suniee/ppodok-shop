"use client"

type Props = {
    show:    boolean
    label?:  string
    color?:  string   // 스피너 강조색 (기본: toss-blue)
}

export default function LoadingOverlay({ show, label, color = "var(--toss-blue)" }: Props) {
    if (!show) return null

    return (
        <div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4"
            style={{ backgroundColor: "rgba(255,255,255,0.65)", backdropFilter: "blur(2px)" }}
        >
            <style>{`
                @keyframes overlay-spin {
                    to { transform: rotate(360deg) }
                }
            `}</style>

            {/* 스피너 */}
            <div
                style={{
                    width:        40,
                    height:       40,
                    borderRadius: "50%",
                    border:       `3px solid rgba(0,0,0,0.08)`,
                    borderTopColor: color,
                    animation:    "overlay-spin 0.7s linear infinite",
                    flexShrink:   0,
                }}
            />

            {/* 라벨 */}
            {label && (
                <p className="text-sm font-semibold" style={{ color: "var(--toss-text-secondary)" }}>
                    {label}
                </p>
            )}
        </div>
    )
}
