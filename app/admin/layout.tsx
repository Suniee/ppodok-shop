import AdminSidebar from "@/components/admin/AdminSidebar"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    /* admin-mode: 관리자 라우트에서 data-ui-id 툴팁을 활성화 */
    <div className="admin-mode flex h-screen overflow-hidden bg-white">
      <AdminSidebar />
      <div className="flex-1 overflow-auto" style={{ backgroundColor: "var(--toss-page-bg)" }}>
        {children}
      </div>
    </div>
  )
}
