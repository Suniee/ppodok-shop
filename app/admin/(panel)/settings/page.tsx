import { getBatchSettingsAction } from "./actions"
import SettingsForm from "./SettingsForm"

export default async function AdminSettingsPage() {
    const initial = await getBatchSettingsAction()

    return (
        <div data-ui-id="page-admin-settings" className="p-8 max-w-2xl">
            <div className="mb-7">
                <h1 className="text-2xl font-black" style={{ color: "var(--toss-text-primary)", letterSpacing: "-0.03em" }}>
                    정책관리
                </h1>
                <p className="mt-1 text-sm" style={{ color: "var(--toss-text-secondary)" }}>
                    배치 작업 및 시스템 설정을 관리합니다.
                </p>
            </div>
            <SettingsForm initial={initial} />
        </div>
    )
}
