import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { ADMIN_STORAGE_KEY } from "@/lib/supabase/keys"

// 모든 요청마다 Supabase 세션 쿠키를 갱신해 로그인 상태를 유지한다
// 어드민 경로는 별도 storageKey를 사용해 프론트 세션과 분리한다
export async function middleware(request: NextRequest) {
    let response = NextResponse.next({ request })

    const isAdminRoute = request.nextUrl.pathname.startsWith("/admin")

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            db: { schema: "commerce" },
            ...(isAdminRoute && { auth: { storageKey: ADMIN_STORAGE_KEY } }),
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    // 요청·응답 양쪽에 쿠키를 반영해야 세션이 정상 갱신된다
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    response = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // getUser() 호출이 세션 갱신을 트리거한다 (반드시 await해야 함)
    const { data: { user } } = await supabase.auth.getUser()

    // 프론트 보호 경로에서 정지 계정 접근 차단
    const protectedPaths = ["/account", "/order"]
    const isProtectedRoute = !isAdminRoute &&
        protectedPaths.some((p) => request.nextUrl.pathname.startsWith(p))

    if (isProtectedRoute && user) {
        const { data: profile } = await supabase
            .from("customer_profiles")
            .select("status")
            .eq("id", user.id)
            .single()

        if (profile?.status === "suspended") {
            await supabase.auth.signOut()
            return NextResponse.redirect(new URL("/login", request.url))
        }
    }

    return response
}

export const config = {
    matcher: [
        // 정적 파일과 이미지는 제외
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
}
