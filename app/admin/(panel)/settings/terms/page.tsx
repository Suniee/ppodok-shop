import { fetchActiveTerms } from "@/lib/supabase/terms"
import TermsEditor from "./TermsEditor"

export default async function AdminTermsPage() {
    const terms = await fetchActiveTerms()

    return (
        <div data-ui-id="page-admin-terms-layout" className="p-8 max-w-3xl">
            <div className="mb-7">
                <h1 className="text-2xl font-black" style={{ color: "var(--toss-text-primary)", letterSpacing: "-0.03em" }}>
                    약관 관리
                </h1>
                <p className="mt-1 text-sm" style={{ color: "var(--toss-text-secondary)" }}>
                    회원가입 시 동의를 받는 약관의 제목·내용·버전·시행일을 수정합니다.
                </p>
            </div>
            <TermsEditor terms={terms} />
        </div>
    )
}
