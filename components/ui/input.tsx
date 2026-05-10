"use client"

import { type InputHTMLAttributes, forwardRef, useState } from "react"
import { Eye, EyeOff } from "lucide-react"

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
  leftIcon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, leftIcon, type, className = "", ...props }, ref) => {
    const [showPw, setShowPw] = useState(false)
    const isPassword = type === "password"
    const inputType = isPassword ? (showPw ? "text" : "password") : type

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            className="text-sm font-semibold"
            style={{ color: "var(--toss-text-primary)" }}
          >
            {label}
          </label>
        )}

        <div
          className="flex items-center gap-2 rounded-2xl px-4 py-3 transition-all focus-within:ring-2"
          style={{
            backgroundColor: error ? "#FFF0F0" : "var(--toss-page-bg)",
            border: `1.5px solid ${error ? "var(--toss-red)" : "transparent"}`,
            "--tw-ring-color": error ? "var(--toss-red)" : "var(--toss-blue)",
          } as React.CSSProperties}
        >
          {leftIcon && (
            <span style={{ color: "var(--toss-text-tertiary)" }}>{leftIcon}</span>
          )}
          <input
            ref={ref}
            type={inputType}
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "var(--toss-text-primary)" }}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              style={{ color: "var(--toss-text-tertiary)" }}
            >
              {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          )}
        </div>

        {(hint || error) && (
          <p
            className="text-xs px-1"
            style={{ color: error ? "var(--toss-red)" : "var(--toss-text-tertiary)" }}
          >
            {error ?? hint}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"
