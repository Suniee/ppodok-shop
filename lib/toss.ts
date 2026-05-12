function getAuthHeader(): string {
    const secretKey = process.env.TOSS_SECRET_KEY
    if (!secretKey) throw new Error("TOSS_SECRET_KEY가 설정되지 않았습니다.")
    return `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`
}

// ── 거래 내역 ──────────────────────────────────────────────────

export type TossTransaction = {
    transactionKey: string
    paymentKey: string
    orderId: string
    orderName: string
    method: string
    amount: number
    status: string          // DONE | CANCELED | PARTIAL_CANCELED | WAITING_FOR_DEPOSIT | IN_PROGRESS
    transactionAt: string   // ISO 8601
    currency: string
    provider: string | null // 간편결제 제공사
}

// startDate, endDate: "YYYY-MM-DDTHH:mm:ss" 형식 (KST 기준)
export async function fetchTossTransactions(
    startDate: string,
    endDate: string,
    limit = 100
): Promise<TossTransaction[]> {
    const params = new URLSearchParams({ startDate, endDate, limit: String(limit) })
    const res = await fetch(
        `https://api.tosspayments.com/v1/transactions?${params}`,
        { headers: { Authorization: getAuthHeader() }, cache: "no-store" }
    )
    if (!res.ok) return []
    const data = await res.json()
    // 토스는 배열 또는 { transactions: [...] } 두 형태로 응답
    return Array.isArray(data) ? data : (data.transactions ?? [])
}

// 단건 결제 상세 조회
export type TossPaymentDetail = {
    paymentKey: string
    orderId: string
    orderName: string
    method: string
    totalAmount: number
    status: string
    approvedAt: string | null
    requestedAt: string
    card: {
        number: string
        installmentPlanMonths: number
        isInterestFree: boolean
        approveNo: string
        issuerCode: string
        acquirerCode: string
    } | null
    cancels: {
        cancelAmount: number
        cancelReason: string
        canceledAt: string
    }[] | null
}

export async function fetchTossPayment(paymentKey: string): Promise<TossPaymentDetail | null> {
    const res = await fetch(
        `https://api.tosspayments.com/v1/payments/${paymentKey}`,
        { headers: { Authorization: getAuthHeader() }, cache: "no-store" }
    )
    if (!res.ok) return null
    return res.json()
}

// ── 결제 승인 ──────────────────────────────────────────────────

// 서버 전용: 토스페이먼츠 결제 승인 API 호출 (secret key 사용)
// 승인 성공 시 토스 응답 원본을 반환 (payments 테이블 저장용)
export async function confirmTossPayment(
    paymentKey: string,
    orderId: string,
    amount: number
): Promise<Record<string, unknown>> {
    const res = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
        method: "POST",
        headers: {
            Authorization: getAuthHeader(),
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ paymentKey, orderId, amount }),
        cache: "no-store",
    })

    const body = await res.json().catch(() => ({}))

    if (!res.ok) {
        throw new Error((body as { message?: string }).message ?? "결제 승인에 실패했습니다.")
    }

    return body as Record<string, unknown>
}
