"use client"

import { useState, useTransition } from "react"
import { ChevronUp, ChevronDown } from "lucide-react"
import { saveMenuConfigAction } from "./actions"
import type { MenuItemDef, MenuConfig } from "@/lib/admin-menu"

type Props = {
    menuItems:     MenuItemDef[]
    initialConfig: MenuConfig[]
}

type RowState = MenuItemDef & {
    sortOrder:      number
    visibleSuper:   boolean
    visibleGeneral: boolean
}

function buildInitialRows(menuItems: MenuItemDef[], dbConfig: MenuConfig[]): RowState[] {
    const cfgMap = new Map<string, MenuConfig>()
    for (const c of dbConfig) cfgMap.set(c.menuId, c)

    return menuItems
        .map((item, idx) => {
            const cfg = cfgMap.get(item.id)
            return {
                ...item,
                sortOrder:      cfg?.sortOrder      ?? idx,
                visibleSuper:   cfg?.visibleSuper   ?? item.defaultVisibleSuper,
                visibleGeneral: cfg?.visibleGeneral ?? item.defaultVisibleGeneral,
            }
        })
        .sort((a, b) => a.sortOrder - b.sortOrder)
}

// rows 는 이미 화면 표시 순서(최상위 → 그 자식들 → 다음 최상위...)로 정렬되어 있으므로
// 단순 index 부여만으로 올바른 순서가 보존된다.
// 이전의 parentOrd * 100 + sortOrder 방식은 저장할 때마다 값이 누적되는 버그가 있었다.
function reassignOrder(rows: RowState[]): RowState[] {
    return rows.map((row, idx) => ({ ...row, sortOrder: idx }))
}

// 셀 공통 스타일 — 수직 컬럼 구분선
const cellBorder = "border-r last:border-r-0"
const cellBorderColor = "var(--toss-border)"

export default function MenuClient({ menuItems, initialConfig }: Props) {
    const [rows, setRows]         = useState<RowState[]>(() => buildInitialRows(menuItems, initialConfig))
    const [isPending, startTrans] = useTransition()
    const [saved, setSaved]       = useState(false)
    const [error, setError]       = useState<string | null>(null)

    const tops = rows.filter((r) => r.parentId === null)

    const moveTop = (id: string, dir: -1 | 1) => {
        setSaved(false)
        setRows((prev) => {
            const prevTops = prev.filter((r) => r.parentId === null)
            const idx      = prevTops.findIndex((r) => r.id === id)
            const swapIdx  = idx + dir
            if (swapIdx < 0 || swapIdx >= prevTops.length) return prev

            const newTops  = [...prevTops]
            ;[newTops[idx], newTops[swapIdx]] = [newTops[swapIdx], newTops[idx]]

            const newTopIds = new Set(newTops.map((t) => t.id))
            const result: RowState[] = []
            for (const top of newTops) {
                result.push(top)
                result.push(...prev.filter((r) => r.parentId === top.id))
            }
            for (const r of prev) {
                if (r.parentId !== null && !newTopIds.has(r.parentId)) result.push(r)
            }
            return result
        })
    }

    const toggleVisible = (id: string, role: "super" | "general") => {
        setSaved(false)
        setRows((prev) =>
            prev.map((r) => {
                if (r.id !== id) return r
                return role === "super"
                    ? { ...r, visibleSuper: !r.visibleSuper }
                    : { ...r, visibleGeneral: !r.visibleGeneral }
            })
        )
    }

    const handleSave = () => {
        setError(null)
        setSaved(false)
        const config: MenuConfig[] = reassignOrder(rows).map((r) => ({
            menuId:         r.id,
            sortOrder:      r.sortOrder,
            visibleSuper:   r.visibleSuper,
            visibleGeneral: r.visibleGeneral,
        }))
        startTrans(async () => {
            const res = await saveMenuConfigAction(config)
            if (res.ok) setSaved(true)
            else setError(res.message ?? "저장 실패")
        })
    }

    return (
        <div data-ui-id="card-system-menu-list">
            {/* ── 테이블 ── */}
            <div className="rounded-2xl overflow-hidden border" style={{ borderColor: cellBorderColor }}>

                {/* 헤더 */}
                <div className="flex" style={{ borderBottom: `2px solid ${cellBorderColor}`, backgroundColor: "var(--toss-page-bg)" }}>
                    {/* 메뉴명 */}
                    <div className={`flex-1 px-5 py-3 ${cellBorder}`} style={{ borderColor: cellBorderColor }}>
                        <span className="text-xs font-semibold" style={{ color: "var(--toss-text-secondary)" }}>메뉴명</span>
                    </div>
                    {/* 수퍼관리자 */}
                    <div className={`w-36 px-4 py-3 text-center ${cellBorder}`} style={{ borderColor: cellBorderColor }}>
                        <span className="text-xs font-semibold" style={{ color: "var(--toss-text-secondary)" }}>수퍼관리자</span>
                    </div>
                    {/* 일반관리자 */}
                    <div className={`w-36 px-4 py-3 text-center ${cellBorder}`} style={{ borderColor: cellBorderColor }}>
                        <span className="text-xs font-semibold" style={{ color: "var(--toss-text-secondary)" }}>일반관리자</span>
                    </div>
                    {/* 순서 */}
                    <div className="w-24 px-4 py-3 text-center">
                        <span className="text-xs font-semibold" style={{ color: "var(--toss-text-secondary)" }}>순서</span>
                    </div>
                </div>

                {/* 행 */}
                {tops.map((top, topIdx) => {
                    const children = rows.filter((r) => r.parentId === top.id)
                    const isFirst  = topIdx === 0
                    const isLast   = topIdx === tops.length - 1
                    const isGroup  = top.href === null

                    return (
                        <div key={top.id}>
                            {/* 최상위 행 */}
                            <div
                                className="flex items-center"
                                style={{
                                    borderBottom: `1px solid ${cellBorderColor}`,
                                    backgroundColor: isGroup ? "var(--toss-page-bg)" : "#fff",
                                    minHeight: 52,
                                }}
                            >
                                {/* 메뉴명 */}
                                <div className={`flex-1 flex items-center gap-2 px-5 py-3 self-stretch ${cellBorder}`}
                                    style={{ borderColor: cellBorderColor }}>
                                    <span className="text-sm font-semibold" style={{ color: "var(--toss-text-primary)" }}>
                                        {top.label}
                                    </span>
                                    {isGroup && (
                                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                                            style={{ backgroundColor: "rgba(0,0,0,0.06)", color: "var(--toss-text-tertiary)" }}>
                                            그룹
                                        </span>
                                    )}
                                </div>

                                {/* 수퍼관리자 */}
                                <div className={`w-36 flex flex-col items-center justify-center gap-1.5 py-3 self-stretch ${cellBorder}`}
                                    style={{ borderColor: cellBorderColor }}>
                                    <Toggle value={top.visibleSuper} onChange={() => toggleVisible(top.id, "super")} />
                                    <VisibleBadge on={top.visibleSuper} />
                                </div>

                                {/* 일반관리자 */}
                                <div className={`w-36 flex flex-col items-center justify-center gap-1.5 py-3 self-stretch ${cellBorder}`}
                                    style={{ borderColor: cellBorderColor }}>
                                    <Toggle value={top.visibleGeneral} onChange={() => toggleVisible(top.id, "general")} />
                                    <VisibleBadge on={top.visibleGeneral} />
                                </div>

                                {/* 순서 */}
                                <div className="w-24 flex items-center justify-center gap-1 py-3 self-stretch">
                                    <button
                                        onClick={() => moveTop(top.id, -1)}
                                        disabled={isFirst}
                                        title="위로"
                                        className="w-7 h-7 flex items-center justify-center rounded-lg border transition-colors hover:bg-black/5 disabled:opacity-20"
                                        style={{ borderColor: cellBorderColor }}
                                    >
                                        <ChevronUp className="size-4" style={{ color: "var(--toss-text-secondary)" }} />
                                    </button>
                                    <button
                                        onClick={() => moveTop(top.id, 1)}
                                        disabled={isLast}
                                        title="아래로"
                                        className="w-7 h-7 flex items-center justify-center rounded-lg border transition-colors hover:bg-black/5 disabled:opacity-20"
                                        style={{ borderColor: cellBorderColor }}
                                    >
                                        <ChevronDown className="size-4" style={{ color: "var(--toss-text-secondary)" }} />
                                    </button>
                                </div>
                            </div>

                            {/* 자식 행 */}
                            {children.map((child) => (
                                <div
                                    key={child.id}
                                    className="flex items-center"
                                    style={{
                                        borderBottom: `1px solid ${cellBorderColor}`,
                                        backgroundColor: "#fff",
                                        minHeight: 48,
                                    }}
                                >
                                    {/* 메뉴명 (들여쓰기) */}
                                    <div className={`flex-1 flex items-center gap-2 px-5 py-2.5 self-stretch ${cellBorder}`}
                                        style={{ borderColor: cellBorderColor }}>
                                        <span className="pl-5 flex items-center gap-2">
                                            <span className="text-xs" style={{ color: "var(--toss-text-tertiary)" }}>└</span>
                                            <span className="text-sm" style={{ color: "var(--toss-text-secondary)" }}>
                                                {child.label}
                                            </span>
                                        </span>
                                    </div>

                                    {/* 수퍼관리자 */}
                                    <div className={`w-36 flex flex-col items-center justify-center gap-1.5 py-2.5 self-stretch ${cellBorder}`}
                                        style={{ borderColor: cellBorderColor }}>
                                        <Toggle value={child.visibleSuper} onChange={() => toggleVisible(child.id, "super")} />
                                        <VisibleBadge on={child.visibleSuper} />
                                    </div>

                                    {/* 일반관리자 */}
                                    <div className={`w-36 flex flex-col items-center justify-center gap-1.5 py-2.5 self-stretch ${cellBorder}`}
                                        style={{ borderColor: cellBorderColor }}>
                                        <Toggle value={child.visibleGeneral} onChange={() => toggleVisible(child.id, "general")} />
                                        <VisibleBadge on={child.visibleGeneral} />
                                    </div>

                                    {/* 자식은 순서 이동 없음 */}
                                    <div className="w-24" />
                                </div>
                            ))}
                        </div>
                    )
                })}
            </div>

            {/* ── 저장 ── */}
            <div className="mt-5 flex items-center gap-3">
                <button
                    data-ui-id="btn-system-menu-save"
                    onClick={handleSave}
                    disabled={isPending}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-50"
                    style={{ backgroundColor: "var(--toss-blue)", color: "#fff" }}
                >
                    {isPending ? "저장 중..." : "변경사항 저장"}
                </button>
                {saved && (
                    <span className="text-sm font-medium" style={{ color: "var(--toss-green)" }}>
                        저장되었습니다.
                    </span>
                )}
                {error && (
                    <span className="text-sm" style={{ color: "var(--toss-red)" }}>
                        {error}
                    </span>
                )}
            </div>
        </div>
    )
}

// ─── 노출 상태 뱃지 ──────────────────────────────────────────────────────────
function VisibleBadge({ on }: { on: boolean }) {
    return (
        <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{
                backgroundColor: on ? "rgba(59,130,246,0.1)" : "rgba(0,0,0,0.05)",
                color: on ? "var(--toss-blue)" : "var(--toss-text-tertiary)",
            }}
        >
            {on ? "노출" : "비노출"}
        </span>
    )
}

// ─── 토글 스위치 ─────────────────────────────────────────────────────────────
function Toggle({ value, onChange }: { value: boolean; onChange: () => void }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={value}
            onClick={onChange}
            className="relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-200 focus:outline-none"
            style={{ backgroundColor: value ? "var(--toss-blue)" : "var(--toss-border)" }}
        >
            <span
                className="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 mt-0.5"
                style={{ transform: value ? "translateX(22px)" : "translateX(2px)" }}
            />
        </button>
    )
}
