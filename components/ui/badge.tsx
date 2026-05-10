import { type ReactNode } from "react"

type BadgeVariant = "primary" | "secondary" | "success" | "danger" | "warning" | "neutral"
type BadgeSize    = "sm" | "md"

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
}

const variantStyles: Record<BadgeVariant, { bg: string; color: string }> = {
  primary:   { bg: "var(--toss-blue-light)",  color: "var(--toss-blue)" },
  secondary: { bg: "#F2F4F6",                 color: "var(--toss-text-secondary)" },
  success:   { bg: "#E8F8F5",                 color: "#00A878" },
  danger:    { bg: "#FFF0F0",                 color: "var(--toss-red)" },
  warning:   { bg: "#FFF8E1",                 color: "#FFB800" },
  neutral:   { bg: "var(--toss-text-primary)", color: "#FFFFFF" },
}

const sizeStyles: Record<BadgeSize, string> = {
  sm: "text-[10px] px-2 py-0.5",
  md: "text-xs px-2.5 py-1",
}

export function Badge({ children, variant = "primary", size = "md" }: BadgeProps) {
  const { bg, color } = variantStyles[variant]
  return (
    <span
      className={`inline-flex items-center font-bold rounded-full ${sizeStyles[size]}`}
      style={{ backgroundColor: bg, color }}
    >
      {children}
    </span>
  )
}
