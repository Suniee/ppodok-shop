import { createBrowserClient } from "@supabase/ssr"

// 브라우저(클라이언트 컴포넌트)에서 사용하는 Supabase 클라이언트
// storageKey를 전달하면 해당 키의 쿠키를 사용한다 (어드민/프론트 세션 분리)
export function createSupabaseBrowserClient(storageKey?: string) {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            db: { schema: "commerce" },
            ...(storageKey && { auth: { storageKey } }),
        }
    )
}
