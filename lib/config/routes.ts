export type AppRoute = {
    id: string
    path: string
    title: string
    group: "main" | "auth" | "admin"
}

export const routes: AppRoute[] = [
    // 메인 쇼핑몰
    { id: "home",           path: "/",                  title: "홈",            group: "main" },
    { id: "products",       path: "/products",          title: "전체 상품",     group: "main" },
    { id: "product-detail", path: "/products/:id",      title: "상품 상세",     group: "main" },
    { id: "order",          path: "/order",             title: "주문하기",      group: "main" },
    { id: "orders",         path: "/orders",            title: "주문 내역",     group: "main" },
    { id: "account",        path: "/account",           title: "내 계정",       group: "main" },

    // 인증
    { id: "login",          path: "/login",             title: "로그인",        group: "auth" },
    { id: "signup",         path: "/signup",            title: "회원가입",      group: "auth" },

    // 관리자
    { id: "admin-login",      path: "/admin/login",       title: "관리자 로그인", group: "admin" },
    { id: "admin-products",   path: "/admin/products",    title: "상품 관리",     group: "admin" },
    { id: "admin-reviews",    path: "/admin/reviews",      title: "리뷰 관리",     group: "admin" },
    { id: "admin-qna",        path: "/admin/qna",          title: "Q&A 관리",      group: "admin" },
    { id: "admin-categories", path: "/admin/categories",  title: "카테고리 관리", group: "admin" },
    { id: "admin-banners",    path: "/admin/banners",     title: "배너 관리",     group: "admin" },
    { id: "admin-orders",     path: "/admin/orders",      title: "주문 관리",     group: "admin" },
    { id: "admin-members",    path: "/admin/members",     title: "회원 관리",     group: "admin" },
    { id: "admin-sales",      path: "/admin/sales",              title: "매출 관리",     group: "admin" },
    { id: "admin-company",    path: "/admin/settings/company",   title: "회사 정보",     group: "admin" },
]

/** path 패턴에서 실제 URL 생성 (예: productPath("abc-123") → "/products/abc-123") */
export const productPath = (id: string) => `/products/${id}`
