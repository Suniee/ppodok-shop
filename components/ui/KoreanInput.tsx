"use client"

import { useRef } from "react"

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> & {
  value: string
  onValueChange: (value: string) => void
}

export function KoreanInput({ value, onValueChange, ...props }: Props) {
  const composingRef = useRef(false)

  return (
    <input
      {...props}
      value={value}
      onChange={(e) => {
        if (!composingRef.current) onValueChange(e.target.value)
      }}
      onCompositionStart={() => { composingRef.current = true }}
      onCompositionEnd={(e) => {
        composingRef.current = false
        onValueChange((e.target as HTMLInputElement).value)
      }}
    />
  )
}
