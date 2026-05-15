// 관리자 사이드메뉴 정의 — 구조·레이블·href 는 여기서만 관리
// DB(admin_menu_config)는 sort_order·visibility 오버라이드만 저장

export type MenuItemDef = {
    id:                    string
    label:                 string
    href:                  string | null   // null = 그룹 헤더
    icon:                  string          // lucide 컴포넌트 이름 (문자열)
    parentId:              string | null   // null = 최상위
    defaultVisibleSuper:   boolean
    defaultVisibleGeneral: boolean
}

// 순서가 기본 sort_order 역할도 겸함 (index 기반)
export const MENU_ITEMS: MenuItemDef[] = [
    { id: "dashboard",      label: "대시보드",      href: "/admin/dashboard",               icon: "LayoutDashboard", parentId: null,    defaultVisibleSuper: true,  defaultVisibleGeneral: true  },
    { id: "sales",          label: "매출 관리",      href: null,                             icon: "BarChart2",       parentId: null,    defaultVisibleSuper: true,  defaultVisibleGeneral: true  },
    { id: "sales-orders",   label: "주문 조회",      href: "/admin/sales",                   icon: "TrendingUp",      parentId: "sales", defaultVisibleSuper: true,  defaultVisibleGeneral: true  },
    { id: "sales-payments", label: "결제 내역",      href: "/admin/sales/payments",          icon: "CreditCard",      parentId: "sales", defaultVisibleSuper: true,  defaultVisibleGeneral: true  },
    { id: "sales-reconcile",label: "결제 대사",      href: "/admin/reconcile",               icon: "Scale",           parentId: "sales", defaultVisibleSuper: true,  defaultVisibleGeneral: true  },
    { id: "sales-cancel",   label: "교환/환불",      href: "/admin/sales/cancel-requests",   icon: "Undo2",           parentId: "sales", defaultVisibleSuper: true,  defaultVisibleGeneral: true  },
    { id: "members",        label: "회원 관리",      href: "/admin/members",                 icon: "Users",           parentId: null,    defaultVisibleSuper: true,  defaultVisibleGeneral: true  },
    { id: "admins",         label: "관리자 관리",    href: "/admin/admins",                  icon: "ShieldCheck",     parentId: null,    defaultVisibleSuper: true,  defaultVisibleGeneral: false },
    { id: "banners",        label: "배너 관리",      href: "/admin/banners",                 icon: "Image",           parentId: null,    defaultVisibleSuper: true,  defaultVisibleGeneral: true  },
    { id: "products",       label: "상품 관리",      href: "/admin/products",                icon: "Package",         parentId: null,    defaultVisibleSuper: true,  defaultVisibleGeneral: true  },
    { id: "reviews",        label: "리뷰 관리",       href: "/admin/reviews",                 icon: "Star",            parentId: null,    defaultVisibleSuper: true,  defaultVisibleGeneral: true  },
    { id: "qna",            label: "Q&A 관리",       href: "/admin/qna",                     icon: "MessageCircle",   parentId: null,    defaultVisibleSuper: true,  defaultVisibleGeneral: true  },
    { id: "categories",     label: "카테고리 관리",  href: "/admin/categories",              icon: "Tag",             parentId: null,    defaultVisibleSuper: true,  defaultVisibleGeneral: true  },
    { id: "design-system",  label: "디자인 시스템",  href: "/admin/design-system",           icon: "Palette",         parentId: null,    defaultVisibleSuper: true,  defaultVisibleGeneral: true  },
    { id: "policy",         label: "정책관리",        href: "/admin/settings",               icon: "ScrollText",      parentId: null,    defaultVisibleSuper: true,  defaultVisibleGeneral: true  },
    { id: "system",         label: "시스템 설정",    href: null,                             icon: "Settings",        parentId: null,    defaultVisibleSuper: true,  defaultVisibleGeneral: false },
    { id: "system-menu",    label: "메뉴 관리",      href: "/admin/system/menu",             icon: "List",            parentId: "system",defaultVisibleSuper: true,  defaultVisibleGeneral: false },
]

// ---------- 빌드 결과 타입 (사이드바에서 사용) ----------

export type NavItem = {
    type:  "item"
    id:    string
    href:  string
    label: string
    icon:  string
}

export type NavGroup = {
    type:     "group"
    id:       string
    label:    string
    icon:     string
    children: NavItem[]
}

export type NavEntry = NavItem | NavGroup

export type MenuConfig = {
    menuId:         string
    sortOrder:      number
    visibleSuper:   boolean
    visibleGeneral: boolean
}

// DB 설정을 병합하여 사이드바용 NavEntry[] 빌드
export function buildNavEntries(menuConfig: MenuConfig[], isSuperAdmin: boolean): NavEntry[] {
    // DB 설정을 id → config 로 인덱싱
    const configMap = new Map<string, MenuConfig>()
    for (const c of menuConfig) configMap.set(c.menuId, c)

    // 각 메뉴 아이템에 유효 설정 적용
    const resolved = MENU_ITEMS.map((item, idx) => {
        const cfg = configMap.get(item.id)
        return {
            item,
            sortOrder:      cfg?.sortOrder      ?? idx,
            visibleSuper:   cfg?.visibleSuper   ?? item.defaultVisibleSuper,
            visibleGeneral: cfg?.visibleGeneral ?? item.defaultVisibleGeneral,
        }
    })

    // 가시성 필터
    const visible = resolved.filter((r) =>
        isSuperAdmin ? r.visibleSuper : r.visibleGeneral
    )

    // 최상위 아이템을 sort_order 로 정렬 (자식은 부모 기준 상대 순서 유지)
    const topLevel = visible
        .filter((r) => r.item.parentId === null)
        .sort((a, b) => a.sortOrder - b.sortOrder)

    const result: NavEntry[] = []

    for (const top of topLevel) {
        if (top.item.href !== null) {
            // 단일 메뉴 아이템
            result.push({ type: "item", id: top.item.id, href: top.item.href, label: top.item.label, icon: top.item.icon })
        } else {
            // 그룹 — 자식들을 부모 sort_order 기준 그대로 수집
            const children = visible
                .filter((r) => r.item.parentId === top.item.id)
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((r): NavItem => ({
                    type:  "item",
                    id:    r.item.id,
                    href:  r.item.href!,
                    label: r.item.label,
                    icon:  r.item.icon,
                }))

            if (children.length > 0) {
                result.push({ type: "group", id: top.item.id, label: top.item.label, icon: top.item.icon, children })
            }
        }
    }

    return result
}
