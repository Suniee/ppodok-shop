import { createAdminClient } from "./admin"
import { createSupabaseServerClient } from "./server"

export type Term = {
    id:          string
    consentKey:  string
    title:       string
    isRequired:  boolean
    content:     string
    version:     string
    effectiveAt: string
    sortOrder:   number
    updatedAt:   string
}

function rowToTerm(r: Record<string, unknown>): Term {
    return {
        id:          r.id          as string,
        consentKey:  r.consent_key as string,
        title:       r.title       as string,
        isRequired:  r.is_required as boolean,
        content:     r.content     as string,
        version:     r.version     as string,
        effectiveAt: r.effective_at as string,
        sortOrder:   r.sort_order  as number,
        updatedAt:   r.updated_at  as string,
    }
}

// 회원가입 화면 및 공개 약관 조회
export async function fetchActiveTerms(): Promise<Term[]> {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase
        .from("terms")
        .select("*")
        .order("sort_order")

    if (error || !data) return []
    return data.map((r) => rowToTerm(r as Record<string, unknown>))
}

// 어드민 약관 내용 수정
export async function updateTermAdmin(
    id:   string,
    patch: { title?: string; content?: string; version?: string; effectiveAt?: string },
): Promise<void> {
    const admin = createAdminClient()
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (patch.title       !== undefined) update.title        = patch.title
    if (patch.content     !== undefined) update.content      = patch.content
    if (patch.version     !== undefined) update.version      = patch.version
    if (patch.effectiveAt !== undefined) update.effective_at = patch.effectiveAt

    const { error } = await admin.from("terms").update(update).eq("id", id)
    if (error) throw new Error(error.message)
}
