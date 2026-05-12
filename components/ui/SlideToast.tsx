"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { CheckCircle2, X } from "lucide-react"

const MESSAGES: Record<string, string> = {
    withdrawn:        "회원탈퇴가 완료되었습니다. 이용해 주셔서 감사합니다.",
    signup_confirmed: "가입이 완료되었습니다. 환영합니다!",
}

export default function SlideToast() {
    const searchParams = useSearchParams()
    const router       = useRouter()
    const pathname     = usePathname()

    const [message, setMessage] = useState<string | null>(null)
    const [visible, setVisible] = useState(false)   // 마운트 후 슬라이드 인 트리거

    // URL 파라미터 감지 → 메시지 세팅 + URL 정리
    useEffect(() => {
        const key = searchParams.get("toast")
        if (!key || !MESSAGES[key]) return

        setMessage(MESSAGES[key])

        const params = new URLSearchParams(searchParams.toString())
        params.delete("toast")
        const next = params.size > 0 ? `${pathname}?${params}` : pathname
        router.replace(next, { scroll: false })

        requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
    }, [searchParams])

    // 2초 타이머는 message에만 의존 — URL 변경에 영향받지 않음
    useEffect(() => {
        if (!message) return
        const timer = setTimeout(() => dismiss(), 1000)
        return () => clearTimeout(timer)
    }, [message])

    const dismiss = () => {
        setVisible(false)
        setTimeout(() => setMessage(null), 350)
    }

    if (!message) return null

    // 전체 너비 컨테이너로 수평 중앙 정렬 — translateX 없이 안정적으로 중앙에 위치
    return (
        <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
            <div
                data-ui-id="toast-slide"
                className="pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-b-2xl shadow-lg"
                style={{
                    transform: visible ? "translateY(0)" : "translateY(-100%)",
                    opacity: visible ? 1 : 0,
                    transition: visible
                        ? "transform 380ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 250ms ease"
                        : "transform 300ms ease-in, opacity 300ms ease-in",
                    backgroundColor: "#1A1A2E",
                    minWidth: "300px",
                    maxWidth: "calc(100vw - 48px)",
                }}
            >
                <CheckCircle2 className="size-5 flex-shrink-0" style={{ color: "#00C471" }} />
                <p className="text-sm font-medium text-white">{message}</p>
            </div>
        </div>
    )
}
