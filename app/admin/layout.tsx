import AdminSidebar from "@/components/admin/AdminSidebar"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <AdminSidebar />
      <div className="flex-1 overflow-auto" style={{ backgroundColor: "var(--toss-page-bg)" }}>
        {children}
      </div>
    </div>
  )
}
