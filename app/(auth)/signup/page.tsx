import { fetchActiveTerms } from "@/lib/supabase/terms"
import SignupForm from "./SignupForm"

export default async function SignupPage() {
    const terms = await fetchActiveTerms()
    return <SignupForm terms={terms} />
}
