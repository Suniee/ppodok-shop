"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import Cropper from "react-easy-crop"
import type { Area } from "react-easy-crop"
import { X, Check, ZoomIn, ZoomOut, Scissors, RotateCcw } from "lucide-react"

interface Props {
    file: File
    onApply: (blob: Blob) => void
    onCancel: () => void
}

// 크롭 좌표(픽셀)를 받아 캔버스에서 잘라낸 뒤 Blob 반환
// 누끼 제거 후에는 PNG로 출력해 투명도를 보존한다
async function getCroppedBlob(imageSrc: string, pixelCrop: Area, mimeType: string): Promise<Blob> {
    const img = new Image()
    img.src = imageSrc
    await new Promise<void>((res, rej) => {
        img.onload = () => res()
        img.onerror = () => rej(new Error("이미지 로드 실패"))
    })

    const canvas = document.createElement("canvas")
    canvas.width = pixelCrop.width
    canvas.height = pixelCrop.height
    const ctx = canvas.getContext("2d")!

    // JPEG는 투명도 채널이 없으므로 흰 배경을 깔아 검게 나오는 현상 방지
    if (mimeType === "image/jpeg") {
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    ctx.drawImage(
        img,
        pixelCrop.x, pixelCrop.y,
        pixelCrop.width, pixelCrop.height,
        0, 0,
        pixelCrop.width, pixelCrop.height
    )

    return new Promise<Blob>((res, rej) =>
        canvas.toBlob(
            (b) => (b ? res(b) : rej(new Error("이미지 변환 실패"))),
            mimeType,
            mimeType === "image/jpeg" ? 0.92 : undefined
        )
    )
}

// 투명 영역을 회색·흰색 격자로 시각화하는 체커보드 패턴
const checkerboard: React.CSSProperties = {
    backgroundImage: `
        linear-gradient(45deg, #d0d0d0 25%, transparent 25%),
        linear-gradient(-45deg, #d0d0d0 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, #d0d0d0 75%),
        linear-gradient(-45deg, transparent 75%, #d0d0d0 75%)
    `,
    backgroundSize: "16px 16px",
    backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
    backgroundColor: "#f0f0f0",
}

export default function ImageCropModal({ file, onApply, onCancel }: Props) {
    const [originalUrl, setOriginalUrl] = useState("")
    const [displayUrl, setDisplayUrl]   = useState("")
    const [crop, setCrop]               = useState({ x: 0, y: 0 })
    const [zoom, setZoom]               = useState(1)
    const [croppedArea, setCroppedArea] = useState<Area | null>(null)
    const [applying, setApplying]       = useState(false)
    const [removingBg, setRemovingBg]   = useState(false)
    const [bgRemoved, setBgRemoved]     = useState(false)
    const [bgProgress, setBgProgress]   = useState(0)
    // 누끼 제거 결과 URL — 컴포넌트 언마운트 시 해제
    const bgUrlRef = useRef("")

    useEffect(() => {
        const url = URL.createObjectURL(file)
        setOriginalUrl(url)
        setDisplayUrl(url)
        return () => {
            URL.revokeObjectURL(url)
            if (bgUrlRef.current) URL.revokeObjectURL(bgUrlRef.current)
        }
    }, [file])

    const onCropComplete = useCallback((_: Area, pixelCrop: Area) => {
        setCroppedArea(pixelCrop)
    }, [])

    const handleRemoveBg = async () => {
        // 이미 제거된 상태면 원본으로 복원
        if (bgRemoved) {
            setDisplayUrl(originalUrl)
            setBgRemoved(false)
            setCrop({ x: 0, y: 0 })
            setZoom(1)
            return
        }

        setRemovingBg(true)
        setBgProgress(0)

        // 여러 파일의 다운로드 진행률을 합산해 전체 퍼센트 계산
        const totals: Record<string, number> = {}
        const currents: Record<string, number> = {}

        try {
            // WASM·모델 파일(~50MB)이 커서 동적 import로 필요 시점에만 로드
            const { removeBackground } = await import("@imgly/background-removal")

            const resultBlob = await removeBackground(displayUrl, {
                model: "isnet_quint8",      // 경량 모델: 가장 빠른 처리
                output: { format: "image/png" },
                progress: (key: string, current: number, total: number) => {
                    currents[key] = current
                    totals[key] = total
                    const totalSum   = Object.values(totals).reduce((a, b) => a + b, 0)
                    const currentSum = Object.values(currents).reduce((a, b) => a + b, 0)
                    if (totalSum > 0) setBgProgress(Math.round((currentSum / totalSum) * 100))
                },
            })

            const newUrl = URL.createObjectURL(resultBlob)
            if (bgUrlRef.current) URL.revokeObjectURL(bgUrlRef.current)
            bgUrlRef.current = newUrl

            setDisplayUrl(newUrl)
            setBgRemoved(true)
            setCrop({ x: 0, y: 0 })
            setZoom(1)
        } catch (err) {
            alert("배경 제거에 실패했습니다: " + (err as Error).message)
        } finally {
            setRemovingBg(false)
            setBgProgress(0)
        }
    }

    const handleApply = async () => {
        if (!croppedArea || !displayUrl) return
        setApplying(true)
        try {
            const mimeType = bgRemoved ? "image/png" : "image/jpeg"
            const blob = await getCroppedBlob(displayUrl, croppedArea, mimeType)
            onApply(blob)
        } catch (err) {
            alert((err as Error).message ?? "크롭 처리에 실패했습니다.")
            setApplying(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-[480px] flex flex-col overflow-hidden">

                {/* ── 헤더 ── */}
                <div
                    className="flex items-center justify-between px-6 py-4 flex-shrink-0"
                    style={{ borderBottom: "1px solid var(--toss-border)" }}
                >
                    <div>
                        <p className="text-base font-bold" style={{ color: "var(--toss-text-primary)" }}>이미지 편집</p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--toss-text-tertiary)" }}>
                            드래그하거나 확대/축소해서 영역을 조정하세요
                        </p>
                    </div>
                    <button onClick={onCancel} className="p-1.5 rounded-xl hover:bg-gray-100 transition-colors">
                        <X className="size-4" style={{ color: "var(--toss-text-secondary)" }} />
                    </button>
                </div>

                {/* ── 누끼 따기 툴바 ── */}
                <div
                    className="px-6 py-3 flex items-center gap-3 flex-shrink-0"
                    style={{
                        borderBottom: "1px solid var(--toss-border)",
                        backgroundColor: bgRemoved ? "#EBF3FF" : "#FAFBFC",
                    }}
                >
                    <button
                        onClick={handleRemoveBg}
                        disabled={removingBg || applying}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-60 flex-shrink-0"
                        style={{
                            backgroundColor: bgRemoved ? "var(--toss-blue)" : "white",
                            color: bgRemoved ? "white" : "var(--toss-text-primary)",
                            border: `1.5px solid ${bgRemoved ? "var(--toss-blue)" : "var(--toss-border)"}`,
                        }}
                    >
                        {removingBg ? (
                            <>
                                <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
                                {bgProgress > 0 ? `${bgProgress}%` : "로딩 중..."}
                            </>
                        ) : bgRemoved ? (
                            <>
                                <RotateCcw className="size-3.5" />
                                원본 복원
                            </>
                        ) : (
                            <>
                                <Scissors className="size-3.5" />
                                누끼 따기
                            </>
                        )}
                    </button>

                    <p className="text-[11px] leading-snug" style={{ color: bgRemoved ? "var(--toss-blue)" : "var(--toss-text-tertiary)" }}>
                        {bgRemoved
                            ? "배경이 제거되었습니다 · PNG로 저장됩니다"
                            : "처음 실행 시 모델 다운로드로 수십 초 소요될 수 있습니다"}
                    </p>
                </div>

                {/* ── 크롭 영역 ── */}
                {/* 누끼 제거 후 체커보드 배경으로 투명 영역 시각화 */}
                <div
                    className="relative w-full flex-shrink-0"
                    style={{ height: 320, ...(bgRemoved ? checkerboard : { backgroundColor: "#111" }) }}
                >
                    {displayUrl && (
                        <Cropper
                            image={displayUrl}
                            crop={crop}
                            zoom={zoom}
                            aspect={1}
                            onCropChange={setCrop}
                            onZoomChange={setZoom}
                            onCropComplete={onCropComplete}
                            style={{
                                containerStyle: { borderRadius: 0, background: "transparent" },
                                cropAreaStyle: {
                                    border: "2px solid #0064FF",
                                    boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)",
                                },
                            }}
                        />
                    )}
                </div>

                {/* ── 줌 컨트롤 ── */}
                <div className="px-6 py-3 flex items-center gap-3 flex-shrink-0">
                    <button
                        onClick={() => setZoom((z) => Math.max(1, +(z - 0.1).toFixed(2)))}
                        className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <ZoomOut className="size-4" style={{ color: "var(--toss-text-secondary)" }} />
                    </button>
                    <input
                        type="range" min={1} max={3} step={0.02} value={zoom}
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
                        style={{ accentColor: "var(--toss-blue)" }}
                    />
                    <button
                        onClick={() => setZoom((z) => Math.min(3, +(z + 0.1).toFixed(2)))}
                        className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <ZoomIn className="size-4" style={{ color: "var(--toss-text-secondary)" }} />
                    </button>
                </div>

                {/* ── 취소 / 적용 ── */}
                <div
                    className="px-6 pb-5 pt-4 flex gap-2 flex-shrink-0"
                    style={{ borderTop: "1px solid var(--toss-border)" }}
                >
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3 rounded-2xl text-sm font-semibold"
                        style={{ color: "var(--toss-text-secondary)", border: "1px solid var(--toss-border)" }}
                    >
                        취소
                    </button>
                    <button
                        onClick={handleApply}
                        disabled={applying || removingBg || !displayUrl}
                        className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white flex items-center justify-center gap-2 hover:opacity-85 transition-opacity disabled:opacity-50"
                        style={{ backgroundColor: "var(--toss-blue)" }}
                    >
                        {applying ? "처리 중..." : <><Check className="size-4" />적용</>}
                    </button>
                </div>

            </div>
        </div>
    )
}
