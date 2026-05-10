"use client"

import { type ButtonHTMLAttributes, forwardRef } from "react"
import { motion } from "framer-motion"

type BtnVariant = "primary" | "secondary" | "ghost" | "danger" | "outline"
type BtnSize    = "xs" | "sm" | "md" | "lg"

interface DsButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant
  size?: BtnSize
  fullWidth?: boolean
  loading?: boolean
}

const variantMap: Record<BtnVariant, { bg: string; color: string; border?: string }> = {
  primary:   { bg: "var(--toss-blue)",         color: "#fff" },
  secondary: { bg: "var(--toss-blue-light)",   color: "var(--toss-blue)" },
  ghost:     { bg: "transparent",              color: "var(--toss-text-secondary)" },
  danger:    { bg: "var(--toss-red)",          color: "#fff" },
  outline:   { bg: "transparent",             color: "var(--toss-text-primary)", border: "1.5px solid var(--toss-border)" },
}

const sizeMap: Record<BtnSize, string> = {
  xs: "text-[11px] px-3 py-1.5 rounded-xl",
  sm: "text-xs px-4 py-2 rounded-xl",
  md: "text-sm px-5 py-2.5 rounded-2xl",
  lg: "text-base px-7 py-3.5 rounded-2xl",
}

export const DsButton = forwardRef<HTMLButtonElement, DsButtonProps>(
  ({ variant = "primary", size = "md", fullWidth, loading, children, disabled, className = "", style, ...props }, ref) => {
    const v = variantMap[variant]
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.96 }}
        whileHover={{ opacity: 0.88 }}
        transition={{ duration: 0.15 }}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center font-semibold transition-opacity select-none ${sizeMap[size]} ${fullWidth ? "w-full" : ""} ${disabled || loading ? "opacity-40 cursor-not-allowed" : ""} ${className}`}
        style={{ backgroundColor: v.bg, color: v.color, border: v.border, ...style }}
        {...(props as object)}
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : children}
      </motion.button>
    )
  }
)
DsButton.displayName = "DsButton"
