"use client"

import { useState } from "react"
import { Loader2, Check, Clock } from "lucide-react"
import { updateBatchSettingsAction, type BatchSettings } from "./actions"

const SCHEDULE_PRESETS = [
    { label: "1분마다",  value: "* * * * *"  },
    { label: "10분마다", value: "*/10 * * * *" },
    { label: "1시간마다", value: "0 * * * *"   },
    { label: "매일 자정", value: "0 0 * * *"   },
]

const RETENTION_PRESETS = [
    { label: "1분",   value: 1      },
    { label: "10분",  value: 10     },
    { label: "1시간", value: 60     },
    { label: "1일",   value: 1440   },
    { label: "7일",   value: 10080  },
]

const inputCls = "w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
const inputStyle: React.CSSProperties = {
    border: "1.5px solid var(--toss-border)",
    backgroundColor: "#fff",
    color: "var(--toss-text-primary)",
}

function PresetButton({
    label, active, onClick,
}: { label: string; active: boolean; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors"
            style={{
                backgroundColor: active ? "var(--toss-blue)" : "var(--toss-page-bg)",
                color: active ? "#fff" : "var(--toss-text-secondary)",
                border: active ? "1.5px solid var(--toss-blue)" : "1.5px solid var(--toss-border)",
            }}
        >
            {label}
        </button>
    )
}

export default function SettingsForm({ initial }: { initial: BatchSettings }) {
    const [schedule, setSchedule]           = useState(initial.schedule)
    const [retention, setRetention]         = useState(initial.retentionMinutes)
    const [customRetention, setCustomRetention] = useState(
        RETENTION_PRESETS.some((p) => p.value === initial.retentionMinutes)
            ? "" : String(initial.retentionMinutes)
    )
    const [saving, setSaving]   = useState(false)
    const [saved, setSaved]     = useState(false)
    const [error, setError]     = useState<string | null>(null)

    const isCustomSchedule  = !SCHEDULE_PRESETS.some((p) => p.value === schedule)
    const isCustomRetention = !RETENTION_PRESETS.some((p) => p.value === retention)

    const handleSave = async () => {
        setSaving(true)
        setSaved(false)
        setError(null)
        try {
            await updateBatchSettingsAction({ schedule, retentionMinutes: retention })
            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
        } catch (err) {
            setError((err as Error).message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-6">

            {/* 탈퇴 회원 정리 배치 카드 */}
            <div
                data-ui-id="card-settings-withdrawn-batch"
                className="bg-white rounded-2xl p-6"
                style={{ border: "1px solid var(--toss-border)" }}
            >
                <div className="flex items-center gap-2 mb-5">
                    <Clock className="size-5" style={{ color: "var(--toss-blue)" }} />
                    <h2 className="text-base font-bold" style={{ color: "var(--toss-text-primary)" }}>
                        탈퇴 회원 정리 배치
                    </h2>
                </div>

                <div className="space-y-5">
                    {/* 실행 주기 */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold" style={{ color: "var(--toss-text-secondary)" }}>
                            실행 주기
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {SCHEDULE_PRESETS.map((p) => (
                                <PresetButton
                                    key={p.value}
                                    label={p.label}
                                    active={schedule === p.value}
                                    onClick={() => setSchedule(p.value)}
                                />
                            ))}
                            <PresetButton
                                label="직접 입력"
                                active={isCustomSchedule}
                                onClick={() => setSchedule("")}
                            />
                        </div>
                        {(isCustomSchedule || schedule === "") && (
                            <input
                                type="text"
                                value={schedule}
                                onChange={(e) => setSchedule(e.target.value)}
                                placeholder="cron 표현식 (예: 0 9 * * 1-5)"
                                className={inputCls}
                                style={inputStyle}
                                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--toss-blue)")}
                                onBlur={(e)  => (e.currentTarget.style.borderColor = "var(--toss-border)")}
                            />
                        )}
                        <p className="text-[11px]" style={{ color: "var(--toss-text-tertiary)" }}>
                            현재: <code className="font-mono">{schedule || "—"}</code>
                        </p>
                    </div>

                    {/* 보관 기간 */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold" style={{ color: "var(--toss-text-secondary)" }}>
                            보관 기간 (이 시간이 지나면 삭제)
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {RETENTION_PRESETS.map((p) => (
                                <PresetButton
                                    key={p.value}
                                    label={p.label}
                                    active={retention === p.value && !isCustomRetention}
                                    onClick={() => { setRetention(p.value); setCustomRetention("") }}
                                />
                            ))}
                            <PresetButton
                                label="직접 입력"
                                active={isCustomRetention}
                                onClick={() => setRetention(0)}
                            />
                        </div>
                        {isCustomRetention && (
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min={1}
                                    value={customRetention}
                                    onChange={(e) => {
                                        setCustomRetention(e.target.value)
                                        setRetention(parseInt(e.target.value, 10) || 0)
                                    }}
                                    placeholder="분 단위로 입력"
                                    className={`${inputCls} flex-1`}
                                    style={inputStyle}
                                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--toss-blue)")}
                                    onBlur={(e)  => (e.currentTarget.style.borderColor = "var(--toss-border)")}
                                />
                                <span className="text-sm" style={{ color: "var(--toss-text-secondary)" }}>분</span>
                            </div>
                        )}
                        <p className="text-[11px]" style={{ color: "var(--toss-text-tertiary)" }}>
                            현재: <span className="font-semibold">{retention}분</span>
                            {retention >= 1440
                                ? ` (${Math.round(retention / 1440)}일)`
                                : retention >= 60
                                ? ` (${Math.round(retention / 60)}시간)`
                                : ""}
                        </p>
                    </div>
                </div>
            </div>

            {/* 에러 */}
            {error && (
                <div className="rounded-2xl px-4 py-3 text-xs font-medium"
                    style={{ backgroundColor: "#FFF0F0", color: "var(--toss-red)" }}>
                    {error}
                </div>
            )}

            {/* 저장 버튼 */}
            <button
                data-ui-id="btn-settings-save"
                type="button"
                onClick={handleSave}
                disabled={saving || !schedule || retention <= 0}
                className="px-6 py-3 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-85 disabled:opacity-50 flex items-center gap-2"
                style={{ backgroundColor: saved ? "#00C471" : "var(--toss-blue)" }}
            >
                {saving ? (
                    <><Loader2 className="size-4 animate-spin" />저장 중...</>
                ) : saved ? (
                    <><Check className="size-4" />저장되었습니다</>
                ) : "설정 저장"}
            </button>
        </div>
    )
}
