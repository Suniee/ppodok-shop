import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
export { ADMIN_STORAGE_KEY } from "./keys"

// 서버 컴포넌트 / Server Action에서 세션을 읽을 때 사용
// storageKey를 전달하면 해당 키의 쿠키를 사용한다 (어드민/프론트 세션 분리)
export async function createSupabaseServerClient(storageKey?: string) {
    const cookieStore = await cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            db: { schema: "commerce" },
            ...(storageKey && { auth: { storageKey } }),
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // Server Component에서는 set이 불가 — 미들웨어가 갱신을 담당한다
                    }
                },
            },
        }
    )
}
