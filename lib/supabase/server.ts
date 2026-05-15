import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

// 서버 컴포넌트 / Server Action에서 세션을 읽을 때 사용
// cookies()로 요청에 담긴 세션 쿠키를 전달한다
export async function createSupabaseServerClient() {
    const cookieStore = await cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            db: { schema: "commerce" },
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
