export const colors = {
  primary: {
    default: "#0064FF",
    light:   "#EBF3FF",
    dark:    "#0047B3",
    hover:   "#0057DB",
  },
  status: {
    red:     "#FF4E4E",
    green:   "#00A878",
    yellow:  "#FFB800",
    orange:  "#FF8C00",
  },
  text: {
    primary:   "#191F28",
    secondary: "#8B95A1",
    tertiary:  "#B0B8C1",
    disabled:  "#D1D6DB",
    inverse:   "#FFFFFF",
  },
  background: {
    page:    "#F2F4F6",
    card:    "#FFFFFF",
    overlay: "rgba(0,0,0,0.5)",
  },
  border: {
    default: "#E5E8EB",
    strong:  "#D1D6DB",
  },
} as const

export const typography = {
  family: '"Pretendard", "Noto Sans KR", sans-serif',
  size: {
    "2xs":  "10px",
    xs:     "12px",
    sm:     "14px",
    base:   "16px",
    lg:     "18px",
    xl:     "20px",
    "2xl":  "24px",
    "3xl":  "28px",
    "4xl":  "32px",
    "5xl":  "40px",
  },
  weight: {
    regular:   400,
    medium:    500,
    semibold:  600,
    bold:      700,
    black:     900,
  },
  lineHeight: {
    tight:  1.2,
    snug:   1.35,
    normal: 1.5,
    relaxed: 1.75,
  },
  letterSpacing: {
    tight: "-0.03em",
    normal: "0em",
    wide: "0.05em",
  },
} as const

export const spacing = {
  "0":   "0px",
  "1":   "4px",
  "2":   "8px",
  "3":   "12px",
  "4":   "16px",
  "5":   "20px",
  "6":   "24px",
  "7":   "28px",
  "8":   "32px",
  "10":  "40px",
  "12":  "48px",
  "16":  "64px",
  "20":  "80px",
} as const

export const radius = {
  sm:   "8px",
  md:   "12px",
  lg:   "16px",
  xl:   "20px",
  "2xl": "24px",
  full: "9999px",
} as const

export const shadow = {
  sm:  "0 1px 4px rgba(0,0,0,0.06)",
  md:  "0 4px 12px rgba(0,0,0,0.08)",
  lg:  "0 8px 24px rgba(0,0,0,0.10)",
  xl:  "0 16px 40px rgba(0,0,0,0.12)",
} as const

export const animation = {
  duration: {
    fast:   "150ms",
    normal: "250ms",
    slow:   "400ms",
  },
  easing: {
    default: "cubic-bezier(0.4, 0, 0.2, 1)",
    spring:  "cubic-bezier(0.34, 1.56, 0.64, 1)",
    out:     "cubic-bezier(0, 0, 0.2, 1)",
  },
} as const
