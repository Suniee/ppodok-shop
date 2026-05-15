import { fetchCompanyInfo } from "@/lib/supabase/company"

const SNS_META = [
    { key: "sns_facebook",  label: "f",  bg: "#1877F2",             color: "#fff"     },
    { key: "sns_instagram", label: "ig", bg: "#E4405F",             color: "#fff"     },
    { key: "sns_naver",     label: "N",  bg: "#03C75A",             color: "#fff"     },
    { key: "sns_kakao",     label: "K",  bg: "#FAE100",             color: "#3C1E1E"  },
] as const

export default async function Footer() {
    const info = await fetchCompanyInfo().catch(() => null)

    const links = ["회사소개", "이용약관", "개인정보처리방침", "고객센터", "공지사항"]

    return (
        <footer data-ui-id="footer-main" className="bg-white mt-12" style={{ borderTop: "1px solid var(--toss-border)" }}>
            <div className="max-w-5xl mx-auto px-5 py-10">

                {/* Logo */}
                <div className="flex items-center gap-1.5 mb-5">
                    <span className="font-black text-base" style={{ color: "var(--toss-blue)" }}>
                        {info?.company_name || "뽀독샵"}
                    </span>
                </div>

                {/* Nav links */}
                <div className="flex flex-wrap gap-x-5 gap-y-2 mb-6">
                    {links.map((l, i) => (
                        <a
                            key={l}
                            href="#"
                            className="text-sm transition-colors hover:opacity-70"
                            style={{
                                color: i === 2 ? "var(--toss-text-primary)" : "var(--toss-text-secondary)",
                                fontWeight: i === 2 ? 600 : 400,
                            }}
                        >
                            {l}
                        </a>
                    ))}
                </div>

                {/* Company info */}
                <div className="text-xs leading-relaxed space-y-1 mb-6" style={{ color: "var(--toss-text-tertiary)" }}>
                    {(info?.company_name || info?.representative || info?.business_number) && (
                        <p>
                            {info.company_name && `상호명: ${info.company_name}`}
                            {info.representative && ` | 대표자: ${info.representative}`}
                            {info.business_number && ` | 사업자등록번호: ${info.business_number}`}
                        </p>
                    )}
                    {(info?.mail_order_number || info?.address) && (
                        <p>
                            {info.mail_order_number && `통신판매신고번호: ${info.mail_order_number}`}
                            {info.address && ` | 주소: ${info.address}`}
                        </p>
                    )}
                    {info?.phone && (
                        <p>
                            고객센터:{" "}
                            <a
                                href={`tel:${info.phone.replace(/-/g, "")}`}
                                className="font-semibold hover:opacity-70 transition-opacity"
                                style={{ color: "var(--toss-text-secondary)" }}
                            >
                                {info.phone}
                            </a>
                            {info.support_hours && ` (${info.support_hours})`}
                        </p>
                    )}
                </div>

                {/* Bottom */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs" style={{ color: "var(--toss-text-tertiary)" }}>
                        {info?.copyright || `© ${new Date().getFullYear()} 뽀독샵. All Rights Reserved.`}
                    </p>

                    {/* SNS 아이콘 — URL이 있는 것만 표시 */}
                    <div className="flex gap-2">
                        {SNS_META.map((s) => {
                            const url = info?.[s.key]
                            if (!url) return null
                            return (
                                <a
                                    key={s.key}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black hover:opacity-80 transition-opacity"
                                    style={{ backgroundColor: s.bg, color: s.color }}
                                >
                                    {s.label}
                                </a>
                            )
                        })}
                    </div>
                </div>
            </div>
        </footer>
    )
}
