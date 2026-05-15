import { fetchCompanyInfo } from "@/lib/supabase/company"
import CompanyForm from "./CompanyForm"
import type { CompanyInfo } from "@/lib/supabase/company"

const DEFAULT: Omit<CompanyInfo, "id" | "updated_at"> = {
    company_name:      "",
    representative:    "",
    business_number:   "",
    mail_order_number: "",
    address:           "",
    phone:             "",
    support_hours:     "",
    copyright:         "",
    sns_facebook:      "",
    sns_instagram:     "",
    sns_naver:         "",
    sns_kakao:         "",
}

export default async function CompanyInfoPage() {
    const raw = await fetchCompanyInfo().catch(() => null)
    const initial: Omit<CompanyInfo, "id" | "updated_at"> = raw
        ? {
            company_name:      raw.company_name,
            representative:    raw.representative,
            business_number:   raw.business_number,
            mail_order_number: raw.mail_order_number,
            address:           raw.address,
            phone:             raw.phone,
            support_hours:     raw.support_hours,
            copyright:         raw.copyright,
            sns_facebook:      raw.sns_facebook,
            sns_instagram:     raw.sns_instagram,
            sns_naver:         raw.sns_naver,
            sns_kakao:         raw.sns_kakao,
        }
        : DEFAULT

    return (
        <div className="p-8 max-w-2xl">
            <div className="mb-7">
                <h1 className="text-2xl font-black" style={{ color: "var(--toss-text-primary)", letterSpacing: "-0.03em" }}>
                    회사 정보
                </h1>
                <p className="mt-1 text-sm" style={{ color: "var(--toss-text-secondary)" }}>
                    프론트 하단(푸터)에 표시되는 회사 정보를 관리합니다.
                </p>
            </div>
            <CompanyForm initial={initial} />
        </div>
    )
}
