// 로그인·회원가입 전용 레이아웃: 헤더·푸터 없이 중앙 정렬만
export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div
            className="min-h-screen flex items-center justify-center px-5 py-12"
            style={{ backgroundColor: "var(--toss-page-bg)" }}
        >
            {children}
        </div>
    )
}
