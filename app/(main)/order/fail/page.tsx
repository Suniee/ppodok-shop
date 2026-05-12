interface Props {
    searchParams: Promise<{ message?: string; code?: string }>
}

export default async function OrderFailPage({ searchParams }: Props) {
    const { message, code } = await searchParams

    return (
        <div data-ui-id="page-order-fail" className="max-w-md mx-auto px-5 py-16 pb-24 flex flex-col items-center text-center">
            <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: "#FFF0F0" }}
            >
                <span className="text-3xl">😢</span>
            </div>
            <h1 className="text-xl font-black mb-2" style={{ color: "var(--toss-text-primary)", letterSpacing: "-0.03em" }}>
                결제에 실패했어요
            </h1>
            <p className="text-sm mb-1" style={{ color: "var(--toss-text-secondary)" }}>
                {message ?? "결제 처리 중 문제가 발생했습니다."}
            </p>
            {code && (
                <p className="text-xs mb-8" style={{ color: "var(--toss-text-tertiary)" }}>
                    오류 코드: {code}
                </p>
            )}

            <div className="flex gap-3 mt-8">
                <a
                    href="/order"
                    className="px-6 py-3 rounded-2xl text-sm font-bold text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: "var(--toss-blue)" }}
                >
                    다시 시도하기
                </a>
                <a
                    href="/"
                    className="px-6 py-3 rounded-2xl text-sm font-semibold transition-colors hover:bg-gray-50"
                    style={{ border: "1.5px solid var(--toss-border)", color: "var(--toss-text-secondary)" }}
                >
                    홈으로
                </a>
            </div>
        </div>
    )
}
