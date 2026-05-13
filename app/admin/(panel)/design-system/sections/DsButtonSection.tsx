"use client"

import { useState } from "react"
import { DsButton } from "@/components/ui/ds-button"

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-3xl p-8" style={{ border: "1px solid var(--toss-border)" }}>
      <h2
        className="text-lg font-bold mb-6 pb-4"
        style={{ color: "var(--toss-text-primary)", borderBottom: "1px solid var(--toss-border)", letterSpacing: "-0.02em" }}
      >
        {title}
      </h2>
      {children}
    </section>
  )
}

export function DsButtonSection() {
  const [loading, setLoading] = useState(false)

  const handleLoad = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 2000)
  }

  const variants = ["primary", "secondary", "outline", "ghost", "danger"] as const
  const sizes    = ["xs", "sm", "md", "lg"] as const

  return (
    <Section title="🔘 Button">
      <div className="space-y-8">
        {/* Variants */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--toss-text-tertiary)" }}>Variants</p>
          <div className="flex flex-wrap gap-3">
            {variants.map((v) => (
              <DsButton key={v} variant={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</DsButton>
            ))}
          </div>
        </div>

        {/* Sizes */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--toss-text-tertiary)" }}>Sizes</p>
          <div className="flex flex-wrap items-center gap-3">
            {sizes.map((s) => (
              <DsButton key={s} size={s}>Size {s.toUpperCase()}</DsButton>
            ))}
          </div>
        </div>

        {/* States */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--toss-text-tertiary)" }}>States</p>
          <div className="flex flex-wrap items-center gap-3">
            <DsButton>Default</DsButton>
            <DsButton disabled>Disabled</DsButton>
            <DsButton loading={loading} onClick={handleLoad}>
              {loading ? "" : "클릭하면 로딩"}
            </DsButton>
          </div>
        </div>

        {/* Full width */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--toss-text-tertiary)" }}>Full Width</p>
          <div className="max-w-sm space-y-2">
            <DsButton fullWidth>장바구니 담기</DsButton>
            <DsButton fullWidth variant="secondary">찜하기</DsButton>
          </div>
        </div>
      </div>
    </Section>
  )
}
