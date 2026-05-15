"use client"

import { useState, useRef, useEffect } from "react"
import DaumPostcodeEmbed, { type Address } from "react-daum-postcode"
import { Search, MapPin, X } from "lucide-react"

export interface AddressValue {
    postalCode: string
    address: string
    addressDetail: string
}

interface Props {
    value: AddressValue
    onChange: (value: AddressValue) => void
    disabled?: boolean
}

// 카카오 우편번호 위젯을 뽀득삽 디자인 시스템 색상에 맞게 커스터마이징
const postcodeTheme = {
    bgColor: "#ffffff",
    searchBgColor: "#F2F4F6",
    contentBgColor: "#ffffff",
    pageBgColor: "#F2F4F6",
    textColor: "#191F28",
    queryTextColor: "#191F28",
    postcodeTextColor: "#0064FF",
    emphTextColor: "#0064FF",
    outlineColor: "#E5E8EB",
}

const readonlyStyle: React.CSSProperties = {
    backgroundColor: "#F9FAFB",
    border: "1.5px solid var(--toss-border)",
    color: "var(--toss-text-primary)",
}

const editableStyle: React.CSSProperties = {
    backgroundColor: "#ffffff",
    border: "1.5px solid var(--toss-border)",
    color: "var(--toss-text-primary)",
}

export default function AddressInput({ value, onChange, disabled }: Props) {
    const [showPostcode, setShowPostcode] = useState(false)
    const detailRef = useRef<HTMLInputElement>(null)

    // 주소 선택 완료 후 상세주소 입력란에 자동 포커스
    useEffect(() => {
        if (value.address && !value.addressDetail && detailRef.current) {
            detailRef.current.focus()
        }
    }, [value.address])

    const handleComplete = (data: Address) => {
        // 사용자가 도로명/지번 중 선택한 타입으로 결정, 도로명 우선
        const fullAddress = data.userSelectedType === "R"
            ? data.roadAddress
            : data.jibunAddress

        // 아파트 등 공동주택이면 건물명을 자동으로 상세주소에 채워줌
        const detailHint = data.apartment === "Y" && data.buildingName
            ? data.buildingName + " "
            : ""

        onChange({
            postalCode: data.zonecode,
            address: fullAddress,
            addressDetail: detailHint,   // 빈 문자열 또는 건물명 힌트
        })
        setShowPostcode(false)
    }

    const hasAddress = !!value.address

    return (
        <>
            <div className="space-y-2">
                {/* 우편번호 행 */}
                <div className="flex gap-2">
                    <input
                        type="text"
                        readOnly
                        value={value.postalCode}
                        placeholder="우편번호"
                        className="w-28 rounded-xl px-3 py-2.5 text-sm text-center tabular-nums"
                        style={readonlyStyle}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPostcode(true)}
                        disabled={disabled}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-85 disabled:opacity-50"
                        style={{ backgroundColor: "var(--toss-blue)", color: "#fff" }}
                    >
                        <Search className="size-3.5" />
                        주소 검색
                    </button>
                </div>

                {/* 도로명주소 (읽기 전용 — 카카오 위젯이 채워줌) */}
                <input
                    type="text"
                    readOnly
                    value={value.address}
                    placeholder="도로명주소 (위 버튼으로 검색)"
                    className="w-full rounded-xl px-3 py-2.5 text-sm"
                    style={readonlyStyle}
                />

                {/* 상세주소 (주소 선택 후 표시) */}
                {hasAddress && (
                    <input
                        ref={detailRef}
                        type="text"
                        value={value.addressDetail}
                        onChange={(e) => onChange({ ...value, addressDetail: e.target.value })}
                        placeholder="상세주소 입력 (예: 101동 502호, 3층)"
                        disabled={disabled}
                        className="w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-all"
                        style={editableStyle}
                        onFocus={(e) => (e.currentTarget.style.borderColor = "var(--toss-blue)")}
                        onBlur={(e) => (e.currentTarget.style.borderColor = "var(--toss-border)")}
                    />
                )}

                {/* 선택된 주소 요약 */}
                {hasAddress && (
                    <div
                        className="flex items-start gap-2 rounded-xl px-3 py-2.5"
                        style={{ backgroundColor: "var(--toss-blue-light)" }}
                    >
                        <MapPin className="size-3.5 mt-0.5 flex-shrink-0" style={{ color: "var(--toss-blue)" }} />
                        <p className="text-xs leading-snug" style={{ color: "var(--toss-blue-dark)" }}>
                            [{value.postalCode}] {value.address}
                            {value.addressDetail && ` ${value.addressDetail}`}
                        </p>
                    </div>
                )}
            </div>

            {/* 카카오 우편번호 모달 */}
            {showPostcode && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div
                        className="bg-white rounded-3xl overflow-hidden shadow-2xl"
                        style={{ width: 500, border: "1px solid var(--toss-border)" }}
                    >
                        {/* 모달 헤더 */}
                        <div
                            className="flex items-center justify-between px-5 py-4"
                            style={{ borderBottom: "1px solid var(--toss-border)" }}
                        >
                            <div className="flex items-center gap-2">
                                <MapPin className="size-4" style={{ color: "var(--toss-blue)" }} />
                                <p className="text-sm font-bold" style={{ color: "var(--toss-text-primary)" }}>
                                    주소 검색
                                </p>
                                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                                    style={{ backgroundColor: "var(--toss-blue-light)", color: "var(--toss-blue)" }}>
                                    카카오 우편번호
                                </span>
                            </div>
                            <button
                                onClick={() => setShowPostcode(false)}
                                className="p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
                            >
                                <X className="size-4" style={{ color: "var(--toss-text-secondary)" }} />
                            </button>
                        </div>

                        {/* 우편번호 위젯 */}
                        <DaumPostcodeEmbed
                            onComplete={handleComplete}
                            theme={postcodeTheme}
                            style={{ height: 460 }}
                            autoClose={false}
                        />
                    </div>
                </div>
            )}
        </>
    )
}
