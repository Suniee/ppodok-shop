import { Suspense } from "react"
import ResetPasswordForm from "./ResetPasswordForm"

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="w-full max-w-[400px]">
                <div className="bg-white rounded-3xl p-7 shadow-sm flex items-center justify-center h-48"
                    style={{ border: "1px solid var(--toss-border)" }}>
                    <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
                        style={{ borderColor: "var(--toss-blue)", borderTopColor: "transparent" }} />
                </div>
            </div>
        }>
            <ResetPasswordForm />
        </Suspense>
    )
}
