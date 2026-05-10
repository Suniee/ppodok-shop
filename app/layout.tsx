import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "뽀독샵 - 생활용품 전문 쇼핑몰",
  description: "생활용품, 주방용품, 세제, 식품, 뷰티/화장품 전문 온라인 쇼핑몰 뽀독샵",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className="min-h-full flex flex-col" style={{ backgroundColor: "var(--toss-page-bg)" }}>
        {children}
      </body>
    </html>
  )
}
