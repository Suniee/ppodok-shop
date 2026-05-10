import { colors, typography, spacing, radius, shadow } from "@/lib/design-system/tokens"
import { Badge } from "@/components/ui/badge"
import { DsButtonSection } from "./sections/DsButtonSection"
import { DsInputSection } from "./sections/DsInputSection"
import { DsProductCardSection } from "./sections/DsProductCardSection"

/* ─── Section wrapper ─────────────────────────────────────── */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-3xl p-8" style={{ border: "1px solid var(--toss-border)" }}>
      <h2
        className="text-lg font-bold mb-6 pb-4"
        style={{
          color: "var(--toss-text-primary)",
          borderBottom: "1px solid var(--toss-border)",
          letterSpacing: "-0.02em",
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  )
}

function TokenRow({ label, value, preview }: { label: string; value: string; preview?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 py-2.5" style={{ borderBottom: "1px solid var(--toss-border)" }}>
      {preview}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: "var(--toss-text-primary)" }}>{label}</p>
        <p className="text-xs font-mono mt-0.5" style={{ color: "var(--toss-text-tertiary)" }}>{value}</p>
      </div>
    </div>
  )
}

/* ─── Color palette ──────────────────────────────────────── */
function ColorSection() {
  const groups = [
    { title: "Primary", entries: Object.entries(colors.primary) },
    { title: "Status", entries: Object.entries(colors.status) },
    { title: "Text", entries: Object.entries(colors.text) },
    { title: "Background", entries: Object.entries(colors.background).filter(([k]) => k !== "overlay") },
    { title: "Border", entries: Object.entries(colors.border) },
  ]

  return (
    <Section title="🎨 Colors">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {groups.map((g) => (
          <div key={g.title}>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--toss-text-tertiary)" }}>
              {g.title}
            </p>
            <div className="space-y-1">
              {g.entries.map(([key, val]) => (
                <TokenRow
                  key={key}
                  label={key}
                  value={val}
                  preview={
                    <div
                      className="w-9 h-9 rounded-xl flex-shrink-0 shadow-sm"
                      style={{
                        backgroundColor: val,
                        border: "1px solid var(--toss-border)",
                      }}
                    />
                  }
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}

/* ─── Typography ─────────────────────────────────────────── */
function TypographySection() {
  const sizes = Object.entries(typography.size)

  return (
    <Section title="✏️ Typography">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Scale */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--toss-text-tertiary)" }}>Size Scale</p>
          <div className="space-y-1">
            {sizes.map(([key, val]) => (
              <div key={key} className="flex items-baseline gap-4 py-2" style={{ borderBottom: "1px solid var(--toss-border)" }}>
                <span
                  style={{ fontSize: val, fontWeight: typography.weight.semibold, color: "var(--toss-text-primary)", lineHeight: 1.2 }}
                >
                  뽀독샵
                </span>
                <span className="text-xs font-mono ml-auto" style={{ color: "var(--toss-text-tertiary)" }}>
                  {key} · {val}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Weight */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--toss-text-tertiary)" }}>Weight</p>
          <div className="space-y-1">
            {Object.entries(typography.weight).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid var(--toss-border)" }}>
                <span
                  style={{ fontSize: "18px", fontWeight: val, color: "var(--toss-text-primary)" }}
                >
                  생활의 발견
                </span>
                <span className="text-xs font-mono" style={{ color: "var(--toss-text-tertiary)" }}>
                  {key} · {val}
                </span>
              </div>
            ))}
          </div>

          <p className="text-xs font-bold uppercase tracking-widest mb-4 mt-8" style={{ color: "var(--toss-text-tertiary)" }}>Semantic Roles</p>
          {[
            { role: "Display", size: "40px", weight: 900, sample: "뽀독샵" },
            { role: "Heading 1", size: "28px", weight: 700, sample: "카테고리 전체보기" },
            { role: "Heading 2", size: "20px", weight: 700, sample: "신상품 New Arrivals" },
            { role: "Body", size: "16px", weight: 400, sample: "상품을 둘러보세요" },
            { role: "Caption", size: "12px", weight: 400, sample: "평일 10:00 ~ 18:00" },
            { role: "Label", size: "10px", weight: 700, sample: "BEST · NEW · SALE" },
          ].map((t) => (
            <div key={t.role} className="py-3" style={{ borderBottom: "1px solid var(--toss-border)" }}>
              <p className="text-[10px] font-bold mb-1" style={{ color: "var(--toss-text-tertiary)" }}>{t.role}</p>
              <span style={{ fontSize: t.size, fontWeight: t.weight, color: "var(--toss-text-primary)", letterSpacing: "-0.02em" }}>
                {t.sample}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Section>
  )
}

/* ─── Spacing ────────────────────────────────────────────── */
function SpacingSection() {
  return (
    <Section title="📐 Spacing">
      <div className="space-y-1">
        {Object.entries(spacing).map(([key, val]) => (
          <div key={key} className="flex items-center gap-5 py-2" style={{ borderBottom: "1px solid var(--toss-border)" }}>
            <span className="w-8 text-xs font-mono text-right flex-shrink-0" style={{ color: "var(--toss-text-tertiary)" }}>{key}</span>
            <div
              className="rounded"
              style={{
                width: val,
                height: "20px",
                backgroundColor: "var(--toss-blue)",
                opacity: 0.7,
                minWidth: "4px",
              }}
            />
            <span className="text-xs font-mono" style={{ color: "var(--toss-text-secondary)" }}>{val}</span>
          </div>
        ))}
      </div>
    </Section>
  )
}

/* ─── Radius ─────────────────────────────────────────────── */
function RadiusSection() {
  return (
    <Section title="⬛ Border Radius">
      <div className="flex flex-wrap gap-6">
        {Object.entries(radius).map(([key, val]) => (
          <div key={key} className="flex flex-col items-center gap-2">
            <div
              className="w-16 h-16 bg-[var(--toss-blue-light)]"
              style={{ borderRadius: val, border: "2px solid var(--toss-blue)" }}
            />
            <span className="text-xs font-semibold" style={{ color: "var(--toss-text-primary)" }}>{key}</span>
            <span className="text-[10px] font-mono" style={{ color: "var(--toss-text-tertiary)" }}>{val}</span>
          </div>
        ))}
      </div>
    </Section>
  )
}

/* ─── Shadow ─────────────────────────────────────────────── */
function ShadowSection() {
  return (
    <Section title="🌫️ Shadow">
      <div className="flex flex-wrap gap-8">
        {Object.entries(shadow).map(([key, val]) => (
          <div key={key} className="flex flex-col items-center gap-3">
            <div
              className="w-20 h-20 bg-white rounded-2xl"
              style={{ boxShadow: val }}
            />
            <span className="text-xs font-semibold" style={{ color: "var(--toss-text-primary)" }}>shadow-{key}</span>
            <span className="text-[10px] font-mono text-center w-32 leading-snug" style={{ color: "var(--toss-text-tertiary)" }}>
              {val}
            </span>
          </div>
        ))}
      </div>
    </Section>
  )
}

/* ─── Badge ─────────────────────────────────────────────── */
function BadgeSection() {
  const variants = ["primary", "secondary", "success", "danger", "warning", "neutral"] as const
  const sizes    = ["sm", "md"] as const

  return (
    <Section title="🏷️ Badge">
      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--toss-text-tertiary)" }}>Variants</p>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <Badge key={v} variant={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</Badge>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--toss-text-tertiary)" }}>Sizes</p>
          <div className="flex flex-wrap items-center gap-2">
            {sizes.map((s) => (
              <Badge key={s} size={s}>Size {s.toUpperCase()}</Badge>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--toss-text-tertiary)" }}>In context</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="neutral" size="sm">NEW</Badge>
            <Badge variant="danger" size="sm">SALE</Badge>
            <Badge variant="primary" size="sm">BEST</Badge>
            <Badge variant="warning" size="sm">한정수량</Badge>
            <Badge variant="success" size="sm">무료배송</Badge>
            <Badge variant="secondary" size="sm">품절임박</Badge>
          </div>
        </div>
      </div>
    </Section>
  )
}

/* ─── Page ───────────────────────────────────────────────── */
export default function DesignSystemPage() {
  return (
    <div className="max-w-5xl mx-auto px-5 py-8 pb-20">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <span
            className="text-xs font-bold px-3 py-1 rounded-full"
            style={{ backgroundColor: "var(--toss-blue-light)", color: "var(--toss-blue)" }}
          >
            v1.0.0
          </span>
          <span className="text-xs" style={{ color: "var(--toss-text-tertiary)" }}>
            뽀독샵 Design System
          </span>
        </div>
        <h1
          className="text-4xl font-black mb-3"
          style={{ color: "var(--toss-text-primary)", letterSpacing: "-0.04em" }}
        >
          디자인 시스템
        </h1>
        <p className="text-base" style={{ color: "var(--toss-text-secondary)" }}>
          뽀독샵의 모든 UI를 구성하는 디자인 토큰과 컴포넌트 라이브러리입니다.
        </p>
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-5">
        <ColorSection />
        <TypographySection />
        <SpacingSection />
        <RadiusSection />
        <ShadowSection />
        <BadgeSection />
        <DsButtonSection />
        <DsInputSection />
        <DsProductCardSection />
      </div>
    </div>
  )
}
